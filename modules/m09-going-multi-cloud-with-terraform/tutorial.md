# M09 — Going Multi-Cloud with Terraform

*A self-guided tour: sign in to GCP and Azure with short-lived logins, and prove each provider works without creating anything.*

---

This tour walks you through getting a read-only check working on two more clouds, one part at a time. It shows you the **moves** — the commands to run, the folders to write, the checkpoints to hit — and gives you a way to confirm each step before you move on.

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

## How to use this tour

Work through the seven parts in order. Each part has the same simple shape:

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

- the Google Cloud CLI and the Azure CLI installed, and short-lived logins on both;
- **two small configurations**, one per cloud, each authenticating with a short-lived login and outputting the identity it runs as;
- proof that each configuration targets the project or subscription you intended, even when the active login points elsewhere;
- a scan of your repository and disk showing **no secrets or keys**;
- a plan for each cloud that creates **nothing**;
- a short next-steps note, and evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list has **two** items here: whether both cloud sandboxes are accessible to you, and how much detail your notes need. Confirm both with your trainer before you start — the stack constraints warn you to raise an inaccessible sandbox **before** you build.

---

## Part 1 — Install the CLIs and sign in

**Goal:** get both command-line tools installed and signed in with short-lived logins.

**Try it**

1. Install the Google Cloud CLI and the Azure CLI.
2. Sign in with a short-lived login for each:

```
gcloud auth application-default login
az login
```

**Checkpoint**

- Both CLIs are installed and respond to a version check.
- You are signed in on both, with no static key or secret involved.

**Pause and predict.** Before you sign in, predict whether either login will ask you to download and keep a credential file. Then check what it actually leaves behind.

> **Watch out.** This stage uses **short-lived logins only** — no service-account keys, client secrets or other static credentials, in the repository or on disk (a stack constraint). If a sign-in step offers you a key file, that's the wrong path.

---

## Part 2 — Confirm where you are signed in

**Goal:** know exactly which project and which subscription your login is pointing at.

**Try it**

1. Ask each CLI where you are signed in:

```
gcloud config get-value project
az account show
```

2. Write down the project and the subscription you are actually on.

**Checkpoint**

- You can state, in one line each, the active GCP project and the active Azure subscription.

**Example — the shape of the two checks**

```
$ gcloud config get-value project
<the active project id>

$ az account show
{ ... "id": "<the active subscription id>", "name": "<its name>" ... }
```

The commands are shown here; the ids you read are yours to record. **How you confirm which project and which subscription you are signed in to** is your research prompt.

**Pause and predict.** Before you run the checks, predict whether either CLI will show a default different from what you expected. Then compare.

**Your turn**

- **How do you confirm which project and which subscription you are signed in to?**

> **Explain it.** In one sentence, say why knowing *where* you're signed in matters before you write any configuration.

---

## Part 3 — One configuration per cloud, with the target made explicit

**Goal:** write two small configurations, each pinning the target rather than inheriting it.

**Try it**

1. In a `gcp/` folder, write a configuration with the `google` provider, an **explicit** `project`, a read-only data source, and an output for the identity.
2. In an `azure/` folder, do the same with the `azurerm` provider and an **explicit** `subscription_id`.

**Checkpoint**

- Two configurations, each with the target made explicit — not left to the ambient login.

**Example — the shape of the GCP configuration**

```
terraform {
  required_version = "<pinned from versions.env>"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "<pinned from versions.env>"
    }
  }
}

provider "google" {
  project = "<your project id>"
}

data "<a read-only identity data source>" "me" {}

output "identity" {
  value = data.<...>.me.<...>
}
```

**Example — the shape of the Azure configuration**

```
terraform {
  required_version = "<pinned from versions.env>"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<pinned from versions.env>"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "<your subscription id>"
}

data "<a read-only identity data source>" "me" {}

output "identity" {
  value = data.<...>.me.<...>
}
```

The structures are shown here; the data source that reports the identity is yours to find. **What can go wrong if the ambient login points at a different project (or subscription) than you intended, and what in your configuration prevents it**, are your research prompts.

**Pause and predict.** Before you write the `project` and `subscription_id` lines, predict what each configuration would target if you left them out and relied on the ambient login.

**Your turn**

- **What can go wrong if the ambient login points at a different project than you intended, and what in your configuration prevents it?**
- **What can go wrong if the ambient login points at a different subscription than you intended, and what in your configuration prevents it?**

> **Watch out.** Read-only data sources **only** — this stage creates no resources and bills nothing (a stack constraint). If your plan wants to add anything, something is wrong.

---

## Part 4 — Prove each provider works

**Goal:** run the same core workflow on both clouds and read the identity back.

**Try it**

1. In **each** folder, run the core workflow:

```
terraform init
terraform fmt
terraform validate
terraform plan
```

