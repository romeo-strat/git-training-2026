# M01 — Getting Started with Terraform

*A self-guided tour: from an empty folder to a destroyed resource.*

---

This tour walks you through your first Terraform build, one small part at a time. It shows you the **moves** — the tools to install, the files to create, the commands to run — and gives you checkpoints so you always know whether you're on track.

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

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — the objective, the scope, the constraints, the deliverable and the definition of done. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end. When you fill in the "How to build it" section, write it for someone who will follow it with no trainer to ask.

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your Terraform code in your own GitLab repository. Link that repository from the header of your write-up.

## Where you're headed

By the end of this tour you'll have:

- a workstation you set up yourself;
- three files — `versions.tf`, `providers.tf`, `main.tf` — that manage one small AWS resource;
- a resource taken through the whole lifecycle: create it, change it in place, destroy it;
- a written **plan-review note**;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially how the operating system you don't own will be verified, and which parts of your identity output to redact before you paste it.

---

## Part 1 — Set up your workstation

**Goal:** a machine that can talk to AWS safely, with Terraform at the pinned version.

The environment comes first. If you get this wrong, every later error is confusing. Take your time here.

### 1a. Install the tools

You need Terraform, the AWS CLI, Git, `jq`, and an editor. Your brief asks you to install Terraform through a **version manager** (`tfenv` or `asdf`) on the platforms where one works.

**Try it**

- Install a version manager for Terraform (`tfenv` or `asdf`).
- Install the AWS CLI, Git and `jq`.
- Install Visual Studio Code and the **HashiCorp Terraform** extension.

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

- **Which install method fits each tool on each operating system, and what does each choice cost you in maintenance?** (Write your answer for a learner on macOS *and* one on Windows.)
- **What fails differently on Windows than on macOS?**
- **How does a version manager keep Terraform at the version you pinned?**

> **Watch out.** Don't install Terraform by hand "just for now." A version manager is part of what this stage is teaching, and your evidence has to show a real switch between two versions.

### 1b. Sign in to AWS — without any keys

**Try it**

- Sign in to AWS through **IAM Identity Center** using the AWS CLI, following your trainer's sandbox instructions.
- Prove the connection:

```
aws sts get-caller-identity
```

**Checkpoint**

You get back an identity — an account and a role/ARN. **Redact the account details the way your trainer directs** before you paste anything into your write-up.

**Example — a redacted caller identity**

```
{
  "UserId": "AROAEXAMPLE:you@example.com",
  "Account": "1234••••••••",
  "Arn": "arn:aws:sts::1234••••••••:assumed-role/AWSReservedSSO_ExampleRole/you@example.com"
}
```

Notice it's a **role** (`assumed-role`), not an IAM **user** — think about what that tells you about *how* you signed in, and whether a stored key was involved. That reasoning is part of one of your research prompts. Redact the account number (and any account-specific IDs) before you paste.

**Pause and predict (a small one).** Before you run the command above, guess what it will print. Then run it. Were you right about *which* identity came back?

**Your turn**

- **How do you prove you are connected to AWS without static keys?**
- **What problem does Terraform solve that a script or the cloud console does not — and where would you not use it?**
- **How does describing the state you want differ from scripting the steps to get there?**
- **Run a scan for static access keys** across your disk and your repository. Record the command you used and **what the scan looked for and what it can miss.**

> **Watch out.** The course forbids stored keys of every kind (`README.md` → "Rules for every stage"). If you're ever tempted to make an access key "so it just works," stop and ask your trainer instead. That temptation is exactly the habit this stage exists to prevent.

---

## Part 2 — Dependencies: the `versions.tf` file

**Goal:** declare what Terraform needs, and see it fetch those things on `init`.

Terraform organises itself into small files, each with one job. This part creates the first one: the file that says **which providers** the configuration needs.

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

- A hidden `.terraform` folder appears.
- A `.terraform.lock.hcl` file appears.
- `init` reports success.

Look inside both. Then **commit the lock file** — it should show up in your commit.

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

The tag keys and values must match whatever your course requires — check the brief, and ask your trainer if it isn't stated there. Notice `default_tags` appears **once**, at the provider level, not on every resource. Why that's the better default is one of your research prompts.

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

**Try it**

1. Create `main.tf` with a single resource: an `aws_ssm_parameter` (your brief names it).
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

Two labels follow `resource`: the **type** (`aws_ssm_parameter`) and a **name** you choose (`app_config`). Which arguments are actually required — and which parts of the resource Terraform fills in for you after it's created — is one of your research prompts.

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

**Start your plan-review note here.** Your brief asks for a written **plan-review note** (`TASK-M01-B07`). Make it a habit, not a one-off: for every plan you produce in this stage, classify every change the plan shows as **create**, **in-place update** or **replacement**, and write down *how you knew*. Your trainer will go through each classification with you at review.

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

**Try it**

1. Apply:

```
terraform apply
```

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

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- your actual Terraform version, installed through a version manager and **switched between two versions**, plus a redacted caller-identity output from your own session;
- the **static-key scan** you ran and what it looked for;
- proof that `init` created `.terraform` and the committed lock file, and your own words on what it recorded;
- passing `fmt`/`validate` output;
- the plan with the default tags, and your classification of every change;
- the in-place-update plan, and the cloud-side check that nothing remains.

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

Fill the remaining sections of `write-up.md`:

- **What I built** — the three files, and how they fit together. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

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
