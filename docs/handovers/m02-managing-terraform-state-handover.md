# Handover — M02 Managing Terraform State

> **Trainer/agent material. Not trainee-facing.** Do not copy this file into `modules/`, a write-up or any learner-visible artifact.

| | |
| --- | --- |
| Module | `modules/m02-managing-terraform-state` |
| Stage | 2 of 9 |
| Builds on | M01 |
| Feeds into | M05, M06, M07, M08 |
| Status | Coaching package delivered — awaiting learner build |
| From | Curriculum Architect (EM) |
| To | DevOps Mentor |
| Next reviewer | Technical Reviewer |
| Mentor output | [m02-devops-mentor-coaching-package.md](m02-devops-mentor-coaching-package.md) |

## 1. Handover intent

The DevOps Mentor is asked to coach the learner through M02. Do **not** implement the stage on the learner's behalf. Follow the mentor teaching sequence (`.opencode/agents/devops-mentor.md:14-26`): explain the problem, connect the concept, state the outcome and constraints, give a focused task, give escalating hints, help implement and troubleshoot, verify with real evidence, explain trade-offs, help document.

The mentor must **not** mark the stage complete. Submit the work and its evidence for independent review (`.opencode/agents/devops-mentor.md:105-106`).

## 2. Target competency and learning objectives

Source: `modules/m02-managing-terraform-state/brief.md:5-7` (Objective).

By the end of this stage the learner can explain what Terraform's local state records and why it must be treated as sensitive, and move that state into a protected remote backend they can show is versioned, encrypted and locked — using their own state, their own bucket and their own lock error as evidence. The bucket is reused by later stages, so it must be built as something trustworthy to hold their state.

## 3. Deliverable and definition of done

**Deliverable** (`brief.md:34-36`): a protected S3 state bucket and a small configuration whose local state the learner inspected and then migrated into it as its remote backend, with locking demonstrated.

**Definition of done** (`brief.md:56-62`), which the mentor must have the learner evidence, never assume:

- **DoD-01** — notes show where local state lives and what it records for one of the learner's own resources, captured read-only from their own state (output pasted).
- **DoD-02** — notes show what state holds for a sensitive value, captured from their own state without exposing a real credential.
- **DoD-03** — a state object for the configuration exists in the bucket (listing pasted), and a plan after migrating local state shows no changes (nothing recreated).
- **DoD-04** — versioning, encryption at rest and full public-access block shown **from the cloud side**, not from the configuration.
- **DoD-05** — backend enables native locking, no DynamoDB table used or created, and with one operation in progress a second is refused with a lock error (error output pasted).
- **DoD-06** — bucket retained, everything else destroyed and confirmed from the cloud side; no static keys, state files or state contents committed, shown by the ignore rule and a clean commit history.
- **DoD-07** — the write-up takes a first-time learner from local state to a protected remote backend with locking demonstrated, unaided, verified end to end from a clean state.

## 4. Stage constraints and boundaries

Source: `brief.md:20-32` plus the course-wide rules (`README.md:80-91`).

- All rules for every stage apply, **with one exception**: the state bucket is **kept** when everything else is destroyed (`brief.md:22`).
- AWS only; a few small, cheap resources are enough for the local-state part.
- The bucket bills while it exists — look up what each resource bills before creating it, and destroy everything else at the end.
- State is **local until migrated**, and state files never go into version control.
- State subcommands are **read-only inspection only**; nothing about state changes outside the plan/apply cycle.
- S3 backend with Terraform's **native state locking** and **no DynamoDB table** (ADR-006); Terraform 1.11 or later.
- Native locking is generally available from 1.11 — check every locking claim against the pinned version's release notes before writing it down.
- Bootstrap the bucket from a **local-state configuration**, then keep it; **migrate** the existing local state rather than recreating it.
- The sandbox role must be able to create and delete the lock object; if it cannot, that is a sandbox access gap to raise with the trainer — not something to work around.
- **Out of scope:** drift and reconciliation, ephemeral values and write-only arguments, recovering a lock left behind, HCP Terraform and any backend other than S3 (GitLab-managed state is mention-only), per-environment state layout (M05), marking inputs/outputs sensitive (M04), and moving/importing/removing resources from state (M08).

## 5. Research prompts the learner must resolve alone

Source: `brief.md:13-18`. Each is **sensitive**: the mentor must never state the answer, name the mechanism, or confirm the choice. They belong in the write-up's "Why it's built this way" section (leak rule, `docs/templates/trainee-task-planner.md:44-56`).

