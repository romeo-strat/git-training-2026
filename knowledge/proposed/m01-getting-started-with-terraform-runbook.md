# M01 — Getting Started with Terraform — Trainer Runbook & Lesson

> **STATUS: DRAFT — no learner build, no AWS sandbox.** This content was curated from
> the M01 handover, the reviewed coaching package, the stage brief and the course rules.
> No learner has built M01 yet and there is no sandbox to run against, so **nothing
> runtime has been verified**. Every claim below is tagged. See [Status vocabulary](#status-vocabulary).
>
> **Library mapping note.** This repository's learning area is `knowledge/` (with
> `retros/`, `patterns/`, `rules/`, `prompts/`), not the generic `library/` named in the
> Knowledge Curator role file. This draft's spec location `library/proposed/` maps to
> **`knowledge/proposed/`** here.
>
> **Audience:** trainers, DevOps mentors and curriculum maintainers who run M01 and
> verify it. **Not trainee-facing.** Do not copy into `modules/` or any learner-visible
> artifact (trainee-view rule, `docs/templates/build-to-teach-playbook.md`).

| | |
| --- | --- |
| Source stage | `M01` — `modules/m01-getting-started-with-terraform` |
| Source tasks | `TASK-M01-B01…B07`, `V01…V07`, `W01…W10` |
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
| **[Learner-owned]** | A sensitive research prompt (`brief.md:13-17`). The learner resolves it; **do not supply the answer.** See [Concepts explained (trainer level)](#5-concepts-explained-trainer-level). |

## 1. Intended audience and learning objectives

**Audience:** a trainer or mentor delivering M01 for the first time, a curriculum
maintainer adapting M01, or a reviewer checking that a learner's evidence is real.

By the end of this runbook the reader can:

1. Describe what the M01 stage asks the learner to build and why the stage is
   front-loaded on environment and mental model rather than AWS architecture.
   **[Verified]**
2. Coach the five lifecycle steps (workstation → `versions.tf` → `providers.tf` →
   `main.tf` → apply/destroy) without implementing the stage for the learner, and
   without leaking any of the five research-prompt answers. **[Verified]**
3. Verify each of DoD-01…DoD-07 against real, pasted evidence rather than a claim.
   **[Verified]**
4. Recognise the failure modes a learner is most likely to hit and the diagnostic
   steps that separate a credential problem from a configuration problem. **[Expected]**
5. Know what must be re-verified once a real build exists. **[Unverified]**

## 2. Prerequisites

- The trainer has read the stage `brief.md` top to bottom and the course-wide
  "Rules for every stage" (`README.md:80-91`). **[Verified]**
- A pre-made, short-lived AWS sandbox reachable via IAM Identity Center is available
  **before** the stage — a hard dependency on the sandbox owner (`ADR-005`). **[Verified]**
- Toolchain available to the learner: Terraform CLI via a version manager
  (`tfenv`/`asdf`), AWS CLI, VS Code + HashiCorp Terraform extension, Git, `jq`;
  lab scripts are POSIX shell. **[Verified]**
- `versions.env` exists at the repo root and is the single source of truth for pins
  (ADR-010). Current pins: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0`,
  `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0`. **[Verified]**
- The learner must **not** be handed the answers to the five research prompts; the
  trainer never states the conclusion (`brief.md:13-17`; leak rule
  `docs/templates/trainee-task-planner.md:44-56`). **[Verified]**

## 3. Problem statement — why this stage exists

M01 is the course entry point. Its job is to give the learner a working environment
and a correct mental model **before** any real infrastructure, using one deliberately
tiny AWS resource (`aws_ssm_parameter`) so the focus stays on the Terraform workflow
rather than AWS design. **[Verified]** (`brief.md:5-7,29,63`)

Deliverable (`brief.md:34-36`): a configuration of `versions.tf`, `providers.tf` and
`main.tf` managing one simple AWS resource, taken through create, in-place update and
destroy from a workstation the learner set up themselves, with a written plan-review
note. **[Verified]**

**Design intent to preserve when adapting:** the stage is front-loaded on environment
and mental model; a learner skipping the pre-resource steps (workstation, `versions.tf`)
undermines it. **[Verified]** (`handover §7`)

## 4. Workflow overview

```
  Step 0  Setup        read brief + rules · copy write-up template · confirm access   (no code)
  Step 1  Workstation  install CLI via version manager · VS Code · AWS SSO sign-in     (no code)
  Step 2  versions.tf  required_providers block · terraform init → .terraform, lock   (dependencies)
  Step 3  providers.tf AWS provider + default_tags · fmt + validate                   (configuration)
  Step 4  main.tf      one resource · terraform plan · read the plan                   (resources/planning)
  Step 5  apply/destroy apply → change one attribute → plan → apply → destroy          (lifecycle)
  Step 6  Assembly     three files + plan-review note · write-up · Status → "In review"
```

Lifecycle exercised end to end: **init → plan → apply → update → destroy**. **[Verified]**
(`brief.md:40-52`)

File-per-concern layout is deliberate: `versions.tf` (provider requirements),
`providers.tf` (provider config and `default_tags`), `main.tf` (resources). A reviewer
should be able to see where each concern lives. **[Verified]** (`brief.md:67`; best
practices list `brief.md:64-72`)

## 5. Concepts explained (trainer level)

Keep each of these usable for coaching **without** answering a learner research prompt.

- **Compartmentalised files. [Verified]** Splitting version requirements, provider
  configuration and resources into separate files is a stated stage best practice and
  a rubric expectation, not a research prompt. The trainer can explain this freely.
- **The plan as the review artefact. [Verified]** "Read the plan before every apply"
  is a course rule (`README.md:88` and `brief.md:30,71-72`). Treat plan review as a
  habit to instil, not a one-off step. The learner's plan-review note is a deliverable
  (`TASK-M01-B07`).
- **No static credentials. [Verified]** AWS sign-in is IAM Identity Center through the
  AWS CLI; no IAM user access keys and no long-lived credentials of any kind
  (`ADR-005`, `README.md:86`). Interactive logins expire, so re-login and the symptoms
  of expiry are in scope (`ADR-005` consequences; `handover §6`).
- **Pin everything; commit the lock file. [Verified]** A course rule for every stage
  (`README.md:90`) and the theme of `versions.tf`/`init`.
- **Local state in M01. [Verified]** State is local in this stage and never committed
  (`brief.md:30`). State handling is M02's theme, not M01's.
- **Cost awareness. [Verified]** The learner looks up what the resource bills before
  applying and destroys at the end. Their own estimate is the evidence (`README.md:88`,
  `brief.md:31`).

**Learner-owned concept areas — [Learner-owned], do not answer:**
declarative vs imperative / desired state vs scripting; what `init` downloads and where;
constraint vs lock-file content and constraint tightness; why tags sit at the provider
level; which resource attributes force replacement; credential resolution order; the
cloud-side check that proves destruction; how Windows and macOS differ; what a
static-key scan covers and misses. Covering these in a coached lesson would leak the
stage's design answers. Coach the *method* (where to look, what to compare, what to
record), never the conclusion. **[Verified]**

## 6. Implementation walkthrough — how to coach each step

The mentor follows the teaching sequence in `.opencode/agents/devops-mentor.md:14-26`
(problem → concept → outcome/constraints → focused task → hints → implement/troubleshoot
→ verify → trade-offs → document) and **does not implement the stage for the learner**.
**[Verified]** Every phase ends with evidence captured, not with "done". **[Verified]**

| Step | Learner builds | Trainer's job | Evidence to capture |
| --- | --- | --- | --- |
| 0 Setup | Reads brief + rules, copies `write-up-template.md` → `write-up.md` | Answer the four "Still open / ask your trainer" items (`brief.md:74-79`) | Not applicable |
| 1 Workstation | Installs CLI via version manager, AWS CLI, VS Code ext; signs in via SSO | Confirm toolchain and the **pin read from `versions.env`**; do not name the version for them | Version output after a switch between two versions; caller-identity output (redacted) **[Expected]** |
| 2 `versions.tf` | Writes `required_providers`; runs `init`; commits the lock file | Read the `init` error with them if the provider is undeclared | `.terraform` + `.terraform.lock.hcl` exist; lock committed; their own words on what it recorded **[Expected]** |
| 3 `providers.tf` | AWS provider + `default_tags`; `fmt` + `validate` | Re-run `validate` after any `fmt` rewrite | Pasted `fmt`/`validate` output, no errors **[Expected]** |
| 4 `main.tf` | One resource; `terraform plan`; starts the plan-review note | Insist the plan is read before any apply | Pasted plan showing default tags; every change classified **[Expected]** |
| 5 Apply/destroy | `apply`; change **one** attribute; `plan`; `apply`; `destroy` | Keep the change to one attribute so the plan is readable | In-place-update plan; cloud-side query proving absence **[Expected]** |
| 6 Assembly | Three files + plan-review note; write-up; `Status → "In review"` | Check the header links the GitLab repo/branch | Signed-off DoD evidence; clean-up gate **[Expected]** |

The seven build tasks are `TASK-M01-B01…B07` (`tasks.md:13-21`); the coaching package
maps its 14 exercises (E1–E14) onto these phases (`coaching §1-2`). **[Verified]**

## 7. Verification steps and expected outcomes (DoD-01…07)

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable
works, every DoD item met and evidenced, and no stored credential, no committed state
file and nothing left running. **[Verified]** A stage scoring ≥ 90 is a content-library
candidate. **[Verified]**

| DoD | What the trainer verifies | Expected evidence | Tag |
| --- | --- | --- | --- |
| DoD-01 | Actual Terraform version from a version manager, switched between two versions; caller identity from the signed-in session | Both version outputs; redacted caller-identity output | **[Expected]** |
| DoD-02 | A real static-key scan across disk and repo, plus what it looked for and what it can miss | Scan command + output; limits noted | **[Expected]** |
| DoD-03 | `init` created `.terraform` + `.terraform.lock.hcl` from the learner's own `versions.tf`; lock committed | Folder/file exist; commit contains the lock; own-words description | **[Expected]** |
| DoD-04 | `fmt` and `validate` pass with no errors on `providers.tf`/`main.tf` | Pasted output (not from memory) | **[Expected]** |
| DoD-05 | Pasted plan shows default tags; plan-review note classifies every change; trainer confirms each classification | Plan + note | **[Expected]** |
| DoD-06 | In-place-update plan before the one-attribute change; nothing left after destroy, confirmed from the cloud side | Pasted plan; cloud-side query | **[Expected]** |
| DoD-07 | Write-up takes a first-timer on macOS or Windows from an empty folder to a destroyed resource unaided | End-to-end run-through; OS-coverage method agreed with trainer | **[Expected]** |

**Evidence reality check.** All DoD evidence above is **[Expected]** only. No learner
build exists, so none of it has been observed. The pinned version `TF_VERSION=1.16.5`
is **[Verified]** in `versions.env`, but that a learner's install produces it is
**[Unverified]**.

**Acceptance gate.** The mentor hands the build + write-up + evidence to the
**Technical Reviewer**; the mentor does not self-approve (`handover §8`;
`.opencode/agents/devops-mentor.md:105-106`). **[Verified]**

**Note on the coaching package's review status.** The task brief states the coaching
package was reviewed and ACCEPTED by the Technical Reviewer with leaks fixed. No
Technical-Reviewer report artifact was found in the repository to independently
confirm this, so treat "ACCEPTED" as **[Unverified]** until the review report is
attached. The package itself describes this as a handoff (`coaching §6`).

## 8. Troubleshooting scenarios

The full diagnostic map is in [`m01-common-errors.md`](m01-common-errors.md). The two
most likely traps in this stage, per the handover, are **replacement surprises** and
**cost surprises**, both mitigated by the plan-review habit and the cost rule
(`handover §7`). **[Verified]**

A short summary of the failure classes:

- **Credential/SSO failures** (`ExpiredToken`, no valid credential sources). Reinforces
  re-login as a taught skill (`ADR-005`). **[Expected]**
- **Dependency/`init` failures** (no matching provider version, checksum mismatch,
  offline registry). Root cause is usually constraint vs lock-file disagreement.
  **[Expected]**
- **Plan surprises** (unexpected replace or destroy). These are **[Learner-owned]**
  (research prompts 4 and 5): the process rule is "never approve a plan with a change
  you cannot explain" — stop and reconcile with the trainer, do not explain the
  mechanism. **[Verified]**
- **State lock left over** from a crashed run. The fix never hand-edits state
  (`README.md:91`). **[Expected]**
- **Cloud-side leftovers** after destroy — "Destroy complete" is not sufficient
  evidence (`coaching §3`, DoD-06). **[Verified]**

## 9. Security considerations

- **No static credentials, ever.** No IAM user access keys and no long-lived
  credentials of any kind; sandbox accounts and short-lived sign-in only
  (`README.md:86`, `ADR-005`). **[Verified]**
- **Static-key scan is required evidence** (DoD-02) — a real scan, not a statement
  that there are none. What the scan covers and misses is **[Learner-owned]**
  (research prompt 1); do not supply it. **[Verified]**
- **Redact caller-identity output** before pasting (account ID/ARN). The exact fields
  to redact are a trainer decision (`brief.md:77`). **[Verified]** — placeholder:
  `<AWS_ACCOUNT_ID>`, `<IAM_ROLE_ARN>`.
- **Local state is sensitive and never committed** (`brief.md:30`); the clean-up gate
  checks `terraform.tfstate` is not committed (`coaching §3`). **[Verified]**
- **Never paste credentials, tokens or key material** in the write-up
  (`write-up-template.md:3`). **[Verified]**
- **Do not disable checksum verification** to work around an `init` error
  (`coaching §4`). **[Recommendation]**

## 10. Alternatives and trade-offs

- **Terraform CLI, not OpenTofu. [Verified]** OpenTofu is an optional M01 sidebar only,
  not graded and not CI-tested (`ADR-002`). Teaching both doubles testing and confuses
  beginners (`ADR-002` context).
- **AWS only in M01. [Verified]** GCP and Azure appear only in M09 as setup/read-only
  checks (`ADR-003`, `README.md:85`). Depth before breadth keeps the workflow focus.
- **One tiny resource. [Verified]** `aws_ssm_parameter` is chosen so AWS architecture
  is not the subject (`brief.md:29,63`).
- **Version manager over a raw install. [Verified]** The brief requires Terraform via
  `tfenv`/`asdf` where one works, and the notes must say where neither does
  (`brief.md:25`). The trade-off is maintenance cost per OS — a **[Learner-owned]**
  discussion (research prompt 1).
- **Local state in M01, remote in M02. [Verified]** Deliberate sequencing so state
  sensitivity is taught in M02, not M01 (`brief.md:32`).

## 11. Knowledge check (trainer-facing)

These check the *trainer's* readiness to run the stage. They are not the learner's
design questions. The learner-facing knowledge check lives in the coaching package
(`coaching §5`) with answers deliberately not supplied.

1. Which of the five research prompts must you never answer, and how do you tell when
   a learner has reached the answer themselves? **[Learner-owned]**
2. What are the seven DoD items, and which one requires a cloud-side check rather than
   Terraform's own output?
3. Which three files make up the deliverable and what concern belongs in each?
4. What is the acceptance gate, and who signs off?
5. What two failure modes does the handover say are the most likely traps, and what
   habits mitigate them?
6. What is the clean-up gate, and what three things must it show?
7. What must be re-verified once a first learner build exists?

## 12. Cleanup instructions

- **Stage clean-up gate (`README.md:111`):** no stored credential, no committed state
  file, nothing left running. **[Verified]**
- Confirm `terraform.tfstate` is **not** committed and the `aws_ssm_parameter` is gone
  from the sandbox, proven from the cloud side (`coaching §3`). **[Verified]**
- Re-login is not part of cleanup; but expired sessions are expected and should be
  re-established before the next stage. **[Expected]**

## 13. Further learning

- `modules/m01-getting-started-with-terraform/brief.md` — objective, scope, constraints,
  deliverable, DoD, best practices.
- `docs/handovers/m01-getting-started-with-terraform-handover.md` — trainer requirements.
- `docs/handovers/m01-devops-mentor-coaching-package.md` — coaching plan, exercises,
  evidence table, troubleshooting map.
- `README.md:80-91` (rules) and `README.md:93-116` (rubric).
- ADR-002 (CLI vs OpenTofu), ADR-003 (AWS primary), ADR-005 (sandboxes/short-lived
  credentials), ADR-010 (`versions.env` as single source of truth).
- `knowledge/proposed/m01-common-errors.md` and `knowledge/proposed/m01-reuse-note.md`.

## Source references

- `modules/m01-getting-started-with-terraform/{brief.md,tasks.md,write-up-template.md}`
- `docs/handovers/m01-getting-started-with-terraform-handover.md`
- `docs/handovers/m01-devops-mentor-coaching-package.md`
- `versions.env`; `README.md:80-116`
- `docs/arch-docs/adrs/ADR-002`, `ADR-003`, `ADR-005`, `ADR-010`
- `.opencode/agents/{devops-mentor.md,technical-reviewer.md}`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
