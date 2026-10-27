# M01 — Getting Started with Terraform

*A self-guided tour: from an empty folder to a destroyed resource.*

---

Terraform is a program you run in your terminal: it reads files ending in `.tf` and makes changes in your cloud account so the account matches what those files describe. This tour walks you through your first Terraform build, one small part at a time. It shows you the **moves** — the tools to install, the files to create, the commands to run — and gives you checkpoints so you always know whether you're on track.

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

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

- a workstation you set up yourself;
- three files — `versions.tf`, `providers.tf`, `main.tf` — that manage one small AWS resource;
- a resource taken through the whole lifecycle: create it, change it in place, destroy it;
- a written **plan-review note**;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially how the operating system you don't own will be verified, and which parts of your identity output to redact before you paste it.

## Before you begin — find your footing

This tour assumes nothing beyond a working laptop. If you have never opened a terminal or written a file for a computer to read, work through this section now. If you have, skim it and jump to Part 1.

### Your terminal

A **terminal** (also called a *shell*) is a window where you talk to your computer by typing commands instead of clicking. Open one now:

- **macOS:** press ⌘ + Space, type `Terminal`, press Enter.
- **Linux:** press Ctrl + Alt + T (or find "Terminal" in your applications menu).

You get a window with a blinking cursor behind a short line of text — the **prompt**. It looks something like `romeo@macbook ~ %`. The prompt means "ready for your command": you type a command, press Enter, the computer answers, and the prompt comes back for the next one.

Every command block in this tour looks like this:

```
terraform -version
```

You would type `terraform -version` and press Enter. Two rules about these blocks:

- Text after a `#` on the same line is a **comment** — an explanation for you; the computer never sees it, so don't type the `#` part.
- Anything in `<angle brackets>` is a **placeholder**. Replace the whole `<...>` with the real value (the text tells you which). Never type the angle brackets themselves.

### Three commands to try now

Run these one at a time. None of them change anything — they only print information:

```
pwd
```

**pwd** means "print working directory": it shows which folder you are currently *in*. Your terminal always sits in some folder, the way a browser tab always sits on some page.

```
ls
```

**ls** means "list": it shows the files and folders inside the folder you are in.

```
echo hello
```

**echo** simply prints back whatever you type after it — proof that the terminal does what you tell it.

### Folders, and the two commands that move you around

A **folder** (directory) is where files live. You will build in a folder of your own, starting with the one you are in:

```
mkdir tf-m01-build
```

**mkdir** means "make directory": it creates a folder named `tf-m01-build`. Then move into it:

```
cd tf-m01-build
```

**cd** means "change directory". There is no "you are here" marker to click — you move the terminal into folders with `cd`, and ask where you are with `pwd`.

### Your editor: Visual Studio Code

An **editor** is the program where you actually write the files. This course uses **Visual Studio Code** (VS Code). You install it in Part 1a; once it is installed, you can open the folder you just created from the terminal:

```
code .
```

The `.` means "this folder". A VS Code window opens with `tf-m01-build` in its sidebar. If the terminal answers *command not found*, finish the VS Code install in Part 1a first — on macOS, also run **Shell Command: Install 'code' command in PATH** from VS Code's Command Palette (⌘ + Shift + P) — then come back. Inside VS Code you can also open a built-in terminal with Ctrl + ` (the backtick key, just under Esc on most keyboards): from here on, every command of this tour can run without leaving the editor.

### Git, in one paragraph

**Git** is a tool that keeps a saved history of a folder's files, so you can prove what changed and when. This course requires your code in your own repository — a project tracked by Git, kept on your machine or on a server like GitLab. Start the history in your build folder now:

```
git init
```

**git init** means "start keeping history in this folder". From then on, `git status` tells you at any time what has changed; you will use it in Part 2 when you commit the lock file.

### Keep `versions.env` open

The course repository you are reading this in has a file at its root called `versions.env`. It lists the exact tool versions this course pins. Open it in VS Code now and keep it in a tab: several steps ahead will tell you to copy a version *from that file*, and reading it yourself is part of the work — this tour never copies the number in for you.

You are ready for Part 1.

---

## Part 1 — Set up your workstation

**Goal:** a machine that can talk to AWS safely, with Terraform at the pinned version.

*First-run estimate: about 30–40 minutes (installs and sign-in; yours will vary).*

The environment comes first. If you get this wrong, every later error is confusing. Take your time here.

### 1a. Install the tools

