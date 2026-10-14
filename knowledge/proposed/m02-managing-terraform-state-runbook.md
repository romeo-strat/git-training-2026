# M02 — Managing Terraform State — Trainer Runbook & Lesson

> **STATUS: DRAFT — no learner build, no AWS sandbox.** This content was curated from
> the M02 handover, the reviewed coaching package, the stage brief and the course rules.
> No learner has built M02 yet and there is no sandbox to run against, so **nothing
> runtime has been verified**. Every claim below is tagged. See [Status vocabulary](#status-vocabulary).
>
> **Library mapping note.** This repository's learning area is `knowledge/` (with
> `retros/`, `patterns/`, `rules/`, `prompts/`), not the generic `library/` named in the
> Knowledge Curator role file. This draft's spec location `library/proposed/` maps to
> **`knowledge/proposed/`** here.
>
> **Audience:** trainers, DevOps mentors and curriculum maintainers who run M02 and
> verify it. **Not trainee-facing.** Do not copy into `modules/` or any learner-visible
> artifact (trainee-view rule, `docs/templates/build-to-teach-playbook.md`).

| | |
| --- | --- |
| Source stage | `M02` — `modules/m02-managing-terraform-state` |
| Source tasks | `TASK-M02-B01…B08`, `V01…V07`, `W01…W10` |
| Version pin source | `versions.env` (ADR-010) |
| Status | Draft — awaiting first learner build |
| Curated on | 2026-10-14 |

## Status vocabulary