2. Read the identity output for each cloud.

**Checkpoint**

- Both configurations pass formatting and validation (DoD-01).
- Both plan successfully, and each plan includes an **identity** output (DoD-02).
- Neither plan has anything to add (DoD-05).

**Example — the shape of a plan that creates nothing (trimmed)**

```
Changes to Outputs:
  + identity = "<the identity this runs as>"

You can apply this plan to save these new output values to the Terraform state.
```

The format is shown here; the identity you read back is yours — **not** the one you expected (DoD-02).

**Pause and predict.** Before you plan, predict the identity each provider will report. Then run it and compare — the output is the evidence, not your prediction.

**Your turn**

- **Where should state live for a configuration that creates nothing — and does your answer change once it does?**

> **Watch out.** The same workflow carries over from AWS, but **provider setup does not**. Don't assume the GCP and Azure sign-in work like AWS; read what each one needs.

---

## Part 5 — Pin the target, not the login

**Goal:** show the configuration still targets what you intended when the active login points elsewhere.

**Try it**

1. Switch your active login to another project or subscription, if you have one.
2. Run `terraform plan` again in each folder.
3. Check that each configuration still targets the project or subscription you intended.

**Checkpoint**

- Each configuration targets the intended project or subscription even though the active login points elsewhere (DoD-03) — or your notes record why that wasn't possible.

**Pause and predict.** Before you re-plan, predict whether switching the login changes what the configuration targets. Then check — does the output confirm it, or surprise you?

> **Watch out.** This is the point of the explicit `project` and `subscription_id`. If your plan silently followed the new login, the target wasn't really pinned.

---

## Part 6 — Scan for secrets, and close with next steps

**Goal:** prove no secrets or keys exist anywhere, and write your next-steps note.

**Try it**

1. Scan the repository and your disk for secrets and keys.
2. Confirm each plan still shows nothing to add.
3. Write a short **next-steps note** naming HCP Terraform and Sentinel, and saying in one line what each is for.

**Checkpoint**

- A scan in your evidence, showing no secrets or keys in the repository or on disk (DoD-04) — not a statement that there are none.
- A plan for each cloud that adds nothing (DoD-05).
- A next-steps note naming HCP Terraform and Sentinel (DoD-06).

**Example — the shape of a scan (adjust the pattern to your tooling)**

```
git grep -n -I -E '<a pattern that would match a key or secret>'
```

The command shape is shown here; run whatever your team uses — the point is that the **evidence** shows the result.

**Example — the shape of the next-steps note**

| Tool | What it is for, in one line |
| --- | --- |
| HCP Terraform | `<...>` |
| Sentinel | `<...>` |

**Pause and predict.** Before you scan, predict whether anything will turn up — a stale credential file, a downloaded key, a hard-coded token. Then look honestly.

**Your turn**

- **What is each of HCP Terraform and Sentinel for, in one line?**

> **Watch out.** DoD-04 wants the scan's output pasted, not a claim that you checked. A scan you can't show didn't happen.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- pasted `fmt`/`validate` output for **both** configurations;
- a successful plan for each cloud, each including an identity output;
- evidence that each configuration targets the intended project or subscription even when the login points elsewhere (or your reason why not);
- the scan output showing no secrets or keys;
- a plan for each cloud that adds nothing;
- your next-steps note naming HCP Terraform and Sentinel.

### 7b. The clean-up gate

Nothing was created, so there is nothing to destroy. Before you call the stage done, confirm:

- **No resources were created.** Both plans show nothing to add; nothing is billing.
- **No static credentials exist.** No service-account keys, client secrets or other static credentials, in the repository or on disk.
- **No state file is committed** if you initialised locally.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

Confirm with `git status` that no state file appears and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the two configurations and the identity each reports. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas from this stage, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time — here it has two items.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `gcp/` | The GCP configuration: `google` provider, explicit `project`, a read-only data source, an identity output. |
| `azure/` | The Azure configuration: `azurerm` provider, explicit `subscription_id`, a read-only data source, an identity output. |
| `versions.tf` (each) | The version requirements, pinned from `versions.env`. |
| `.gitignore` | Keeps downloaded providers (and any local state) out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your scan and your next-steps note. |

| Command | What it does |
| --- | --- |
| `gcloud auth application-default login` | Signs in to GCP with a short-lived login. |
| `az login` | Signs in to Azure with a short-lived login. |
| `gcloud config get-value project` | Shows the active GCP project. |
| `az account show` | Shows the active Azure subscription. |
| `terraform init` / `fmt` / `validate` / `plan` | The core workflow, the same on both clouds. |

| Cloud | Sign-in | Target made explicit with |
| --- | --- | --- |
| GCP | Application Default Credentials | `project` |
| Azure | Azure CLI login | `subscription_id` |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
