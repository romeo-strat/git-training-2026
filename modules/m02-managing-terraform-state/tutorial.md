# M02 — Managing Terraform State

*A self-guided tour: from local state on your machine to a protected S3 backend with locking.*

---

Terraform keeps a written record of what it created. That record is called **state**. This tour starts with state on your own machine and then moves it into a protected S3 bucket, one part at a time. It shows you the **moves** — the files to write, the commands to run, the checks to make — and gives you checkpoints so you always know whether you're on track.

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

This stage builds on M01. You do not need to remember everything from it, but you do need the tools and the AWS sign-in it set up. The section below tells you what you should already have.

## How to use this tour

Work through the six parts in order. Each part has the same simple shape:

| Box | What it means |
| --- | --- |
| **Try it** | A command or action to perform now. |
| **Checkpoint** | What you should see if you got it right. If you don't, stop and fix it before moving on. |
| **Pause and predict** | Think before you act. Write down your guess, then check it against what actually happens. |
| **Example** | A worked illustration of the *shape* of a file, a command's output, or a note's format. Placeholders sit in `<angle brackets>`; yours will differ. |
| **Your turn** | One of your brief's research prompts. Investigate it and record your answer in your write-up. |
| **Watch out** | A common trap. Read it before you hit it. |
| **Explain it** | A nudge to say something in your own words — this is what you'll be asked to teach later. |

You'll see **Example** boxes often. They show you the **shape** of things — a file's structure, what a command's output looks like, how to lay out your notes — so the mechanics are never a surprise. Two rules about them:

- An Example never contains the answer to a research prompt. If it looks like it might, it deliberately stops short: the last step is always yours.
- **Never paste an Example as your own evidence.** Your evidence must be real output from *your* machine. Examples are teaching aids, not proof.

## Where you're headed

By the end of this tour you'll have:

- inspected your own local state, read-only, and seen where a sensitive value sits;
- a protected S3 bucket — versioned, encrypted, with public access blocked — that outlives the stage;
- a configuration whose local state you migrated into that bucket as its remote backend, with a plan showing nothing was recreated;
- native locking demonstrated with a real lock error;
- evidence for every item in your brief's definition of done.

*First run: about 95 minutes end to end — writing, applying, migrating, proving the lock, and cleaning up. Your bucket keeps billing for as long as it exists; look up the price before you create it.*

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially whether your sandbox role can create and delete the lock object (if it can't, that's a sandbox gap to raise, not something to work around).

---

## Before you begin — find your footing

This tour assumes you finished M01. It does **not** assume you remember it. If you have never opened a terminal, written a file for a computer to read, or signed in to AWS, work through M01's "Before you begin" section first ([M01 tutorial](../../modules/m01-getting-started-with-terraform/tutorial.md)), then come back. This section is the short version you need here: check your tools, re-find your feet, and set up the editor and the two terminals this stage uses.

### Check your three tools

Run these one at a time. Each one only prints information; none of them change anything:

```
terraform -version
aws sts get-caller-identity
git --version
```

The first prints the Terraform version. It must match the version pinned in `versions.env` — not "close enough". The second prints who you are in AWS: an account and a role. It is **JSON** — plain text arranged in `"key": value` pairs — and the `Arn` should contain `assumed-role`, not an IAM user. Redact the account number and any account-specific IDs before you paste it anywhere. Your **sandbox** is the practice AWS account your trainer prepared; the **role** is the set of permissions your session uses. Both are assumed for the session, not keys you store. The third command prints a Git version.

If any of them fails, stop and fix it with M01 rather than working around it. An AWS problem here becomes a much more confusing error in Part 1.

### Three commands to re-orient

Your terminal always sits in some folder, and `cd` is how you move it. Thirty seconds of practice:

```
pwd
ls
```

**pwd** means "print working directory": it prints the folder you are in. **ls** means "list": it prints the files and folders inside it. Names that start with a dot are **hidden** from a plain `ls`; add `-a` to see them:

```
ls -a
```

You will use `ls -a` to check for `.terraform`, the hidden folder `terraform init` creates.

### Your editor and two terminals

An **editor** is the program where you write the files. This course uses **Visual Studio Code** (VS Code). Part 1 opens your build folder in it from the terminal with `code .` — the `.` means "this folder". If the terminal answers *command not found*, open the folder from VS Code's **File → Open** menu instead, or install the `code` command as M01 describes.

Part 5 needs **two terminals in the same folder at the same time**. In VS Code, **Terminal → New Terminal** opens a second one, and the split-terminal button puts them side by side. Both must run in the same folder and use the same AWS session. You do not need to set that up yet — just know where the button is before you reach the lock demonstration.

