# Handover — M01 Getting Started with Terraform

> **Trainer/agent material. Not trainee-facing.** Do not copy this file into `modules/`, a write-up or any learner-visible artifact.

| | |
| --- | --- |
| Module | `modules/m01-getting-started-with-terraform` |
| Stage | 1 of 9 |
| Builds on | — (course entry point) |
| Feeds into | M02, M03, M08, M09 |
| Status | Coaching package delivered — awaiting learner build |
| From | Curriculum Architect (EM) |
| To | DevOps Mentor |
| Next reviewer | Technical Reviewer |
| Mentor output | [m01-devops-mentor-coaching-package.md](m01-devops-mentor-coaching-package.md) |

## 1. Handover intent

The DevOps Mentor is asked to coach the learner through M01. Do **not** implement the stage on the learner's behalf. Follow the mentor teaching sequence (`devops-mentor.md:14-26`):

1. Explain the immediate engineering problem.
2. Connect it to the relevant concept.
3. Describe the intended outcome and constraints.
4. Give the learner a focused task.
5. Provide hints or examples appropriate to their skill level.
6. Help the learner implement and troubleshoot.
7. Verify the result using real evidence.
8. Explain the trade-offs and lessons learned.
9. Help document the final implementation.

The mentor must **not** mark the stage complete. Submit the work and its evidence for independent review (`devops-mentor.md:105-106`).

## 2. Target competency and learning objectives

Source: `modules/m01-getting-started-with-terraform/brief.md:5-7` (Objective).

By the end of this stage the learner can: set up their own workstation; sign in to AWS without static keys; take one simple resource through the whole Terraform lifecycle (init, plan, apply, update, destroy) using their own terminal output and plans as evidence; explain what Terraform is, what a provider is and why versions are pinned; and predict from a plan whether a change updates in place or replaces.

## 3. Deliverable and definition of done

**Deliverable** (`brief.md:34-36`): a configuration of `versions.tf`, `providers.tf` and `main.tf` managing one simple AWS resource, taken through create, in-place update and destroy from a workstation the learner set up themselves, with a written plan-review note.

**Definition of done** (`brief.md:56-62`), which the mentor must have the learner evidence, never assume:

- **DoD-01** — actual Terraform version from a version manager, switched between two versions (output pasted), and a caller-identity query from the learner's signed-in session (output pasted, redacted as directed).
- **DoD-02** — the scan run for static access keys on disk and in the repository, and what it looked for.
- **DoD-03** — `terraform init` created `.terraform` and `.terraform.lock.hcl` from the learner's own `versions.tf`, the lock file is committed, and the notes say in their own words what it recorded.
- **DoD-04** — formatting and validation pass with no errors on `providers.tf` and `main.tf`, shown as pasted output.
- **DoD-05** — pasted, read plan output showing the default tags on the resource; the plan-review note classifies every change as create, in-place update or replacement; the trainer confirms each classification.
- **DoD-06** — the plan before the one-attribute change shows an in-place update (output pasted), and after destroy nothing exists in the sandbox, confirmed from the cloud side.
- **DoD-07** — the write-up takes a first-time learner on either operating system from an empty folder to a destroyed resource unaided, verified by following it end to end from a clean state.

## 4. Stage constraints and boundaries

Source: `brief.md:19-32` plus the course-wide rules (`README.md:80-91`).

- Runs on macOS **or** Windows; notes must serve a learner on either. If the learner owns only one OS, agree with the trainer how the other is verified.
- Terraform **CLI**, 1.11 or later, exact version in `versions.env`; **not** OpenTofu (ADR-002). OpenTofu is an optional M01 topic only.
- Terraform installed via a version manager (`tfenv`/`asdf`) where one works; state where neither does.
- Editor: VS Code with the HashiCorp Terraform extension. Other tools: AWS CLI, Git, `jq`; lab scripts are POSIX shell.
- AWS sign-in via IAM Identity Center through the AWS CLI. **No IAM user access keys, no long-lived credentials of any kind** (ADR-005).
- The AWS sandbox is provided before the course; sandbox/account/budget/guardrail setup is **not** in this stage.
- AWS only, one very simple resource (`aws_ssm_parameter`), to focus on workflow not AWS architecture.
- State is **local** in this stage and never committed; the plan is read before every apply.
- Look up what the resource bills before applying; destroy at the end of the stage.
- **Out of scope:** variables and validation (M04), state and remote backends (M02), lifecycle controls that change replacement (M06), refactoring without replacement (M08), GCP and Azure (M09), HCP Terraform, Terraform Stacks, Packer and Kubernetes providers.