You need Terraform, the AWS CLI, Git, `jq`, and an editor. Your brief asks you to install Terraform through a **version manager** (`tfenv` or `asdf`) on the platforms where one works. A version manager is a small tool whose only job is to install and switch between versions of another tool — you pick one, and *how to choose and maintain it* is your research prompt, not a mystery to skip. You will install everything through a **package manager** — a tool that downloads and keeps other tools up to date — whose name appears in the commands below (`brew` on macOS, `apt` on Linux).

**Try it**

- Install a version manager for Terraform (`tfenv` or `asdf`).
- Install the AWS CLI, Git and `jq`.
- Install Visual Studio Code and the **HashiCorp Terraform** extension.

Two paths, written out so you are never stuck on the commands — pick the one for your operating system (both were written down, not run on every platform here). *Which* install method fits each tool on each OS, and what each costs you in maintenance, is still your research prompt — these are just ways through.

**macOS** (in a POSIX shell):

```
brew install tfenv
brew install awscli git jq
tfenv install <TF_VERSION from versions.env>
tfenv use <TF_VERSION from versions.env>
```

**Linux** — packages first (Debian/Ubuntu shown; adjust to your distro's package manager):

```
sudo apt update
sudo apt install -y git jq
```

Install the AWS CLI through your distro's package (or the official installer from the AWS docs), and VS Code from the `.deb`/`.rpm` on code.visualstudio.com (or `sudo snap install code --classic`).

Then the version manager, in your shell:

```
git clone https://github.com/tfutils/tfenv.git ~/.tfenv
export PATH="$HOME/.tfenv/bin:$PATH"
tfenv install <TF_VERSION from versions.env>
tfenv use <TF_VERSION from versions.env>
```

`git clone <url>` downloads a Git project from a server into your machine; the `export PATH=...` line adds tfenv's folder to the list of places your terminal looks for commands. That addition lasts only for this window — a new window forgets it. The permanent version belongs in your shell's start-up file, which is part of the install-method research to work out for yourself.

On any of these systems, install the **HashiCorp Terraform** extension from inside VS Code (Extensions view → "HashiCorp Terraform"). An **extension** adds features to the editor: this one colours Terraform code as you type and flags mistakes early.

**Checkpoint**

```
terraform -version
aws --version
git --version
jq --version
```

All four print a version. Look closely at the Terraform version: it must match the pinned version in `versions.env` at the root of this repository — read it there yourself. If your version manager can install more than one version, use it to **switch between two versions** and watch the output change.

**Example — switching Terraform versions with a version manager**

```
$ tfenv list
  1.13.0
* 1.12.0
$ tfenv use 1.13.0
Switching default version to v1.13.0
Switching completed
$ terraform -version
Terraform v1.13.0
on darwin_arm64
```

The version numbers are made up on purpose — yours must match `versions.env`. The point of capturing this output is that it *shows the switch*: before, `terraform -version` was one number; after, it's another.

**Your turn**

- **Which install method fits each tool on each operating system, and what does each choice cost you in maintenance?** (Write your answer for a learner on macOS *and* one on Linux.)
- **What fails differently on Windows than on macOS?**
- **How does a version manager keep Terraform at the version you pinned?**

> **Watch out.** Don't install Terraform by hand "just for now." A version manager is part of what this stage is teaching, and your evidence has to show a real switch between two versions.

### 1b. Sign in to AWS — without any keys

AWS is a **cloud provider** — a company that rents out computers and services over the internet. Three words you will hear throughout: an **account** is your team's isolated space inside AWS with its own billing; a **region** is which part of the world that space's datacentres sit in (names look like `eu-west-1`); and the **sandbox** is the practice account your trainer prepared for this course — nothing you do there touches real company systems, but its budget is finite, so everything you create still gets destroyed at the end.

**IAM Identity Center** is the course's sign-in door. Instead of a username-and-password or a long-lived access key sitting on your disk, it issues a **short-lived role** — a temporary permission slip — each time you sign in. The two commands that drive it:

**Try it**

- Sign in to AWS through **IAM Identity Center** using the AWS CLI, following your trainer's sandbox instructions. Run `aws configure sso` once per machine: it asks a short list of questions, and the answers come from the sandbox invitation your trainer sent — the SSO start URL, the region, a name for this profile on your machine, then the account and the role you may assume. After that, every session starts with the second command:

```
aws configure sso    # once per machine: start URL, region, account and role come from your sandbox invitation
aws sso login        # run at the start of every session
```

The same two commands work in any shell — bash on Linux, zsh on macOS — the AWS CLI does not care which operating system you are on.

- Prove the connection:

```
aws sts get-caller-identity
```

**Checkpoint**

You get back an identity — an account and a role/ARN. **Redact the account details the way your trainer directs** before you paste anything into your write-up.

**Example — a redacted caller identity**

The answer below is **JSON** — plain text arranged in `"key": value` pairs, the shape most AWS tools print:

```
{
  "UserId": "AROAEXAMPLE:you@example.com",
  "Account": "1234••••••••",
  "Arn": "arn:aws:sts::1234••••••••:assumed-role/AWSReservedSSO_ExampleRole/you@example.com"
}
```

Notice it's a **role** (`assumed-role`), not an IAM **user** — think about what that tells you about *how* you signed in, and whether a stored key was involved. That reasoning is part of one of your research prompts. An **ARN** is AWS's address format for any single thing: `arn:aws:...` spells out which service, which account and which object. Redact the account number (and any account-specific IDs) before you paste.

**Pause and predict (a small one).** Before you run the command above, guess what it will print. Then run it. Were you right about *which* identity came back?

**Your turn**

- **How do you prove you are connected to AWS without static keys?**
- **What problem does Terraform solve that a script or the cloud console does not — and where would you not use it?**
- **How does describing the state you want differ from scripting the steps to get there?**
- **Run a scan for static access keys** across your disk and your repository. Record the command you used and **what the scan looked for and what it can miss.**

> **Watch out.** The course forbids stored keys of every kind ([README.md](../../README.md#rules-for-every-stage) → "Rules for every stage"). If you're ever tempted to make an access key "so it just works," stop and ask your trainer instead. That temptation is exactly the habit this stage exists to prevent.

---

## Part 2 — Dependencies: the `versions.tf` file

**Goal:** declare what Terraform needs, and see it fetch those things on `init`.

*First-run estimate: about 10 minutes.*

Terraform organises itself into small files, each with one job. This part creates the first one: the file that says **which providers** the configuration needs. A **provider** is a plug-in that lets Terraform manage one cloud service — the AWS provider manages AWS resources, and there are providers for GCP, Azure and hundreds of other services. This stage uses only the AWS one.

**Try it**

1. In your build folder, create `versions.tf`.
2. Add a `required_providers` block naming the AWS provider, and a version for it.
3. Run:

```
terraform init
```

**Example — the shape of `versions.tf`**

```
terraform {
  required_version = "<the version from versions.env>"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "<your choice — you'll justify it below>"
    }
  }
}
```

This is a skeleton, not the finished file. The two placeholders are yours to fill: the pinned version (read it from `versions.env`) and the **constraint form** — how tight or loose to make it is one of your research prompts. `source` is just the provider's address.

**Checkpoint**

- A folder called `.terraform` appears. Folders starting with a dot are *hidden* by default in file browsers — in your terminal, `ls -a` shows them (`ls` alone hides them).
- A `.terraform.lock.hcl` file appears.
- `init` reports success.

Look inside both. Then **commit the lock file** — it must show up in your commit:

```
git add .terraform.lock.hcl
git status
git commit -m "Lock the AWS provider version"
```

**git add** puts the file into the next snapshot; **git status** shows what is staged (and what is not — state files must never be); **git commit** saves the snapshot with a short message. The lock file should be listed as staged. Anything ending in `.tfstate` must not be — the automatic block against that arrives in Part 6b.

**Example — your folder after `init`**

```
my-terraform-build/
├── versions.tf
├── providers.tf          (you add this in Part 3)
├── main.tf               (you add this in Part 4)
├── .terraform/           created by init — never commit
├── .terraform.lock.hcl   created by init — commit this
└── .gitignore            (see Part 6)
```

`.terraform/` is where the downloaded pieces land; the lock file sits beside your `.tf` files. Spot the difference between the two: one is ignored, one is committed.

**Example — what `init` prints (trimmed)**

```
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/aws versions matching "..."
- Installing hashicorp/aws ...
- Installed hashicorp/aws ... (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl ...

Terraform has been successfully initialized!
```

The real output also prints a short paragraph explaining the lock file. Read that paragraph yourself — deciding what the lock file records is one of your research prompts, so it isn't spelled out here.

**Pause and predict.** Before `init` finishes, guess: will the lock file be there if you run `init` twice? What changes between runs?

**Your turn**

- **What does Terraform download when you initialise, and where does it put it?**
- **What is the difference between the version constraint you declare and what the lock file records?**
- **How loose or how tight should a provider constraint be — and who carries the risk of each choice?**
- **What should a reviewer look for in a merge request that changes the lock file?**

> **Watch out.** If you skip `versions.tf` and let Terraform guess the provider, you've skipped the point of this part. The file is the deliverable. And your notes must say, **in your own words**, what the lock file recorded — not what the docs say.

---

## Part 3 — Configuration: the `providers.tf` file

**Goal:** tell Terraform *how* to talk to AWS, and set tags in one place.

*First-run estimate: about 10 minutes.*

**Try it**

1. Create `providers.tf` with the AWS provider block.
2. Add a **`default_tags`** block that includes the tags your brief requires.
3. Check your work:

```
terraform fmt
terraform validate
```

**Example — the shape of `providers.tf`**

```
provider "aws" {
  region = "<your sandbox region>"

  default_tags {
    tags = {
      Project     = "<project>"
      Environment = "<environment>"
      Owner       = "<you>"
    }
  }
}
```

The tag keys and values must match whatever your course requires — check the brief, and ask your trainer if it isn't stated there. Notice `default_tags` appears **once**, at the provider level, not on every resource. Why that's the better default is one of your research prompts. Two structural words: a **block** is Terraform's unit of grouping — a name (in quotes or not) followed by a `{ ... }` of settings, and blocks nest inside blocks normally (`default_tags` sits inside `provider "aws"`). And the `<your sandbox region>` is the same region string you typed into `aws configure sso` back in Part 1b.

**Checkpoint**

- `fmt` rewrites any messy formatting (or changes nothing).
- `validate` reports no errors.

Paste both outputs into your write-up's checkpoint evidence — **not** from memory.

**Example — what clean `fmt` and `validate` look like**

```
$ terraform fmt
main.tf

$ terraform validate
Success! The configuration is valid.
```

`fmt` lists the files it reformatted (it prints nothing if every file was already tidy). `validate` prints `Success!...` when the configuration is sound. If either complains, fix it before moving on.

**Pause and predict.** `default_tags` is set once, at the provider level, but you haven't written the resource yet. Predict: will those tags show up when you plan the resource in Part 4?

**Your turn**

- **How does the AWS provider decide which credentials to use, and how do you prove which identity a plan is using?**
- **Why are tags set at the provider rather than on each resource — and what would make you tag a resource individually anyway?**

> **Explain it.** In one sentence, say what `providers.tf` is *for*, as if to a brand-new learner.

---

## Part 4 — Resources and planning: the `main.tf` file

**Goal:** create one resource and *read the plan before you ever apply*.

*First-run estimate: about 15 minutes.*

**Try it**

1. Create `main.tf` with a single resource: an `aws_ssm_parameter` (your brief names it). A **resource** is one thing in the cloud that Terraform manages — a bucket, a database, a parameter. An `aws_ssm_parameter` is a named value stored in AWS Systems Manager Parameter Store: think of it as a settings entry your applications can read. It is tiny and nearly free, which is exactly why the brief picks it — you practise the workflow, not the AWS bill.
2. Give it the arguments it needs.
3. Run:

```
terraform plan
```

4. Read the output carefully. Find where the tags from Part 3 appear on your resource.

**Example — the shape of `main.tf`**

```
resource "aws_ssm_parameter" "app_config" {
  name  = "/m01/<your-name>"
  type  = "String"
  value = "<a-non-sensitive-value>"
}
```

Two labels follow `resource`: the **type** (`aws_ssm_parameter`) and a **name** you choose (`app_config`). Every line inside the braces is an **argument** — something you set in the file. Terraform will also report back **attributes** — facts it learns about the resource after talking to AWS. Which parts of this resource are arguments and which are attributes Terraform fills in for you is one of your research prompts; the two words are yours to use now.

**Checkpoint**

The plan shows a **create** for one resource, and it shows your default tags attached.

**Example — a create plan (trimmed)**

```
Terraform will perform the following actions:

  # aws_ssm_parameter.app_config will be created
  + resource "aws_ssm_parameter" "app_config" {
      + name = "/m01/<your-name>"
      + tags = { ... }
      + ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

Read every line rather than skimming. Which lines are values *you* supplied, and which does Terraform only know after it creates the resource? And what do those leading symbols mean — and how would a *different* kind of change render? Those are your research prompts; work them out from the output you generate yourself.

**Pause and predict.** Before you run `plan`, write down: how many resources will it say it's adding? Will anything be changed or destroyed? Now compare with the real output.

**Your turn**

- **Which parts of a resource do you set, and which does Terraform report back after it's created?**
- **What should you check in a plan before you approve it?**
- **How can you tell, from the plan alone, what a change will do?**
- **What would you do if a plan showed a destroy you did not expect?**

**Start your plan-review note here.** Your brief asks for a written **plan-review note** ([TASK-M01-B07](../../modules/m01-getting-started-with-terraform/tasks.md#build)). Make it a habit, not a one-off: for every plan you produce in this stage, classify every change the plan shows as **create**, **in-place update** or **replacement**, and write down *how you knew*. Your trainer will go through each classification with you at review.

**Example — the format of a plan-review note**

| # | Change shown in the plan | Classification | How I knew |
| --- | --- | --- | --- |
| 1 | `aws_ssm_parameter.app_config` added | create | `<your reasoning — what in the plan told you>` |
| 2 | one attribute changed on the same resource | in-place update | `<your reasoning>` |
| 3 | (if a plan ever shows one) | replacement | `<your reasoning>` |

The table is the *format*; the "How I knew" column is the substance, and it's yours to fill in. Three columns: what changed, what kind of change, and the evidence in the plan that proved it.

> **Watch out.** The single most important reading habit in this course is: **never approve a plan that contains a change you cannot explain.** If something surprises you, stop, save the output, and reconcile it with your trainer before you apply.

> **Explain it.** In one sentence: what is a *resource*, and what does a plan give you that your configuration alone does not?

---

## Part 5 — Apply, update, destroy

**Goal:** run the full lifecycle and prove, from the cloud side, that it's gone.

*First-run estimate: about 15 minutes.*

**Try it**

1. Apply:

```
terraform apply
```

The first `apply` prints the plan again and then asks you to type `yes` before it does anything. Read the plan it shows, then confirm. Your first `apply` also writes **state** — Terraform's record of what it currently manages — into a file called `terraform.tfstate` (plus a `.backup` file) in your build folder.

2. Change **one attribute** of your resource (only one — you want a readable plan).
3. Plan again:

```
terraform plan
```

4. Look for what kind of change the plan predicts for that attribute.
5. Apply again.
6. Destroy:

```
terraform destroy
```

> **Watch out.** Your first `apply` writes `terraform.tfstate` (and a `.backup` file) into your build folder. In this stage, state is local and **never committed**. The `.gitignore` that enforces this arrives in Part 6b — until then, run `git status` before every commit and make sure no `.tfstate` file is staged. If one already is, unstage it now.

**Example — `apply` and `destroy` tell you the tally**

```
$ terraform apply
...
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

$ terraform destroy
...
Destroy complete! Resources: 1 destroyed.
```

Note the summary line at the end of each — *added / changed / destroyed*. After your one-attribute change, what would you expect that line to say? Predict it before you run `plan`/`apply`.

**Checkpoint**

- Step 4 shows the update for the attribute you changed — know whether Terraform does it in place or replaces the resource.
- After destroy, Terraform says it succeeded — but that is **not** enough on its own (see below).

**Pause and predict.** You changed exactly one attribute. Predict before you run `plan`: in-place update, or replacement? Write your guess, the actual result, and how sure you were.

**Your turn**

- **Which changes to your resource are made in place and which force a replacement — and how sure are you?**
- **What does a replacement cost when the resource holds data or other resources depend on it?**
- **How do you confirm from the cloud side that everything is gone?**

> **Watch out.** "Destroy complete" from Terraform is not, by itself, proof. Confirm from the **cloud side** that your resource no longer exists — that cloud-side check is a required piece of evidence (DoD-06).

**Add to your plan-review note.** Record the in-place-update plan, and note what the takeaway was.

---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

*First-run estimate: about 20 minutes (evidence, clean-up and write-up).*

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. The definition of done applies in full — but your write-up's **Checkpoint evidence** section collects the evidence into three slots:

- **DoD-01 and DoD-02** — your version output after switching between two Terraform versions, your redacted caller identity, and your static-key scan output.
- **DoD-05 and DoD-06** — your plan showing the default tags on the resource, and your plan showing the in-place update.
- **DoD-06** — the cloud-side query output showing the resource is gone after destroy.

Every slot wants **real pasted output**, trimmed to the relevant lines and redacted — not a description from memory.

Two more items from the brief's definition of done sit outside those three slots, and still need evidence in your write-up: the `.terraform` folder and the committed lock file that `init` created (DoD-03), and the passing `fmt`/`validate` output (DoD-04). DoD-07 is answered by the write-up itself — follow it end to end from a clean state and say so.

### 6b. The clean-up gate

Before you call the stage done, confirm all three:

- **No stored credential.** Nothing long-lived anywhere.
- **No committed state file.** `terraform.tfstate` and friends are local in this stage and never committed.
- **Nothing left running.** Your resource is destroyed, confirmed from the cloud side.

**Example — a `.gitignore` for a local-state stage**

```
.terraform/
*.tfstate
*.tfstate.*
crash.log
```

The rule of thumb this encodes: **keep state out, keep the lock file in.** This ignores the downloaded providers and any state file, while `.terraform.lock.hcl` stays committed. After adding it, run `git status` and confirm `terraform.tfstate` does **not** appear — if you've already staged it, unstage it before you commit.

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`. It is a short document with nine sections, in this order — use the template's section names as they are, and answer each one in your own words:

| Section | What goes in it |
| --- | --- |
| **What I built** | The workstation you set up, the `versions.tf`, `providers.tf` and `main.tf` files that manage one AWS resource, and your plan-review note. Link your repository. |
| **Why it's built this way (key decisions)** | The four key decisions below — what you considered, what you chose, why, and what you gave up. |
| **AI collaboration log** | Specific: which tools, two or three concrete asks, one suggestion that was wrong and what you did instead, and what you wrote yourself. Or one line saying you used none. |
| **How to build it (teach it to the next engineer)** | A guide that takes a learner on macOS or Windows from an empty folder to a destroyed resource, using your own output to show the reasoning, not just the commands. Follow it yourself end to end before you call it done. |
| **Concepts worth explaining** | Two or three ideas — what a provider is, default tags, or the anatomy of a resource — in your own words, each with an example from *your* build. |
| **What tripped me up** | Anything that didn't behave the way you expected the first time, with the exact error text. (These become the course's common-errors list.) |
| **Checkpoint evidence** | The three evidence slots from 6a: pasted output, trimmed and redacted, or a screenshot. |
| **Definition-of-done self-assessment** | Met / partly met / not met for every DoD item and why, your rating against each stage-rubric criterion in the README, and anything you'd struggle to explain cold. |
| **What I'd do differently** | If you started this stage over, what would you do differently? |

The four key decisions, in the template's words:

1. Why use Terraform instead of a script or the console, and how do you prove you are connected to AWS without static keys?
2. What does the lock file record that your version constraint does not, and how loose or tight should a provider constraint be?
3. Which changes update a resource in place and which force replacement, and how do you confirm from the cloud side that everything is gone?
4. Where did you spend the most time, and why?

Each decision gathers answers from the research prompts you investigated on the way, so every prompt you answered still has a home:

| Key decision | Where the answers come from |
| --- | --- |
| 1 — Terraform instead of a script or the console, and connecting without static keys | Part 1b — all four of its prompts — and the first Part 3 prompt (how the provider picks credentials, and how you prove which identity a plan is using) |
| 2 — the lock file, the constraint, and how tight to pin | Part 2 — all four of its prompts |
| 3 — updated in place or replaced, and proving it is gone | Part 4 — all four of its prompts — and Part 5 — all three of its prompts |
| 4 — where the time went | Your own answer. The Part 1a prompts (install methods, Windows versus macOS, the version manager) are the reasoning behind step 1 of your **How to build it** guide, and the second Part 3 prompt (tags on the provider) is one of your **Concepts worth explaining**. |

Then tell your trainer the stage is ready for review.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm the two items you'll be asked about at review: how the OS you don't own gets verified, and how you redacted your identity output.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `versions.tf` | Which providers, and which versions, this configuration needs. |
| `providers.tf` | How Terraform talks to AWS, and the `default_tags` applied to resources. |
| `main.tf` | The resources themselves. |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `terraform init` | Downloads providers, writes `.terraform` and the lock file. |
| `terraform fmt` | Tidies formatting. |
| `terraform validate` | Checks the configuration for errors. |
| `terraform plan` | Shows what would change. **Read it every time.** |
| `terraform apply` | Makes the changes. |
| `terraform destroy` | Removes what you created. Confirm cloud-side afterwards. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