### Git, in one paragraph

**Git** is a tool that keeps a saved history of a folder's files, so you can prove what changed and when. You start the history in each build folder with `git init`. From then on, `git status` shows what has changed, `git add <file>` puts a file into the next snapshot, and `git commit -m "<message>"` saves the snapshot with a short message. This stage has one rule that overrides everything else: **state files are never committed.** You add the ignore rule in Part 2, before your first commit, and you will see exactly why there.

### Keep `versions.env` open

The course repository has a file at its root called `versions.env`. It lists the exact tool versions this course pins. Open it in VS Code now and keep it in a tab: the next parts ask you to copy a version *from that file*, and reading it yourself is part of the work. This tour never copies the numbers in for you.

### The two folders you will build

You will build two separate configurations, in two folders:

| Folder | What it holds | Where its state lives |
| --- | --- | --- |
| `m02-state-lab` | One small `aws_ssm_parameter` | Local at first, then the S3 bucket |
| `m02-state-bucket` | The bucket and its protections | Local, in that folder |

They are separate because the bucket is the one thing this stage keeps when everything else is destroyed. The bucket configuration's own state stays local in `m02-state-bucket`: keep that folder and its state file while the bucket exists, but never commit the state file.

By the end, the two folders look like this:

```
m02-state-lab/
  main.tf               one aws_ssm_parameter, plus the S3 backend after Part 4
  .gitignore            keeps state out, keeps the lock file in
  .terraform/           created by init — hidden, never commit
  .terraform.lock.hcl   created by init — commit this

m02-state-bucket/
  main.tf               the bucket and its three protections
  .gitignore            same rule
  .terraform/           hidden, never commit
  .terraform.lock.hcl   commit this
```

Splitting a configuration's blocks into `versions.tf`, `providers.tf` and `backend.tf` is equally valid; this stage keeps each folder in one `main.tf` so there are fewer files between you and the state story.

### The words this stage turns on

Terraform is full of short words that carry a lot of meaning. These are the ones this stage uses constantly; the rest are defined where they first appear. Do not memorise the table — come back to it when a word is unfamiliar.

| Word | What it means in this stage |
| --- | --- |
| **state** | Terraform's written record of what it is managing. |
| **local state** | State stored on your own machine, in `terraform.tfstate`. |
| **remote state** | State stored somewhere other than your machine — here, in an S3 bucket. |
| **backend** | The place Terraform reads and writes state. The S3 backend keeps state in a bucket. |
| **S3** | AWS's object-storage service. You put files into it and read them back later. |
| **bucket** | A container in S3. Bucket names are globally unique across all of AWS. |
| **object** | One file inside a bucket. Your state becomes one object. |
| **key** | The object's name or path inside the bucket. It is **not** a password or an access key. |
| **lock** | A marker Terraform takes while an operation runs, so a second operation can tell one is already in progress. |
| **sensitive value** | A value Terraform hides in CLI output — but still writes into state. |
| **versioning** | An S3 setting that keeps multiple versions of an object instead of overwriting the old one. |
| **public access block** | The S3 setting that prevents a bucket from being made public. |

### Reading the commands

- A line starting with `#` is a **comment** — an explanation for you. The computer never sees it, so do not type the `#` part.
- Text in `<angle brackets>` is a **placeholder**. Replace the whole `<...>` with your real value; never type the angle brackets.
- A `$` at the start of a line is the prompt your terminal prints. Do not type the `$`.
- Output in this tour may be trimmed with `...`. Your real output will be longer, and some values will differ.
- Never paste an Example as evidence. Your evidence is the output from your own terminal.

### Make your write-up copy

If `write-up.md` does not exist yet, make it from the template now. Work in the stage folder where you found [write-up-template.md](../../modules/m02-managing-terraform-state/write-up-template.md):

```
cp write-up-template.md write-up.md
```

Leave `write-up-template.md` untouched. Fill in `write-up.md` as you go. If a `write-up.md` already exists, keep it and use it; do not overwrite the template.

---

## Part 1 — Local state, seen for the first time

**Goal:** write a small configuration, apply it, and watch a state file appear on your machine.

*First-run estimate: about 20 minutes.*

State is the part of Terraform that most people meet only when it breaks. This stage starts by building a tiny configuration so you have your *own* state to inspect — not a slide.

### 1a. Create the first folder and configuration

A **configuration** is the set of `.tf` files in one folder. Terraform reads every `.tf` file in that folder; the file names are yours to choose. This tour keeps the whole first configuration in one file, `main.tf`, so there are fewer moving parts to follow.

**Try it**

1. Create a folder for this configuration and move into it. `mkdir` makes the folder, `cd` moves your terminal into it, `git init` starts a Git history there, and `code .` opens the folder in VS Code:

```
mkdir m02-state-lab
cd m02-state-lab
git init
code .
```

If the terminal answers *command not found* for `code`, open the same folder from VS Code's **File → Open** menu instead.

2. Create a file called `main.tf` and add the blocks below. Replace each `<placeholder>` with your own value.
3. Read the Terraform and AWS provider versions from `versions.env` at the root of this repository. Do not guess them.

**Example — a complete `main.tf` for the first configuration**

```
terraform {
  required_version = "<the Terraform version pinned in versions.env>"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "<the AWS provider version pinned in versions.env>"
    }
  }
}

provider "aws" {
  region = "<your sandbox region>"
}

resource "aws_ssm_parameter" "placeholder" {
  name  = "/m02/<your-name>-state-lab"
  type  = "String"
  value = "<a-made-up-placeholder-password>"
}
```

Read the file from the outside in:

- The `terraform` block declares what Terraform itself needs. `required_version` is the Terraform version; `required_providers` names the AWS provider and the version you are pinning. A **provider** is a plug-in that lets Terraform talk to one cloud service — here, AWS.
- The `provider "aws"` block tells Terraform *where* in AWS to work. `region` is the part of the world where AWS runs your resources, such as `eu-west-1`, and it must be the same region your sandbox uses — if you don't know it, check your sandbox invitation, run `aws configure get region`, or ask your trainer. Credentials come from the AWS CLI session you signed in with; there is no key in this file.
- The `resource` block is one thing Terraform will manage. `aws_ssm_parameter` is the **type**; `placeholder` is the **name** you chose. Inside the braces are **arguments** — the settings you supply.
- An `aws_ssm_parameter` is a named value stored in AWS Systems Manager Parameter Store: think of it as a settings entry an application can read. It is tiny and nearly free, which is why the lab uses it.
- `name` must be unique in your account and region, so include your own name. `value` must be a **made-up placeholder**, never a real password.

Before `init`, the folder holds two things: the file you wrote, and Git's hidden history folder. `ls -a` shows both:

```
m02-state-lab/
  main.tf
  .git/          created by git init — hidden
```

### 1b. Initialise, validate and apply

**Pause and predict.** Before you start, guess whether a state file will appear at all, and what it might contain. Write your guess down. Then run the steps and look. Were you right?

**Try it**

1. Prepare the folder. `init` downloads the provider and sets up the folder for Terraform:

```
terraform init
```

2. Check the configuration's formatting and syntax:

```
terraform fmt
terraform validate
```

3. Create the parameter. `apply` shows you a plan and then asks for approval:

```
terraform apply
```

4. Read the plan carefully, then type `yes` at the approval prompt.
5. Look in the folder. A `terraform.tfstate` file appears.

**Checkpoint**

- `init` reports that Terraform has been successfully initialized, and creates a `.terraform` folder and a `.terraform.lock.hcl` file.
- `validate` prints `Success! The configuration is valid.`
- `apply` asks for approval, then ends with a summary like `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`
- `terraform.tfstate` is now in the folder; you may also see `terraform.tfstate.backup` beside it.

**Example — what `init` and `apply` print (trimmed)**

```
Initializing provider plugins...
- Finding hashicorp/aws versions matching "..."
- Installing hashicorp/aws ...
- Installed hashicorp/aws ...

Terraform has created a lock file .terraform.lock.hcl ...

Terraform has been successfully initialized!
```