| Tag | Meaning |
| --- | --- |
| **[Verified]** | Stated in the repo (brief, handover, coaching package, README, ADR) or directly checkable in a file. |
| **[Expected]** | The intended behaviour per the brief/handover; not yet observed because no build exists. |
| **[Unverified]** | Cannot be confirmed without a learner build or sandbox. Must be checked before approval. |
| **[Recommendation]** | Curator's suggested practice; not a requirement of the stage. |
| **[Learner-owned]** | A sensitive research prompt (`brief.md:13-18`). The learner resolves it; **do not supply the answer.** See [Concepts explained (trainer level)](#5-concepts-explained-trainer-level). |

## 1. Intended audience and learning objectives

**Audience:** a trainer or mentor delivering M02 for the first time, a curriculum
maintainer adapting M02, or a reviewer checking that a learner's state-migration
evidence is real.

By the end of this runbook the reader can:

1. Describe what M02 asks the learner to build — a protected S3 state bucket plus a
   config whose local state is migrated into it — and why the bucket is deliberately
   **kept** when everything else is destroyed. **[Verified]**
2. Coach the six scope topics (local state → secrets → why remote → bucket →
   migration → locking) without implementing the stage for the learner and without
   leaking any of the six research-prompt answers. **[Verified]**
3. Verify each of DoD-01…DoD-07 against real, pasted, cloud-side evidence rather than a
   claim or configuration. **[Verified]**
4. Recognise the failure modes a learner is most likely to hit — especially a botched
   `init -migrate-state` — and the diagnostic steps that keep a failed migration from
   becoming a recreated resource. **[Expected]**
5. Know what must be re-verified once a real build exists. **[Unverified]**

## 2. Prerequisites

- The trainer has read the stage `brief.md` top to bottom and the course-wide
  "Rules for every stage" (`README.md:80-91`). **[Verified]**
- **M01 must be accepted first** (`brief.md:3`, `tasks.md:11`). At curation time M01 has
  no learner build, so this is an **open, blocking prerequisite**. M01's Technical
  Reviewer report is also absent from the repository, so M01's acceptance is
  unverifiable in-repo. **[Verified]** (`handover §6`)
- A pre-made, short-lived AWS sandbox reachable via IAM Identity Center is available
  **before** the stage — a hard dependency on the sandbox owner (`ADR-005`). **[Verified]**
- **Sandbox role permission:** the role must be able to create **and delete** the lock
  object in the bucket (`brief.md:30-31`; ADR-006). The specific access actions that
  requires are **[Learner-owned]** (research prompt 4). If the role cannot do it, the
  learner raises it with the trainer. **[Verified]**
- `versions.env` exists at the repo root and is the single source of truth for pins
  (ADR-010). Current pins: `TF_VERSION=1.16.5` (≥ 1.11, so native locking is
  available), `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`,
  `AZURERM_PROVIDER_VERSION=5.9.0`. **[Verified]**
- Toolchain as M01: Terraform CLI via a version manager (`tfenv`/`asdf`), AWS CLI,
  VS Code + HashiCorp Terraform extension, Git, `jq`; lab scripts are POSIX shell.
  **[Verified]**
- The learner must **not** be handed the answers to the six research prompts; the
  trainer never states the conclusion (`brief.md:13-18`; leak rule
  `docs/templates/trainee-task-planner.md:44-56`). **[Verified]**

## 3. Problem statement — why this stage exists

M02 is where state stops being an implementation detail and becomes the thing the
learner must protect. After M01 leaves state local and untouched, M02 has the learner
read a real state file, see a sensitive value sitting in it, then move their own state
into a protected remote backend and prove locking works. **[Verified]** (`brief.md:5-7,11`)

Deliverable (`brief.md:34-36`): **a protected S3 state bucket and a small configuration
whose local state the learner inspected and then migrated into it as its remote
backend**, with locking demonstrated. **[Verified]**

**Design intent to preserve when adapting:** the learner works on **their own** state,
**their own** bucket and **their own** lock error — explicitly not a worked example
(`brief.md:11`). The bucket is reused by later stages, so it is built to be trusted.
**[Verified]**

## 4. Workflow overview

```
  Step 0  Setup        read brief + rules · copy write-up template · CONFIRM M01 ACCEPTED   (no code)
  Step 1  Local state  one aws_ssm_parameter (placeholder password) · init · apply          (local state)
  Step 2  Inspect       state list/show (read-only) · find the value in tfstate · .gitignore (read-only)
  Step 3  The bucket    separate folder · aws_s3_bucket + versioning + encryption + PAB      (local state)
  Step 4  Backend       add backend "s3" (use_lockfile=true) · init -migrate-state · plan   (migration)
  Step 5  Locking       apply held at prompt · plan in 2nd terminal · read the lock error    (locking)
  Step 6  Assembly      bucket + migrated config + lock demo · write-up · Status → "In review"
```

Lifecycle exercised: **local state → inspect → bootstrap bucket → migrate → lock**.
**[Verified]** (`brief.md:44-48`)

Two configurations are deliberate: the **bucket** lives in its own folder with local
state and is **kept**; the **first** configuration migrates its state into the bucket
and is the one destroyed at clean-up. A reviewer should be able to tell which folder is
which. **[Verified]** (`brief.md:22,46-47,52`)

## 5. Concepts explained (trainer level)

Keep each of these usable for coaching **without** answering a learner research prompt.

- **State hygiene. [Verified]** State is local until migrated and state files never go
  into version control (`brief.md:25`). Read-only inspection only — nothing about state
  changes outside the plan/apply cycle (`brief.md:26`).
- **Remote state with locking. [Verified]** The S3 backend with Terraform's **native**
  locking, **no DynamoDB table**, Terraform 1.11+ (`brief.md:27`; ADR-006). Native
  locking is generally available from 1.11. **[Verified]**
- **Migrate, don't recreate. [Verified]** The learner moves existing local state into
  the backend (`init -migrate-state`) rather than recreating resources
  (`brief.md:29,47`). This is the highest-risk step (see §8).
- **Cloud-side evidence is the standard. [Verified]** Protections (DoD-04) and
  destruction (DoD-06) must be shown from the cloud side, not from the configuration
  (`brief.md:59,61`). "The config says so" is not evidence.
- **The bucket is the exception. [Verified]** Everything under the course rules applies
  **except** the bucket is kept when everything else is destroyed (`brief.md:22,52`;
  ADR-006, ADR-011).
- **Cost before create. [Verified]** The bucket bills while it exists, so the learner
  looks up what each resource bills before creating it, and destroys everything else at
  the end (`brief.md:24`; `README.md:88`).
- **Locking claims vs release notes. [Verified]** Every locking claim in the notes must
  be reconciled against the **pinned version's** release notes, not from memory
  (`brief.md:28`).

**Learner-owned concept areas — [Learner-owned], do not answer:** what to check before
trusting a state file you did not create and what breaks when state is hand-edited;
what can leak a secret into state and why state is sensitive even with no secrets in
config; what a remote backend gives a team that local state cannot; how to bootstrap the
bucket and what to do differently on a team, who/what needs bucket access and how narrow
it can be, and why the bucket is kept and what risk that carries; how the learner knows
nothing was recreated; and what locking prevents and does not. Covering these in a
coached lesson would leak the stage's design answers. Coach the *method* (where to look,
what to compare, what to record), never the conclusion. **[Verified]**

