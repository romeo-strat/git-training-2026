# M01 — Getting Started with Terraform — Write-up

> **TRAINER-ONLY REFERENCE MODEL ANSWER — NOT A REAL LEARNER BUILD.**
> Authored by the EM/curator to show what a strong M01 write-up looks like. It answers
> the stage's research prompts, so it must **never** reach a trainee. Evidence below is
> **not captured** (no AWS sandbox / no version manager in the authoring environment);
> slots say so rather than inventing output. See `README.md` in this folder.

| | |
| --- | --- |
| Trainee | Reference build — EM/curator model answer (not a real learner) |
| Status | Draft — reference model, **not verified** (no sandbox) |
| Build location | n/a — lives at `docs/reference-builds/m01/` (trainer-only). A real learner's code lives in their own GitLab repository. |
| Hours spent | n/a (reference) |

## What I built

A three-file Terraform configuration that manages one AWS resource — an SSM parameter —
and was taken through the full lifecycle: `init → plan → apply → update → destroy`.

- `versions.tf` — the `terraform` block: minimum CLI version and the required `aws`
  provider with a version constraint.
- `providers.tf` — the `aws` provider for the sandbox region, with a `default_tags`
  block so every resource inherits the same tags.
- `main.tf` — a single `aws_ssm_parameter` (a `String` parameter).
- `.gitignore` — keeps local state and the `.terraform/` cache out of version control,
  while **keeping** `.terraform.lock.hcl` committable.

```
docs/reference-builds/m01/
  versions.tf      provider requirements (no infrastructure)
  providers.tf     AWS provider + default_tags
  main.tf          one aws_ssm_parameter
  .gitignore       ignore state + .terraform/ ; keep the lock file
  write-up.md      this file
```

The layout follows the stage's "compartmentalise by concern" idea: requirements,
provider configuration and resources each have their own file, so a reviewer can see at
a glance where each concern lives.

## Why it's built this way (key decisions)

> Research-prompt answers — **trainer-only.** This is the model answer key.

**Workstation, declarative vs imperative, static-key scanning.** Terraform is
*declarative*: you describe the desired end state and Terraform works out the steps and
the order. A script encodes the steps themselves, so re-running it demands you handle
"already exists" cases yourself; the console does each step by hand and leaves no
reviewable record. I would not reach for Terraform for one-off, throwaway actions or for
things nothing stateful depends on — the overhead of a state file and a plan/apply cycle
is not worth it there. A version manager (`tfenv`/`asdf`) installs an exact Terraform
build and lets you switch between them, so "the version you pinned" is what actually
runs; a bare install gives you whatever is current. On Windows the differences bite in
shell, path and execution behaviour; on macOS in Homebrew/`PATH` handling — which is why
this write-up names the commands per OS. I proved AWS connectivity **without static
keys** by signing in through IAM Identity Center and running `aws sts get-caller-identity`
(no keys ever touch disk). A static-key scan must look at the working tree **and** the
repository history, because a key can be committed and later deleted while still living
in history; what it *cannot* catch is a key that never matched its pattern, was never
committed, or sits outside the scanned paths.

**`versions.tf` and the lock file.** `terraform init` downloads the provider plugin and
records the exact selections it made in `.terraform.lock.hcl`. The distinction that
matters: the constraint in `versions.tf` says *which versions are acceptable*, while the
lock file records *the exact version and checksums that were actually chosen*. A loose
constraint (`~> 6.0`) is convenient and gets fixes automatically but moves on you; a
tight/pinned constraint is reproducible but needs deliberate upgrades. I chose `~> 6.0`
— accept compatible patch/minor updates within the major, no surprise major jumps — and
accepted that the lock file is what makes a given run reproducible. In a merge request
that changes the lock file, a reviewer should check *why* it changed (intended upgrade?)
and that the checksums match a trusted provider, because a lock-file change is how a
supply-chain change would slip in.