## 5. Research prompts the learner must resolve alone

Source: `brief.md:13-17`. Each is a **sensitive** item: the mentor must never state the answer, name the mechanism, or confirm the choice. These belong in the write-up's "Why it's built this way" section, not in coaching answers (leak rule, `docs/templates/trainee-task-planner.md:44-56`).

- **Step 1 — Workstation:** what problem Terraform solves that a script/the console does not and where it would not be used; describing desired state vs scripting steps; install method per tool per OS and its maintenance cost; how a version manager pins Terraform; what fails differently on Windows vs macOS; how to prove AWS connectivity without static keys; what a static-key scan must look at and what it can miss.
- **Step 2 — Dependencies:** what Terraform downloads on init and where; the difference between a declared version constraint and what the lock file records; how loose/tight a provider constraint should be and who carries the risk; what a reviewer looks for in a merge request that changes the lock file.
- **Step 3 — Configuration:** how the AWS provider decides which credentials to use and how to prove which identity a plan uses; why tags are set at the provider rather than per resource, and when to tag a resource individually.
- **Step 4 — Resources and planning:** which parts of a resource the learner sets vs Terraform reports back; what to check in a plan before approving; how to tell from the plan alone what a change will do; what to do if a plan shows an unexpected destroy.
- **Step 5 — Apply and destroy:** which changes are in place vs force replacement and how sure; what a replacement costs when the resource holds data or others depend on it; how to confirm from the cloud side that everything is gone.

## 6. Dependencies and prerequisites

- Course entry point — no prior stage required; the first Setup task simplifies accordingly (`docs/templates/trainee-task-planner.md:181`).
- Pre-made, short-lived AWS sandbox access via IAM Identity Center (ADR-005) — a **hard dependency** on the sandbox owner.
- Interactive logins expire: M01 must teach re-login and the symptoms of expired tokens (ADR-005 consequences).
- `versions.env` at the repo root is the single source of truth for the pinned Terraform version and provider versions (`docs/README.md`, ADR-010). It now exists: `TF_VERSION=1.16.5` (latest stable), `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0`. DoD-01's version evidence is unblocked.
- Toolchain: Terraform via tfenv/asdf, AWS CLI, VS Code + HashiCorp extension, Git, `jq`.

## 7. Risks, failure modes and still-open items

From `brief.md:74-79` plus stage boundaries:

- How the OS the learner does not own will be verified — agree with the trainer.
- Which caller-identity details to redact before pasting.
- Whether the sandbox allows creating an `aws_ssm_parameter` in the learner's account/region.
- How much detail the notes need — confirm expected length/depth before the learner invests significant time.
- Replacement surprises and cost surprise are the two most likely traps; both are covered by the plan-review habit and the cost-estimate rule.
- Watch for learners skipping the pre-resource steps (workstation, `versions.tf`) — M01 is deliberately front-loaded on environment and mental model.

## 8. Evidence and acceptance gate

Evidence to capture (`brief.md:50`): version output including a switch between two Terraform versions; caller-identity output; the static-key scan; the files `terraform init` created; the plan showing default tags on the resource; the plan showing the in-place update; and destroy confirmed from the cloud side.

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable works, every DoD item met and evidenced, and no stored credential, no committed state file and nothing left running. A stage scoring ≥ 90 is a candidate for the content library.

**Acceptance gate for this handover:** the mentor hands the learner's build + write-up + evidence to the **Technical Reviewer**; the mentor does not self-approve.

## 9. Source references

- `modules/m01-getting-started-with-terraform/brief.md` — objective, scope/research prompts, constraints, deliverable, lab, DoD.
- `modules/m01-getting-started-with-terraform/tasks.md` — generated checklist.
- `modules/m01-getting-started-with-terraform/write-up-template.md` — write-up sections.
- `README.md:80-91` — rules for every stage; `README.md:93-116` — review rubric.
- `docs/arch-docs/adrs/ADR-002-terraform-cli-with-opentofu-sidebar.md`, `ADR-003-aws-primary-gcp-azure-setup-only.md`, `ADR-005-sandbox-accounts-and-short-lived-credentials.md`, `ADR-010-content-ci-and-version-pinning.md` (the `versions.env` source of truth).
- `.opencode/agents/devops-mentor.md`, `.opencode/agents/curriculum-architect.md`.
- `docs/build-to-teach-framework/build-to-teach-framework.md`.
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md` — handover shape and findings from this run.