## 6. Implementation walkthrough — how to coach each step

The mentor follows the teaching sequence in `.opencode/agents/devops-mentor.md:14-26`
(problem → concept → outcome/constraints → focused task → hints → implement/troubleshoot
→ verify → trade-offs → document) and **does not implement the stage for the learner**.
**[Verified]** Every phase ends with evidence captured, not with "done". **[Verified]**

| Step | Learner builds | Trainer's job | Evidence to capture |
| --- | --- | --- | --- |
| 0 Setup | Reads brief + rules, copies `write-up-template.md` → `write-up.md` | **Confirm M01 accepted** before anything; answer the "Still open" items (`brief.md:70-73`) | Not applicable |
| 1 Local state | One `aws_ssm_parameter` with a placeholder password; `init` + `apply`; watch `terraform.tfstate` | Keep it read-only after apply; insist the placeholder is never a real credential | State path; `state list`/`show`; the placeholder line **[Expected]** |
| 2 Inspect | `state list`/`state show` (read-only); find the value in `.tfstate`; add `terraform.tfstate*` to `.gitignore` | Enforce read-only — no `state` mutations | `show` output; ignore rule proven with `git check-ignore` **[Expected]** |
| 3 The bucket | Separate folder: `aws_s3_bucket` + versioning + encryption + public-access block; apply with **local state** | Note this folder is **never destroyed**; cost lookup first | Cloud-side versioning/encryption/PAB output (DoD-04) **[Expected]** |
| 4 Backend | Add `backend "s3"` (bucket, `use_lockfile = true`, **no** DynamoDB); `init -migrate-state`; `plan` | This is the highest-risk step: a no-change plan is the guard | Migration output; identical `state list`; **No changes** plan; bucket listing (DoD-03) **[Expected]** |
| 5 Locking | Terminal 1: `apply` held at the prompt; Terminal 2: `plan`; read the lock error | Have the learner reconcile the claim against the pinned release notes (E19) | Lock error verbatim; backend block; no DynamoDB (DoD-05) **[Expected]** |
| 6 Assembly | Bucket + migrated config + lock demo; write-up; `Status → "In review"` | Check the header links the GitLab repo/branch; run the clean-up gate | Signed-off DoD evidence; clean-up gate **[Expected]** |

The eight build tasks are `TASK-M02-B01…B08` (`tasks.md:15-22`); the coaching package
maps a contiguous 20 exercises (E1–E20, including one E-ID per research prompt) onto
these phases (`coaching §1-2`). **[Verified]**

## 7. Verification steps and expected outcomes (DoD-01…07)

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable
works, every DoD item met and evidenced, and no stored credential, no committed state
file and nothing left running that the brief says to destroy. **[Verified]** A stage
scoring ≥ 90 is a content-library candidate. **[Verified]**

| DoD | What the trainer verifies | Expected evidence | Tag |
| --- | --- | --- | --- |
| DoD-01 | Where local state lives and what it records for one of the learner's own resources, read-only | State path; `state list`; `state show` — from the learner's **own** state | **[Expected]** |
| DoD-02 | What state holds for a sensitive value, without exposing a real credential | The placeholder lines from their own state | **[Expected]** |
| DoD-03 | A state object exists in the bucket **and** a plan after migration shows no changes | Migration output; identical `state list`; **No changes** plan; bucket listing | **[Expected]** |
| DoD-04 | Versioning on, encryption at rest on, public access fully blocked — **cloud side** | `get-bucket-versioning`, `get-bucket-encryption`, `get-public-access-block` | **[Expected]** |
| DoD-05 | Backend enables native locking, no DynamoDB used/created, and a second op is refused | Backend block (`use_lockfile`, no `dynamodb_table`); lock error pasted | **[Expected]** |
| DoD-06 | Bucket retained, everything else destroyed (cloud side), no state/keys committed | Bucket listing; `ParameterNotFound`; ignore rule; clean state history; key/content scan | **[Expected]** |
| DoD-07 | Write-up takes a first-timer from local state to a protected remote backend with locking, unaided | End-to-end run-through; notes depth agreed with trainer | **[Expected]** |