**`providers.tf`, credentials and tags.** The AWS provider resolves credentials through
its standard chain (environment, shared config/profile, etc.). To prove *which* identity
a plan uses I rely on `aws sts get-caller-identity` in the same session and confirm the
resource lands in that account — not on assuming. Tags live at the provider via
`default_tags` so every resource gets them consistently and a change is made in one
place; I would still tag a resource *individually* when the tag is specific to that
resource (here, a per-resource `Name`), which is why `main.tf` carries a local `Name`
tag alongside the inherited defaults.

**Resources and planning.** In a resource block I set the arguments I choose (e.g.
`name`, `type`, `value`); Terraform reports back the computed attributes (ARN, IDs,
versions). Before approving a plan I check the action symbols (`+` create, `~` in-place
update, `-/+` or `-` replacement/destroy) and read the attribute-level detail, because
the plan's own annotation is what tells me what a change will *do*. If a plan showed a
destroy I did not expect, I stop — I never approve a plan with a change I cannot
explain.

**Apply and destroy.** A change to `value` on a `String` parameter is made **in place**
(`~`); changing `type` forces **replacement** (`-/+`) because the parameter cannot be
converted. Replacement matters most when the resource holds data or others depend on it
— a replaced resource is deleted and recreated, so anything referencing it can break and
data can be lost. I confirmed destruction **from the cloud side** (querying the
parameter) rather than trusting Terraform's "Destroy complete" line alone.

**Where I spent the most time.** Reasoned in the write-up for a real run — typically on
the `versions.tf`/lock-file understanding and on reading the plan annotations
confidently, because those are the two habits the rest of the course leans on.

## AI collaboration log

Reference model: an honest learner entry here would name the tools used and the share of
the work, give 2–3 concrete prompts, and — required — one wrong or ill-fitting AI
suggestion. A model entry:

- Used an AI assistant for roughly the prose of this write-up and to sanity-check command
  flags; all Terraform files written and understood by the learner.
- Concrete asks: "explain the difference between a version constraint and the lock
  file"; "what does the `~>` operator mean"; "draft a check to find access keys".
- **Wrong suggestion:** the assistant first suggested pinning the provider with
  `version = "6.68.0"` (an exact pin) inside `versions.tf`. That conflates the *pin*
  (which belongs in `versions.env`, ADR-010) with the *constraint* (which belongs in
  `versions.tf`). I changed it to `~> 6.0` and let `versions.env` carry the exact pin.
- Accepted largely as-is: the `default_tags` structure. Rewrote myself: the wording of
  the plan-review classifications, from my own plan output.

## How to build it (teach it to the next engineer)

Assume you have completed nothing before this stage but have workstation access.

1. **Workstation (no code).** Install Terraform through a version manager
   (`tfenv install 1.16.5` / `tfenv use 1.16.5`, or `asdf`), install the AWS CLI and VS
   Code + the HashiCorp Terraform extension, and sign in to AWS via IAM Identity Center
   (`aws configure sso`, then `aws sso login`). Prove the connection:
   `aws sts get-caller-identity` and `terraform -version`. No static keys.
2. **`versions.tf`.** Write the `terraform` block with `required_version` and a
   `required_providers` block for `hashicorp/aws`. Run `terraform init`; watch
   `.terraform/` and `.terraform.lock.hcl` appear. Commit the lock file.
3. **`providers.tf`.** Add the `aws` provider with the sandbox `region` and a
   `default_tags` block. Run `terraform fmt` then `terraform validate`.
4. **`main.tf`.** Add one `aws_ssm_parameter` (String, a placeholder value, and any
   resource-specific tag). Run `terraform plan`; read it and confirm the default tags are
   attached to the resource.
5. **Apply, update, destroy.** `terraform apply`. Change exactly one attribute (`value`),
   `terraform plan` to see the **in-place** update, `terraform apply`, then
   `terraform destroy`. Confirm from the cloud side that the parameter is gone.

Order matters: pin and initialise dependencies *before* writing resources, because
`init` refuses to run against an undeclared provider — a clean, early error instead of a
confusing one later.

## Concepts worth explaining