```
Terraform will perform the following actions:

  # aws_ssm_parameter.placeholder will be created
  + resource "aws_ssm_parameter" "placeholder" {
      + name  = "/m02/<your-name>-state-lab"
      + type  = "String"
      + value = (sensitive value)
      + ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Enter a value: yes

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

The plan shows `(sensitive value)` where the parameter's value would be. Terraform marks this argument sensitive, so the CLI hides it. Part 2 looks at what the state file itself holds for that argument.

**Example — your folder after `init` and `apply`**

```
m02-state-lab/
├── main.tf
├── .git/                 created by git init — hidden
├── .terraform/           created by init — hidden, never commit
├── .terraform.lock.hcl   created by init — commit this
├── terraform.tfstate     created by apply — never commit
└── terraform.tfstate.backup
```

`.terraform/` holds the downloaded provider code; it is disposable and must never be committed. `.terraform.lock.hcl` records the provider version Terraform selected; it must be committed. `terraform.tfstate` is the record this whole stage is about — and the file you ignore before your first commit in Part 2.

**Your turn**

- **What would you check before trusting a state file you did not create — and what goes wrong when state is edited by hand?**

> **Watch out.** Do not put a real password, key or token in the `value`. A made-up placeholder is enough, and keeping real credentials out of state is a rule your definition of done checks (DoD-02). Do not run `git add .` until you have added the ignore rule in Part 2: it could stage the state file. If Terraform cannot find credentials, confirm that `aws sts get-caller-identity` works in the same terminal and that you are using the same AWS profile.

> **Explain it.** In one sentence, say what the state file is *for*, as if to a teammate who has never used Terraform.

---

## Part 2 — Inspecting state, read-only — and why it's sensitive

**Goal:** look at your own state without changing anything, and see where a sensitive value sits.

*First-run estimate: about 10 minutes.*

You can read state with Terraform's own subcommands, or by opening the file. Both are **read-only** here: in this stage you change nothing about state outside the plan and apply cycle.

**Pause and predict.** Before you start, guess whether your placeholder value will appear in `terraform.tfstate` just as you typed it. Write your guess down. Then look. Were you right?

**Try it**

1. List what your state is tracking:

```
terraform state list
```

2. Show one resource in detail:

```
terraform state show aws_ssm_parameter.placeholder
```

3. Open `terraform.tfstate` in your editor and find where the placeholder value sits. From the terminal you can open it with:

```
code terraform.tfstate
```

If `code` is not on your PATH, open the file from VS Code's **File → Open** menu instead.

4. Add an ignore rule so state never goes into version control. Create or edit `.gitignore` in this folder. Its contents should be:

```
.terraform/
terraform.tfstate*
```

5. Check what Git sees, then commit only the files that belong in history:

```
git status
git add main.tf .gitignore .terraform.lock.hcl
git commit -m "Add the state lab and ignore local state"
```

If Git asks who you are on your first commit, set your name and email once with `git config --global user.name "<your name>"` and `git config --global user.email "<your email>"`, then run the commit again.

**Checkpoint**

- `state list` names your one resource.
- `state show` prints its attributes, with the value shown as `(sensitive value)`.
- You can point to the placeholder value inside `terraform.tfstate`, where it appears in cleartext.
- `git status` does **not** list `terraform.tfstate`.
- Your commit includes `main.tf`, `.gitignore` and `.terraform.lock.hcl`.

**Example — `state list` and `state show` (trimmed)**

```
$ terraform state list
aws_ssm_parameter.placeholder

$ terraform state show aws_ssm_parameter.placeholder
# aws_ssm_parameter.placeholder:
resource "aws_ssm_parameter" "placeholder" {
    arn      = "..."
    id       = "/m02/<your-name>-state-lab"
    name     = "/m02/<your-name>-state-lab"
    type     = "String"
    value    = (sensitive value)
    ...
}
```

`state list` gives you **addresses** — the `type.name` pair Terraform uses to identify a resource. `state show` takes one address and prints that resource's stored attributes. In that output, `arn` is AWS's address format for the resource; it contains your account ID, so redact it before you paste.

Notice that `state show` hides the value as `(sensitive value)`, the same masking you saw in the plan. That is the CLI protecting you on screen. Opening `terraform.tfstate` is different: it is Terraform's raw record, so the placeholder sits there in cleartext. That contrast — hidden in the command, readable in the file — is the point of this part. Opening `terraform.tfstate` shows the same information as JSON, which is plain text arranged in `"key": value` pairs. All three are read-only: look, take notes, and change nothing.

Look at the attributes Terraform is holding for a resource you wrote five lines for. What your state file records — and who can read it — is exactly what this stage is about.

**Example — the `.gitignore` that keeps state out**

```
.terraform/
terraform.tfstate*
```

The first line ignores the downloaded provider code. The second ignores `terraform.tfstate` and every backup or temporary state file beside it. `.terraform.lock.hcl` does **not** match either line, so it stays committed.

**Your turn**

- **What can leak a secret into state, and how would you demonstrate that safely without a real credential?**
- **Why does the course treat a state file as sensitive even when the configuration contains no secrets?**

> **Watch out.** Treat every state file as if it already contains a secret. Do the inspection read-only, redact anything account-specific before you paste it into your write-up, and never commit the file (DoD-06 checks the ignore rule and a clean history). Never edit state by hand — not to fix a value, not to remove a resource, not "just this once."

> **Explain it.** In one sentence, say what "read-only" means here, and why it matters.

---

## Part 3 — Building and protecting the state bucket

**Goal:** create the S3 bucket that will hold your state — versioned, encrypted, private — in its own folder, with its own local state.

*First-run estimate: about 20 minutes.*

**This bucket is kept when everything else is destroyed.** Later stages keep their state in it too, so build it as something you would trust to hold their state.

An **S3 bucket** is a container in AWS object storage. A bucket name is globally unique across all AWS accounts, so choose something unlikely to collide. Use only lowercase letters, numbers, dots and hyphens, and keep the name between 3 and 63 characters.

**Pause and predict.** Before you start, guess whether Terraform will make your bucket private or leave it public. Write your guess down. Then check from the cloud side. Were you right?

**Try it**

1. Move out of the first folder and create the bucket folder. Notice that `cd ..` goes **up** one level — the two dots mean "the parent folder":

```
cd ..
mkdir m02-state-bucket
cd m02-state-bucket
git init
code .
```

2. Create a `main.tf` with the blocks below. Replace every `<placeholder>`.
3. Look up what the bucket bills **before** you create it. A state object is tiny — usually a few kilobytes — so your estimate is storage for that object plus the PUT, GET and DELETE requests Terraform makes when it reads state and takes and releases the lock. Open the AWS pricing page for S3, estimate those, and write the estimate in your notes. This course does not use billing APIs; your estimate is the evidence.
4. Prepare, format, validate and apply:

```
terraform init
terraform fmt
terraform validate
terraform apply
```

5. Read the plan, then type `yes` at the approval prompt.
6. Confirm from the **cloud side** — not from your configuration — that versioning is on, encryption is on, and public access is fully blocked. Use the commands in the Example below, or the S3 console: your bucket → **Properties** for versioning and default encryption, and **Permissions** for Block public access.
7. Add the same ignore rule to this folder **before you stage anything**. Contents of `.gitignore`:

```
.terraform/
terraform.tfstate*
```

Then commit only safe files:

```
git add main.tf .gitignore .terraform.lock.hcl
git commit -m "Add the protected state bucket"
```

**Example — the shape of the bucket configuration**

```
terraform {
  required_version = "<the Terraform version pinned in versions.env>"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "<the AWS provider version pinned in versions.env>"
    }
  }
}