**Evidence reality check.** All DoD evidence above is **[Expected]** only. No learner
build exists, so none of it has been observed. The pinned version `TF_VERSION=1.16.5`
is **[Verified]** in `versions.env`, but that a learner's `-migrate-state` succeeds, that
the protections are on, and that a lock error appears are all **[Unverified]**.

**Acceptance gate.** The mentor hands the build + write-up + evidence to the
**Technical Reviewer**; the mentor does not self-approve (`handover §8`;
`.opencode/agents/devops-mentor.md:105-106`). **[Verified]**

**Note on the coaching package's review status.** The M02 coaching package was reviewed
and **ACCEPTED** by the Technical Reviewer this run, with six findings (leak of an IAM
mechanism for research prompt 4; orphaned exercise numbers; a DoD-06 evidence gap; and
three lower items) all resolved. No Technical-Reviewer report artifact was committed to
the repository, so treat "ACCEPTED" as **[Unverified]** in-repo until the report is
attached. The package itself describes this as a handoff (`coaching §6`).

## 8. Troubleshooting scenarios

The full diagnostic map is in [`m02-common-errors.md`](m02-common-errors.md). The first
risk in this stage is not technical — it is the **open M01 prerequisite**: M02's Setup
requires M01 accepted (`tasks.md:11`), and at curation time it is not. **[Verified]**

A short summary of the failure classes:

- **Migration pitfalls** (`AccessDenied`, `NoSuchBucket`, a change appearing in the plan
  after `init -migrate-state`). The highest-risk step: if a plan shows an unexpected
  change, the process rule is **stop, do not apply, capture the exact text, raise with
  the trainer** (DoD-03 guard). **[Expected]**
- **Lock-object permission** (the sandbox role cannot create/delete the lock object).
  This is a **sandbox access gap to escalate**, never to work around
  (`brief.md:30-31`). **[Verified]**
- **Locking-claim drift** (notes assert behaviour that does not match the pinned
  version). Fix: reconcile against the `1.16.5` release notes (E19). **[Verified]**
- **State hygiene slips** (`.tfstate` staged, or state content committed under another
  name). Fix: the ignore rule plus the key/state-content scan (DoD-06). **[Expected]**
- **Unexpected lock error** with no run in progress. Recovering a lock left behind is
  **out of scope** (`brief.md:32`); escalate. **[Verified]**
- **Destroying the wrong folder** (running `destroy` in the bucket config). The process
  rule: destroy the **first** config only; the bucket stays. **[Verified]**

## 9. Security considerations

- **No static credentials, ever.** No IAM user access keys and no long-lived credentials
  of any kind; sandbox accounts and short-lived sign-in only (`README.md:86`,
  `ADR-005`). **[Verified]**
- **State is sensitive and never committed** (`brief.md:25`; DoD-06). What lands in
  state and what can leak a secret into it is **[Learner-owned]** (research prompt 2);
  demonstrate only with a placeholder, never a real credential (`brief.md:44,57`).
  **[Verified]**
- **Redact state output and account IDs/ARNs** before pasting. What to redact is a
  trainer decision. **[Verified]** — placeholders: `<AWS_ACCOUNT_ID>`, `<IAM_ROLE_ARN>`,
  `<BUCKET_NAME>`, `<LOCK_KEY>`.
- **Bucket access should be as narrow as possible** while still letting Terraform work.
  How narrow is **[Learner-owned]** (research prompt 4); the trainer must not name the
  access actions the lock object requires. **[Verified]**
- **Never paste credentials, tokens or key material** in the write-up
  (`write-up-template.md:3`). **[Verified]**