- **Declarative vs imperative (Step 1).** You state the destination; Terraform computes
  the route and reconciles reality to the declaration. A script states the route and
  makes you handle "already done" cases.
- **Constraint vs lock file (Step 2).** The constraint is a *range* of acceptable
  versions; the lock file is the *exact* version and checksums chosen. Reproducibility
  comes from the lock file, flexibility from the constraint.
- **In-place update vs replacement (Step 5).** The plan's annotation tells you which:
  `~` updates the existing resource in place, `-/+` destroys and recreates it. Choose
  a change you can explain, and never approve a destroy you did not expect.

## What tripped me up

Reference model — real entries keep the **exact error text** and become the course's
common-errors list. The obstacles this stage reliably produces:

- Forgetting the `required_providers` block, so `init` (or a later `validate`) errors
  that the provider is required but not declared — fixed by declaring it and re-running
  `init`.
- Expecting the `plan` to show a resource-level action but seeing only the computed
  attributes — fixed by reading the action symbol and the attribute diff, not just the
  summary line.
- A resource still present after `destroy` because the destroy ran from a different
  directory/state — fixed by running `destroy` in the same configuration directory and
  confirming **from the cloud side**.

## Checkpoint evidence

> **NOT CAPTURED — no AWS sandbox / no version manager in the authoring environment.**
> Do not paste invented output. Run each command in the sandbox and paste the real
> result, trimmed and redacted.

- **DoD-01 —** `terraform -version` after switching between two versions via the version
  manager; `aws sts get-caller-identity` (account/ARN redacted as the trainer directs).
  **Evidence: not captured.**
- **DoD-02 —** the static-key scan you ran over disk and the repository, plus a line on
  what it looked for and what it can miss. **Evidence: not captured.**
- **DoD-03 —** `ls -la` / `find .` showing `.terraform/` and `.terraform.lock.hcl`;
  `git show --stat <commit>` showing the lock file committed; your own words on what the
  lock file recorded. **Evidence: not captured.**
- **DoD-04 —** `terraform fmt -check -diff` run across this folder returned exit `0` with no diff (all three `.tf` files are correctly formatted) — **captured 2026-10-14**:
  ```
  $ terraform fmt -check -diff
  $ echo $?
  0
  ```
  `terraform validate` **not captured** — it needs `terraform init` and the provider download, which were skipped offline. The full DoD-04 needs both halves; only the `fmt` half is evidenced here.
- **DoD-05 —** the pasted `terraform plan` showing the default tags on the resource, plus
  the plan-review note classifying each change (create / in-place / replacement) — trainer
  confirms each. **Evidence: not captured.**
- **DoD-06 —** the `terraform plan` before the one-attribute change showing the in-place
  update, and a cloud-side query (e.g. `aws ssm get-parameter --name …`) proving absence
  after destroy. **Evidence: not captured.**
- **DoD-07 —** the end-to-end run-through from a clean state, with dated notes and the OS
  coverage method agreed with the trainer. **Evidence: not captured.**

## Definition-of-done self-assessment

Against `brief.md`'s seven DoD bullets, and the rubric (`README.md:97-114`):

| DoD | Self-score | Why |
| --- | --- | --- |
| DoD-01 | Not met | No version-manager switch or caller-identity output captured |
| DoD-02 | Not met | No scan run/captured |
| DoD-03 | Partly | Files exist in this folder; `init` not run, lock file not generated/committed |
| DoD-04 | Not met | `fmt`/`validate` not run (offline) |
| DoD-05 | Not met | No plan output |
| DoD-06 | Not met | No plan, no destroy, no cloud check |
| DoD-07 | Not met | Write-up authored but not followed end-to-end by a first-timer |

**Overall: [Unverified] — cannot be accepted.** This reference exists to show the shape
and the reasoning; a real sandbox run is required before any DoD is "met".

## What I'd do differently

Do the workstation proof and the `versions.tf`/`init` step first and capture that
evidence immediately (it is DoD-01 and DoD-03), rather than leaving evidence-gathering to
the end — evidence captured as you build is stronger and faster than reconstructing it.