provider "aws" {
  region = "<your sandbox region>"
}

resource "aws_s3_bucket" "state" {
  bucket = "<globally-unique-bucket-name>"
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

The AWS provider models each protection as a separate resource, so there are four resources here even though there is one bucket. `aws_s3_bucket` creates the container. The versioning resource keeps old versions of the state object. The encryption resource tells S3 to store objects with `AES256` encryption, which means S3 manages the encryption key for you. The public access block sets all four public-access guards. These are the fields the pinned provider version expects. **How narrow you can make access without breaking Terraform is one of your research prompts.**

This folder now has the same shape as the first one: `main.tf`, `.gitignore`, `.terraform/` (ignored), `.terraform.lock.hcl` (committed) and `terraform.tfstate` (ignored).

**Checkpoint**

- The bucket exists.
- `get-bucket-versioning` reports `Enabled`.
- `get-bucket-encryption` reports `AES256`.
- `get-public-access-block` reports all four settings as `true`.
- Every protection is visible from the cloud side, not only in your `.tf` files.
- `git status` does not list `terraform.tfstate` in either folder.

**Example — cloud-side checks and their output shapes**

```
aws s3api get-bucket-versioning --bucket <your-bucket-name>
```

```
{
    "Status": "Enabled"
}
```

```
aws s3api get-bucket-encryption --bucket <your-bucket-name>
```

```
{
    "ServerSideEncryptionConfiguration": {
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }
}
```

```
aws s3api get-public-access-block --bucket <your-bucket-name>
```

```
{
    "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }
}
```

These are the shapes to recognise. Your real output is the evidence; copy it, trim it to the relevant lines, and redact anything account-specific.

**Your turn**

- **How did you solve the problem of creating the thing that stores your state — and what would you do differently on a team?**
- **Who and what needs access to the bucket, and how narrow can you make that without breaking Terraform?**
- **Why is the bucket kept when everything else is destroyed — and what risk does that carry?**

> **Watch out.** Do not skip the cloud-side check. "It's in my configuration" is not evidence that it is *actually* encrypted or private; DoD-04 wants it confirmed from the cloud. If `apply` fails with `BucketAlreadyExists`, the name is taken by another AWS account — choose a more specific name and try again. Do not run `terraform destroy` in this folder: it would delete the bucket this stage keeps.

> **Explain it.** In one sentence, say what each of the three protections changes about the bucket.

---

## Part 4 — Moving state into the backend, and proving nothing changed

**Goal:** point the first configuration at the bucket and migrate its local state into it — without recreating anything.

*First-run estimate: about 15 minutes.*

A **backend** is where Terraform stores state. Until now yours has been **local** — the `terraform.tfstate` file in your folder. The **S3 backend** stores that same record as an object in your bucket. The object's **key** is its name inside the bucket, such as `state-lab.tfstate`. It is not a password and not an access key.

The brief requires Terraform 1.11 or later for **native locking**, which is switched on with `use_lockfile = true`. Read the exact version from `versions.env`. No DynamoDB table is used or created in this stage; DynamoDB is a separate AWS database service, and older S3 locking used a table there.

**Pause and predict.** Before you start, predict: after the migration, will Terraform want to recreate your parameter, or leave it alone? Write your guess down. Then run the steps and compare.

**Try it**

1. Move back to the first configuration:

```
cd ../m02-state-lab
```

2. Add a `backend "s3"` block to `main.tf`. If the file already has a `terraform` block, put the `backend` block inside it.
3. Fill in the bucket name, the key, and the same region you used for the bucket. Leave `use_lockfile = true`.
4. Migrate the existing local state into the new backend:

```
terraform init -migrate-state
```

5. Read what Terraform asks. It offers to copy your existing state to the new backend; type `yes`.

6. Check that nothing was recreated:

```
terraform plan
```

7. Confirm the state object is in the bucket:

```
aws s3 ls s3://<your-bucket-name>/
```

8. Confirm Terraform is now reading the remote state:

```
terraform state list
```

**Checkpoint**

- `init -migrate-state` completes and says it configured the new backend.
- `plan` reports **no changes** — nothing was recreated.
- The bucket listing shows a `.tfstate` object with the key you chose.
- `terraform state list` still names `aws_ssm_parameter.placeholder`.

**Example — the backend block**

```
terraform {
  backend "s3" {
    bucket       = "<your state bucket>"
    key          = "<your-state-key>.tfstate"
    region       = "<your region>"
    use_lockfile = true
  }
}
```

The `backend` block must sit inside a `terraform` block. If your `main.tf` already has a `terraform` block from Part 1, add `backend "s3"` inside it; Terraform also accepts a second `terraform` block, but keeping one is clearer. The `bucket` is the S3 bucket you built in Part 3. The `key` is the object name inside that bucket; use a different key for each configuration that shares the bucket. `use_lockfile = true` turns on native locking. The backend block is read before Terraform evaluates variables, so use literal values here rather than variable references.

**Example — the migration prompt and result (trimmed)**

```
Initializing the backend...

Do you want to copy existing state to the new backend?
  Pre-existing state was found while migrating the previous "local" backend to the
  newly configured "s3" backend.
  Enter a value: yes

Successfully configured the backend "s3"! Terraform will automatically
use this backend unless the backend configuration changes.
```

**Example — the plan after migrating**

```
No changes. Your infrastructure matches the configuration.
```

Read that plan yourself. What does it say, and what would it say if Terraform had lost track of your parameter? The evidence in the plan is what your research prompt asks you to reason about, so it is not spelled out here.

**Example — the state object in the bucket**

```
$ aws s3 ls s3://<your-bucket-name>/
2026-10-26 12:00:00       1234 <your-state-key>.tfstate
```

**Your turn**

- **What does a remote backend give a team that local state cannot?**
- **How do you know that nothing was recreated?**

> **Watch out.** If `plan` shows anything to add, change or destroy, the migration did not line up — stop and investigate before you do anything else, and never edit state by hand. Check that the bucket name, key and region match everywhere. And once the state lives remotely, the old local `terraform.tfstate` is stale: `terraform state list` and the bucket are the source of truth now, so don't treat the local file as one.

> **Explain it.** In one sentence, say where your state lives now and how Terraform finds it.

---

## Part 5 — Locking: one operation holds, a second waits

**Goal:** watch native locking refuse a second operation while one is in progress.

*First-run estimate: about 10 minutes.*

A **lock** is a marker Terraform takes while it is working, so a second operation can tell that an operation is already running. With the S3 backend and `use_lockfile = true`, that marker is a small lock object in the bucket. You do not create it by hand.

**Pause and predict.** Before you start, predict whether the second command will queue politely and wait, or stop with an error. Write your guess down. Then run the steps and compare.

**Try it**

1. Your last `plan` showed no changes. If you run `terraform apply` now, Terraform will see there is nothing to do and exit **without waiting at the approval prompt**, so it would not hold the lock. First make a small change: open `main.tf` and change the parameter's `value` placeholder, for example by adding `-v2`. Keep it a made-up placeholder.
2. Confirm the change is visible:

```
terraform plan
```

3. In your **first** terminal, start the operation:

```
terraform apply
```

4. Leave it at the approval prompt. **Do not type `yes` yet.** The operation is now in progress and holding the lock.
5. Open a **second** terminal in the same folder — the setup described in *Before you begin → Your editor and two terminals*. It must use the same AWS session: the same profile and the same exported credentials as the first terminal. In VS Code, use **Terminal → New Terminal** (or the split-terminal button), then move into the folder if the new terminal starts somewhere else:

```
cd <path-to>/m02-state-lab
```

6. In the second terminal, run:

```
terraform plan
```

7. Read the lock error. Capture it — it is required evidence.
8. Return to the first terminal and type `yes` to finish the change.
9. Confirm the configuration is clean again:

```
terraform plan
```

**Checkpoint**

- The second command is **refused** with a lock error, naming the operation that holds the lock.
- The first terminal finishes the update and reports the change.
- The final `plan` reports no changes.

**Example — the lock error (trimmed)**

```
Error: Error acquiring the state lock

Error message: operation error S3: PutObject, https response error StatusCode: 412,
  RequestID: ..., HostID: ..., api error PreconditionFailed: Precondition Failed
Lock Info:
  ID:        <...>
  Path:      <...>
  Operation: <...>
  Who:       <...>
  Version:   <...>
  Created:   <...>
  Info:      <...>
```

The real error continues with a short paragraph explaining what locking is for. Read that paragraph yourself — deciding **what locking prevents, and what it does not**, is one of your research prompts, so it isn't spelled out here.

**Your turn**

- **What does locking prevent — and what does it not?**

> **Watch out.** If your sandbox role cannot create and delete the lock object, you'll see a permissions error instead. That is a gap in your sandbox access: tell your trainer rather than working around it. If the second `plan` does **not** show a lock error, the first `apply` was probably not waiting — check that step 2 showed a real change before you started it. Do not try to remove a lock by hand; recovering a lock left behind is outside this stage.

> **Explain it.** In one sentence, say what you saw happen when the second command ran.

---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

*First-run estimate: about 20 minutes (evidence, clean-up and write-up).*

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. The definition of done applies in full — but your write-up's **Checkpoint evidence** section collects the evidence into three slots:

- **DoD-01 and DoD-02** — your read-only local state output for one of your own resources, including the command you ran and what it holds for the placeholder value.
- **DoD-03 and DoD-04** — the bucket listing showing your migrated state, and the bucket's versioning, encryption and public-access settings from the cloud side.
- **DoD-05** — the lock error you got when a second operation ran while the first was in progress, plus your `main.tf` backend block showing `use_lockfile = true` and no `dynamodb_table`.

Every slot wants **real pasted output**, trimmed to the relevant lines and redacted — not a description from memory. Redact the account ID and ARN as your trainer directs, and never paste a real value where a placeholder stood in for one.

Two more items from the brief's definition of done sit outside those three slots, and still need evidence in your write-up: the bucket retained and everything else destroyed, confirmed from the cloud side, with a clean history and no state committed (DoD-06). DoD-07 is answered by the write-up itself — follow it end to end from a clean state and say so.

### 6b. The clean-up gate

This stage has one exception to the usual rule: **you keep the bucket.** Before you call the stage done, confirm:

- **No stored credential.** Nothing long-lived anywhere.
- **No state in version control.** `terraform.tfstate*` is ignored and never committed — check a clean commit history.
- **Everything else destroyed, bucket kept.** Destroy the small configuration's resources and any other resources you created, confirmed from the cloud side, but **leave the bucket in place** for the later stages that reuse it.

**Try it**

1. Move to the small configuration and destroy it. If you are in the bucket folder, `cd ../m02-state-lab`; otherwise move to your first build folder:

```
cd ../m02-state-lab
terraform destroy
```

Read the plan, then type `yes`. This removes the parameter. It does **not** remove the bucket, because the bucket is in the other folder.

2. Confirm the parameter is gone from the cloud side. The expected result is an error saying the parameter does not exist — that error is the success check:

```
aws ssm get-parameter --name "/m02/<your-name>-state-lab"
```

3. Confirm the bucket is still there and its protections are intact:

```
aws s3api head-bucket --bucket <your-bucket-name>
aws s3api get-bucket-versioning --bucket <your-bucket-name>
```

`head-bucket` prints nothing when the bucket exists. If it succeeds, the bucket is still there.

4. Confirm your session is still a short-lived role, not a stored access key:

```
aws sts get-caller-identity
```

The `Arn` should contain `assumed-role`, not an IAM user. Redact the account details before you paste it.

5. Run the Git checks in **both** build folders. The first command should print nothing; that means no state file was ever committed:

```
git log --all --oneline -- '*.tfstate'
git status
```

6. Do **not** run `terraform destroy` in `m02-state-bucket`. That would delete the bucket and its protections. The bucket's local state file stays in that folder, ignored by Git, for as long as the bucket exists.

The state object for the small configuration also stays in the bucket after `terraform destroy`. That is expected: Terraform updates the object to record that the configuration now manages no resources.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

The rule of thumb: **keep state out, keep the lock file in.** Confirm with `git status` that no `terraform.tfstate` appears, and that `.terraform.lock.hcl` stays committed.

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`. It is a short document with nine sections, in this order — use the template's section names as they are, and answer each one in your own words:

| Section | What goes in it |
| --- | --- |
| **What I built** | The protected S3 state bucket and the small configuration whose local state you inspected and then migrated into it. Link your repository. |
| **Why it's built this way (key decisions)** | The four key decisions below — what you considered, what you chose, why, and what you gave up. |
| **AI collaboration log** | Specific: which tools, two or three concrete asks, one suggestion that was wrong and what you did instead, and what you wrote yourself. Or one line saying you used none. |
| **How to build it (teach it to the next engineer)** | A guide from local state to a protected remote backend with locking demonstrated, using your own state output to show the reasoning, not just the commands. Follow it yourself end to end before you call it done. |
| **Concepts worth explaining** | Two or three ideas — what state records and where it lives, why a team needs a remote backend, or migrating local state without recreating anything — in your own words, each with an example from *your* build. |
| **What tripped me up** | Anything that didn't behave the way you expected the first time, with the exact error text. (These become the course's common-errors list.) |
| **Checkpoint evidence** | The three evidence slots from 6a: pasted output, trimmed and redacted, or a screenshot. |
| **Definition-of-done self-assessment** | Met / partly met / not met for every DoD item and why, your rating against each stage-rubric criterion in the README, and anything you'd struggle to explain cold. |
| **What I'd do differently** | If you started this stage over, what would you do differently? |

The four key decisions, in the template's words:

1. What can leak a secret into state, and why is a state file sensitive even when the configuration has no secrets?
2. Who and what needs access to the state bucket, how narrow can you make it, and why is the bucket kept when everything else is destroyed?
3. What does locking prevent, and what does it not?
4. Where did you spend the most time, and why?

Each decision gathers answers from the research prompts you investigated on the way, so every prompt you answered still has a home:

| Key decision | Where the answers come from |
| --- | --- |
| 1 — what can leak a secret into state, and why a state file is sensitive even with no secrets in it | Part 1 — its prompt about a state file you did not create and about hand-editing state — and Part 2 — both of its prompts |
| 2 — who and what needs access to the bucket, how narrow it can be, and why the bucket is kept | Part 3 — all three of its prompts |
| 3 — what locking prevents, and what it does not | Part 5 — its prompt — and the Part 4 prompts about what a remote backend gives a team and how you know nothing was recreated |
| 4 — where the time went | Your own answer. The Part 4 prompts also feed your **Concepts worth explaining**, which the template names for exactly those two ideas. |

Then tell your trainer the stage is ready for review.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm the item you'll be asked about at review: whether your sandbox role can create and delete the lock object.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `m02-state-lab/main.tf` | The small configuration whose local state you inspected and then migrated. |
| `m02-state-bucket/main.tf` | The state bucket and its versioning, encryption and public-access settings. |
| `.gitignore` (in both folders) | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `terraform.tfstate` | Local state before migration; after migration it is stale and stays ignored. |
| `.terraform.lock.hcl` | The provider lock file; commit it. |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `terraform init` | Prepares a folder: downloads providers, writes the lock file, configures the backend. |
| `terraform init -migrate-state` | Moves existing local state into the configured backend. |
| `terraform fmt` | Rewrites Terraform files into the standard format (or changes nothing). |
| `terraform validate` | Checks the configuration for syntax and internal errors. |
| `terraform plan` | Shows what would change. After migration, expect **no changes**. |
| `terraform apply` | Makes the changes; here it also creates the parameter and the bucket. |
| `terraform destroy` | Removes what the configuration manages — but **not** the bucket in the other folder. |
| `terraform state list` | Lists the resources your state is tracking (read-only). |
| `terraform state show <addr>` | Prints one resource's stored attributes (read-only). |
| `aws sts get-caller-identity` | Shows which AWS identity your CLI session is using. |
| `aws s3 ls s3://<bucket>/` | Lists the objects in your bucket. |
| `aws s3api get-bucket-versioning --bucket <bucket>` | Shows whether versioning is enabled. |
| `aws s3api get-bucket-encryption --bucket <bucket>` | Shows the bucket's default encryption. |
| `aws s3api get-public-access-block --bucket <bucket>` | Shows the bucket's public-access settings. |
| `aws s3api head-bucket --bucket <bucket>` | Succeeds if the bucket exists; prints nothing. |
| `aws ssm get-parameter --name <name>` | Reads a parameter; after clean-up it should report that it does not exist. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
