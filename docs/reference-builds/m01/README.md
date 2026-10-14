# M01 — reference build (trainer-only model answer)

> **TRAINER-ONLY. NOT TRAINEE-FACING. NOT A LEARNER BUILD.**
>
> This is a **model answer** the EM/curator wrote to stand in for the artefact a real
> learner would produce for M01. It is a **reference solution**: it deliberately answers
> the stage's research prompts, which is exactly why it must never reach a trainee. The
> playbook is explicit: *"Keep any reference solution you have out of the trainee-facing
> files… the solution stays with the trainers"* (`docs/templates/build-to-teach-playbook.md:149`).
>
> **Do not copy any of this into `modules/`**, a `write-up.md` under `modules/`, a
> coaching package, or anything a trainee can see.

## What this is — and what it is not

| | |
| --- | --- |
| Is | A worked model of M01's deliverable: `versions.tf`, `providers.tf`, `main.tf`, a sensible `.gitignore`, and a filled `write-up.md` |
| Is **not** | A real learner build. No learner wrote it, nothing was run against an AWS sandbox here, and **none of the runtime evidence is captured or verified** |
| Status | **Draft reference — unverified.** It cannot be "accepted" as a stage until a real run captures the evidence |

## Why it is unverified

The environment that produced this had **no usable AWS session** (the caller identity
returned `ExpiredToken`) and **no version manager** (`tfenv`/`asdf` absent; only a
Homebrew `terraform` that is not even the pinned 1.16.5). So the following are
**not captured and must not be invented**:

- DoD-01 version-switch + caller identity — no version manager, no live session.
- DoD-03/05/06 real `init`/`plan`/`apply`/`destroy` and cloud-side checks — no sandbox.
- `terraform validate` (part of DoD-04) — needs `init`/provider download, skipped offline.
  **`terraform fmt -check -diff` was run offline and passed** (exit 0, no diff — all
  `.tf` files correctly formatted); that is the one piece of real, captured evidence.

The code is written to be `fmt`-clean (verified) and to validate; the validate claim is
**[Unverified]** until someone runs it.

## Files

| File | Mirrors | Notes |
| --- | --- | --- |
| `versions.tf` | The learner's provider requirements | Constraint derived from the `versions.env` pins (ADR-010); exact installed pin is not hard-coded |
| `providers.tf` | The learner's AWS provider + `default_tags` | Region must be set to the sandbox region |
| `main.tf` | The learner's one `aws_ssm_parameter` | The one-attribute change for the in-place-update evidence is `value` |
| `.gitignore` | Hygiene the rules require | Keeps state and `.terraform/` out of version control |
| `write-up.md` | The learner's `write-up.md` | Model prose + the commands for evidence; evidence slots **not captured** |

## How to use it

1. Optionally validate the code in a sandbox: `terraform init && terraform fmt -check && terraform validate`.
2. To exercise the full review/promotion pipeline (R&D), a trainer can run it end-to-end
   in a sandbox, fill the evidence slots in `write-up.md`, and then score it against the
   rubric (`README.md:97-114`).
3. Never ship these files to trainees, and never treat this directory as a stage build.

## Governance reminders

- A real learner's code lives in **their own GitLab repository**, not here; only the
  write-up copy sits with the stage.
- "Accepted" is an EM/trainer action scored against the rubric — this reference gives
  the EM something to *score*, it does not itself constitute acceptance.

## Review later

- **Deferred 2026-10-14.** This reference build is accepted *for now* without the AWS
  parts. Before it can serve as a scored stand-in, **revise and re-review it**: run it in
  a real sandbox, capture the pending evidence (DoD-01, DoD-03, DoD-05, DoD-06, DoD-07,
  and the `validate` half of DoD-04), and correct anything the run disproves.
- Tracked in `knowledge/retros/2026-10-14-handover-to-devops-mentor.md` (Still open).

