# M05 — Terraform for Multi-Environment Deployments

*A self-guided tour: deploy dev and prod from one configuration with separate state, named and tagged consistently.*

---

This tour walks you through deploying one configuration as two environments, one part at a time. It shows you the **moves** — the files to create, the commands to run, the checkpoints to hit — and gives you a way to confirm each step before you move on.

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

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — the objective, the scope, the constraints, the deliverable and the definition of done. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end.

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your code in your own GitLab repository. Link it from the header of your write-up.

> **Builds on M02 and M04.** You need the state bucket from M02 and your parameterised configuration from M04. If either isn't accepted yet, sort that out before you start.

## Where you're headed

By the end of this tour you'll have:

- one configuration deployed as **both** dev and prod;
- two state objects in the M02 bucket, under different keys;
- every resource named `<app>-<env>-<resource>` and tagged through the provider;
- a clean plan for each environment;
- a comparison note on workspaces, a directory per environment, and the per-environment files you used;
- everything destroyed (the bucket kept), and evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list here is short — the one item is how much detail your notes need. Confirm that with your trainer before you invest significant time.

---

## Part 1 — One configuration, two sets of values

**Goal:** take one small configuration and give it a dev set of values and a prod set.

**Try it**

1. Start from a small configuration — the network from M03, or a single `aws_ssm_parameter` will do.
2. Add `dev.tfvars` and `prod.tfvars` with **different** values.
3. Make sure the environment-specific values live in those files, **not** in the main configuration.

**Checkpoint**

- Two `.tfvars` files, each with a different set of values.
- The main configuration files hold no environment-specific value (DoD-03).

**Example — the shape of an environment's values**

```
# dev.tfvars
app = "<app>"
env = "dev"
<the inputs that differ from prod>
```

The names and structure are shown here; **which** inputs are the same in both environments and which must differ is one of your research prompts.

**Pause and predict.** Before you write `prod.tfvars`, predict which inputs you'll be able to copy from `dev.tfvars` unchanged. Then check how many you actually copied.

**Your turn**

- **Which inputs are the same in both environments, and which must differ?**

> **Watch out.** Keep the environment-specific values out of the shared configuration. DoD-03 checks that they live outside the main files.

---

## Part 2 — Separate state, per environment

**Goal:** point each environment at the M02 bucket under its own state key.

**Try it**

1. Add `dev.s3.tfbackend` and `prod.s3.tfbackend`.
2. Point each at the bucket from M02, with its **own** state `key`.
3. Make sure each environment's key is distinct.

**Checkpoint**

- Two backend-configuration files, each with its own key.
- Neither environment can read the other's state by accident.

**Example — the shape of a backend-configuration file**

```
# dev.s3.tfbackend
bucket = "<bucket from M02>"
key    = "<dev state key>"
region = "<region>"
```

The fields are shown here. **How** the key keeps one environment's state apart, and how you would notice if both environments ended up in the same state, are your research prompts.

**Pause and predict.** Before you plan, predict what would happen if both files used the **same** key. Then reason it through — would you notice immediately, or later?

**Your turn**

- **What makes it easy to apply one environment's values to the other's state — and what will you do to make that harder?**
- **How would you notice if both environments ended up in the same state?**

> **Watch out.** This is the quietest failure in the stage: the wrong state key can leave you operating on the other environment without an obvious error. Decide now how you'd catch it.

---

## Part 3 — Naming and tags

**Goal:** make the environment obvious from any resource name and any tag.

**Try it**

1. Name every resource `<app>-<env>-<resource>`.
2. Set `default_tags` in the provider block, including `Environment`.
3. Add whatever other tags your research says a clean-up or cost report would need.

**Checkpoint**

- Every resource name follows the convention.
- Every resource carries the required tags — shown from the plan, the state or the cloud side, not from your code (DoD-04).

**Example — naming and provider-level tags**

```
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.env
      <the other tags your research says you need>
    }
  }
}

resource "aws_..." "..." {
  name = "${var.app}-${var.env}-<resource>"
}
```

`Environment` is shown as an example; the tags **beyond** it, and why a clean-up or cost report would need them, are your research prompt.

**Pause and predict.** Before you apply, predict which tags will actually appear on a resource — the ones you set per resource, or the ones from the provider block, or both. Then check from the cloud side.

**Your turn**

- **Which tags would a clean-up or cost report need beyond `Environment`, and why?**

> **Explain it.** In one sentence, say why provider-level default tags are easier to keep consistent than tagging each resource by hand.

---

## Part 4 — Apply dev, then prod, safely

**Goal:** deploy the same configuration twice, switching environment deliberately each time.

**Try it**

1. Deploy dev:

```
terraform init -backend-config=dev.s3.tfbackend -reconfigure
terraform apply -var-file=dev.tfvars
```