- **The bucket is the one retained resource** and carries ongoing cost and a standing
  data-exposure surface — call this out in review (`brief.md:24`; ADR-006, ADR-011).
  **[Verified]**

## 10. Alternatives and trade-offs

- **S3 backend with native locking, not DynamoDB. [Verified]** The stage requires
  native locking and no DynamoDB table (`brief.md:27`; ADR-006). DynamoDB-based locking
  is the older pattern and is not used here. **[Verified]**
- **Bootstrap with local state, then keep the bucket. [Verified]** The chicken-and-egg
  problem of creating the thing that stores your state is solved with a separate
  local-state config; what to do differently on a team is **[Learner-owned]** (research
  prompt 4). **[Verified]**
- **Migrate, don't recreate. [Verified]** `-migrate-state` preserves existing resources;
  recreating would risk replacement and cost (`brief.md:29`). **[Verified]**
- **Out of scope by design. [Verified]** Drift/reconciliation, ephemeral/write-only
  values, recovering a stranded lock, HCP Terraform and non-S3 backends (GitLab-managed
  state is mention-only), per-environment layout (M05), sensitive I/O (M04) and
  state move/import/remove (M08) are all excluded (`brief.md:32`). **[Verified]**
- **AWS only. [Verified]** GCP and Azure appear only in M09 as setup/read-only checks
  (`ADR-003`). **[Verified]**

## 11. Knowledge check (trainer-facing)

These check the *trainer's* readiness to run the stage. They are not the learner's
design questions. The learner-facing knowledge check lives in the coaching package
(`coaching §5`) with answers deliberately not supplied.

1. Which of the six research prompts must you never answer, and how do you tell when a
   learner has reached the answer themselves? **[Learner-owned]**
2. What are the seven DoD items, and which two require a **cloud-side** check rather than
   Terraform's own output?
3. Which folder's state is destroyed at clean-up, and which resource is kept?
4. Why is `init -migrate-state` the highest-risk step, and what is the guard?
5. What must the sandbox role be able to do for locking, and what is the correct response
   if it cannot?
6. What is the acceptance gate, and who signs off?
7. What must be re-verified once a first learner build exists?

## 12. Cleanup instructions

- **Stage clean-up gate (`README.md:111`, `brief.md:52`):** destroy everything **except
  the bucket**; no stored credential, no committed state file, nothing else left
  running. **[Verified]**
- Run `destroy` in the **first** config only (the parameter). Destroying to the bucket
  folder is the exception and must **not** happen (except at capstone clean-up).
  **[Verified]**
- Confirm cloud-side that the bucket alone remains and the `aws_ssm_parameter` is gone
  (DoD-06). **[Verified]**
- Re-login is not part of cleanup; but expired sessions are expected and should be
  re-established before the next stage. **[Expected]**

## 13. Further learning

- `modules/m02-managing-terraform-state/brief.md` — objective, scope/research prompts,
  constraints, deliverable, lab, DoD, best practices.
- `docs/handovers/m02-managing-terraform-state-handover.md` — trainer requirements.
- `docs/handovers/m02-devops-mentor-coaching-package.md` — coaching plan, exercises,
  evidence table, troubleshooting map.
- `README.md:80-91` (rules) and `README.md:93-116` (rubric).
- ADR-002 (CLI vs OpenTofu), ADR-003 (AWS primary), ADR-005 (sandboxes/short-lived
  credentials), ADR-006 (S3 remote state, native locking), ADR-010 (`versions.env`),
  ADR-011 (cost and destroy controls).
- `knowledge/proposed/m02-common-errors.md` and `knowledge/proposed/m02-reuse-note.md`.

## Source references

- `modules/m02-managing-terraform-state/{brief.md,tasks.md,write-up-template.md}`
- `docs/handovers/m02-managing-terraform-state-handover.md`
- `docs/handovers/m02-devops-mentor-coaching-package.md`
- `versions.env`; `README.md:80-116`
- `docs/arch-docs/adrs/ADR-002`, `ADR-003`, `ADR-005`, `ADR-006`, `ADR-010`, `ADR-011`
- `.opencode/agents/{devops-mentor.md,technical-reviewer.md}`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