- **Local state (read-only):** what to check before trusting a state file you did not create, and what goes wrong when state is edited by hand.
- **Secrets and state:** what can leak a secret into state and how to demonstrate that safely without a real credential, and why the course treats a state file as sensitive even when the configuration contains no secrets.
- **Why remote:** what a remote backend gives a team that local state cannot.
- **Bootstrapping and securing the bucket:** how the learner solved creating the thing that stores their state and what they would do differently on a team; who and what needs access to the bucket and how narrow that can be without breaking Terraform; why the bucket is kept when everything else is destroyed and what risk that carries.
- **Backend config and migration:** how the learner knows nothing was recreated.
- **Native locking:** what locking prevents, and what it does not.

## 6. Dependencies and prerequisites

- **M01 must be accepted first** (`tasks.md:11`). At handover time M01 has no learner build (see the M01 handover), so this is an open prerequisite — confirm the learner has completed and passed M01 before starting M02. M01's Technical Reviewer report is also absent from the repository, so M01's acceptance is unverifiable in-repo.
- Pre-made, short-lived AWS sandbox access via IAM Identity Center (ADR-005) — an ongoing hard dependency on the sandbox owner.
- **Sandbox role permission:** the role must be able to create and delete the lock object in the bucket (`brief.md:30`, ADR-006). The specific access actions that requires are **sensitive** and belong to research prompt 4 — do not name them in mentor material. If the role cannot do it, the learner raises it with the trainer.
- `versions.env` at the repo root pins Terraform to `1.16.5` (>= 1.11, so native locking is available) and the providers.
- Toolchain as M01: Terraform via a version manager, AWS CLI, Git, `jq`, VS Code + HashiCorp extension.

## 7. Risks, failure modes and still-open items

From `brief.md:70-72` plus stage boundaries:

- **Sandbox lock permission** — if the role cannot write the lock object, locking cannot be demonstrated; escalate, do not work around.
- **Retained bucket cost** — the bucket outlives the stage; the learner must remember it is the one thing left running, and the capstone clean-up removes it (ADR-006, ADR-011).
- **`init -migrate-state` pitfalls** — the highest-risk step: a botched migration can recreate resources. The DoD-03 "plan shows no changes" check is the guard.
- **State hygiene** — watch that no `terraform.tfstate*` is committed and the ignore rule is in place (DoD-06).
- **Locking claims vs release notes** — the learner must reconcile every locking statement against the pinned version's notes, not from memory.
- **Brief-level leak (trainer decision).** Parts of research prompts 5 and 6 are already conceded by the brief itself: DoD-03 states that a no-change plan after migration proves nothing was recreated, and DoD-05 states that a second operation is refused with a lock error; the objective also overlaps prompts 2–3. Generated artifacts must restate the brief verbatim, so this is a brief-level decision — consider rewording `brief.md` and regenerating `tasks.md`/`write-up-template.md`, as was done for prompts Q1/Q4 (`knowledge/retros/2026-10-02-briefs-that-answer-their-own-questions.md`).
- How much detail the notes need — confirm expected length/depth with the trainer.

## 8. Evidence and acceptance gate

Evidence to capture (`brief.md:50`): the read-only inspection; what state holds for a sensitive value (placeholder only); the state object listing in the bucket; the protections shown from the cloud side; the plan after migration; and the lock error.

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable works, every DoD item met and evidenced, and no stored credential, no committed state file and nothing left running that the brief says to destroy. A stage scoring ≥ 90 is a candidate for the content library.

**Acceptance gate for this handover:** the mentor hands the learner's build + write-up + evidence to the **Technical Reviewer**; the mentor does not self-approve.

## 9. Source references

- `modules/m02-managing-terraform-state/brief.md` — objective, scope/research prompts, constraints, deliverable, lab, DoD.
- `modules/m02-managing-terraform-state/tasks.md` — generated checklist.
- `modules/m02-managing-terraform-state/write-up-template.md` — write-up sections.
- `README.md:80-91` — rules for every stage; `README.md:93-116` — review rubric.
- `docs/arch-docs/adrs/ADR-002-terraform-cli-with-opentofu-sidebar.md`, `ADR-003-aws-primary-gcp-azure-setup-only.md`, `ADR-005-sandbox-accounts-and-short-lived-credentials.md`, `ADR-006-s3-remote-state-native-locking.md`, `ADR-011-cost-and-destroy-controls.md`, `ADR-010-content-ci-and-version-pinning.md` (the `versions.env` source of truth).
- `docs/handovers/m01-getting-started-with-terraform-handover.md` — the stage this builds on.
- `.opencode/agents/devops-mentor.md`, `.opencode/agents/curriculum-architect.md`.
- `docs/build-to-teach-framework/build-to-teach-framework.md`.