2. Then deploy prod the same way:

```
terraform init -backend-config=prod.s3.tfbackend -reconfigure
terraform apply -var-file=prod.tfvars
```

3. Between the two, decide what you check to be sure you are in the environment you meant.

**Checkpoint**

- Dev is deployed from `dev.tfvars` into dev state.
- Prod is deployed from `prod.tfvars` into prod state.
- You know, before each apply, which environment you're in.

**Pause and predict.** Before the prod step, predict what Terraform would do if you forgot `-reconfigure` after switching the backend file. Then look closely at what it says.

**Your turn**

- **How would you notice that you are in the wrong environment?**

> **Watch out.** The two applies are the moment the wrong state key bites. Build a habit now — a check before every apply — rather than trusting that you remembered.

---

## Part 5 — Prove the separation

**Goal:** see the two state objects, and confirm each environment plans cleanly.

**Try it**

1. List the bucket to see the two state objects under their keys.
2. Run a plan for each environment and confirm it is clean:

```
terraform plan -var-file=dev.tfvars
terraform plan -var-file=prod.tfvars
```

**Checkpoint**

- Two state objects in the bucket, under different keys (DoD-01).
- A clean plan for **each** environment, captured separately (DoD-02).

**Example — the shape of the bucket listing (trimmed)**

```
$ aws s3 ls s3://<bucket>/ --recursive
2026-01-01 12:00:00   <n> bytes  <dev key>
2026-01-01 12:00:00   <n> bytes  <prod key>
```

The format is shown here; your two keys and your plan output are yours to paste.

**Pause and predict.** Before you plan dev again, predict whether it will be a no-op or show changes. Then run it and check.

**Your turn**

- **What does separate state protect — and what does it not?**

> **Watch out.** DoD-02 wants the output for **each** environment, not one plan described as covering both. Paste each result separately.

---

## Part 6 — The comparison note

**Goal:** write down when you'd reach for workspaces, a directory per environment, or the per-environment files you used here.

**Try it**

1. Write your comparison note covering the three ways to separate environments:
   - the per-environment files you used in this stage;
   - **workspaces** (theory — not built);
   - a **directory per environment** (theory — not built).
2. For each, say when it fits and what you give up by not using it.
3. Note how keeping both environments in one account here misrepresents real practice.

**Checkpoint**

- All three approaches are covered, with when each fits (DoD-05).
- Your note says that real teams usually separate accounts.

**Example — the shape of the comparison note**

| Approach | When it fits | What you give up |
| --- | --- | --- |
| Per-environment files + backend config | `<...>` | `<...>` |
| Workspaces | `<...>` | `<...>` |
| Directory per environment | `<...>` | `<...>` |

The table is the format; the judgments are yours.

**Your turn**

- **When would workspaces be the right tool, and what do you give up by not using them here?**
- **When would a directory per environment be the right tool, and what do you give up by not using it?**
- **In what ways does keeping both environments in one account misrepresent real practice?**

> **Explain it.** Pick the isolation method you'd choose for a real team, and say in one sentence why.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- the bucket listing showing two state objects under different keys;
- a clean plan for **each** environment, captured separately;
- confirmation that environment-specific inputs live outside the main files;
- names and tags shown from the plan, the state or the cloud side — not from your code;
- the comparison note covering all three approaches;
- both environments destroyed and the bucket retained, confirmed from the cloud side.

### 7b. The clean-up gate

Before you call the stage done, confirm:

- **Both environments are destroyed.** `terraform destroy` for dev and again for prod, each against its own backend.
- **The bucket is retained.** This is the exception: keep the M02 bucket and its lock configuration. Don't delete it.
- **Nothing else is left running.** Confirm from the cloud side, not just from Terraform's output.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

Confirm with `git status` that no state file appears and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the one configuration deployed twice, and how it is laid out. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas from this stage, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time — here it is just the note about how much detail your notes need.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `dev.tfvars`, `prod.tfvars` | The values that differ per environment. |
| `dev.s3.tfbackend`, `prod.s3.tfbackend` | Point each environment at the shared bucket, under its own state key. |
| `providers.tf` | The provider block, including `default_tags`. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your comparison note and your teaching guide. |

| Command | What it does |
| --- | --- |
| `terraform init -backend-config=<file> -reconfigure` | Points the working directory at one environment's backend. |
| `terraform apply -var-file=<file>` | Deploys using one environment's values. |
| `terraform plan -var-file=<file>` | Shows what would change for that environment. |
| `terraform destroy` | Removes that environment's resources. Do it for both; keep the bucket. |

| Approach | In one line |
| --- | --- |
| Per-environment files | One configuration, values and backend config per environment. |
| Workspaces | One configuration, multiple named states. |
| Directory per environment | A separate configuration per environment. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
