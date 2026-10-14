# M01 — Reuse Note: What Generalises vs What Is Course-Specific

> **STATUS: DRAFT — no learner build.** A curation aid for turning M01 material into
> reusable curriculum assets and for adapting it to other stages. **Trainer/maintainer
> facing. Not trainee-facing.**
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.

## Why this note exists

The M01 handover, coaching package and this runbook mix two kinds of content:
**universal Terraform practice** that any stage or any team can reuse, and
**course-specific decisions** that only make sense inside this curriculum (or this
cohort). Separating them is what makes the material safe to reuse elsewhere
(`knowledge-curator.md` "Separate universal principles from project-specific
implementation"). **[Verified]**

## Generalises beyond M01

| Principle | Where it comes from | Reuse |
| --- | --- | --- |
| **Read the plan before every apply; never approve a change you cannot explain** | `README.md:88`; `brief.md:30`; `coaching §2 E11` | Any Terraform stage; any team review process. **[Verified]** |
| **No static credentials — short-lived sign-in only** | `README.md:86`; `ADR-005` | Any cloud stage. **[Verified]** |
| **Pin versions and commit the lock file** | `README.md:90`; `ADR-010` | Any stage; any repo. **[Verified]** |
| **`fmt` + `validate` must pass before "done"** | `README.md:90`; DoD-04 | Any stage. **[Verified]** |
| **Never edit state by hand; refactor declaratively** | `README.md:91` | Any stage, especially M02/M08. **[Verified]** |
| **Verify from the cloud side, not just Terraform's output** | DoD-06; `coaching §3` | Any destroy/clean-up verification. **[Verified]** |
| **Destroy at the end of every stage; keep resources cheap** | `README.md:87-88` | Any cost-aware lab. **[Verified]** |
| **Evidence over claim** (paste the output, redact secrets) | `README.md:99,103`; DoD-01…07 | Any write-up/review. **[Verified]** |
| **Diagnose in order: exact error → one hypothesis → smallest diagnostic → fix** | `devops-mentor.md:108-119` | Any troubleshooting guide. **[Verified]** |
| **Compartmentalise files by concern (versions / providers / resources)** | `brief.md:67` | Most Terraform configurations. **[Recommendation]** |

## Is course- or project-specific

| Item | Why it does not generalise |
| --- | --- |
| Exact pins: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0` | Point-in-time, overwritten by handled version-bump MRs (`ADR-010`). Reuse the *idea* of `versions.env`, never the numbers. **[Verified]** |
| Resource choice `aws_ssm_parameter` | Chosen purely to keep AWS architecture out of the stage. **[Verified]** |
| Local state in M01 | Deliberate sequencing; M02 moves to an S3 backend (`brief.md:32`). **[Verified]** |
| "Must serve macOS **and** Windows" | This course's constraint (`brief.md:22`). **[Verified]** |
| IAM Identity Center via AWS CLI | Course auth choice (`ADR-005`); other orgs differ. **[Verified]** |
| The five research prompts (`brief.md:13-17`) | Learner-owned; must not be answered, in M01 or any derived asset. **[Verified]** |
| DoD-01…07 wording; rubric totals (≥70 pass, ≥90 library candidate) | This repository's acceptance model (`README.md:97-114`). **[Verified]** |
| Terraform CLI over OpenTofu | Program decision (`ADR-002`); the OpenTofu sidebar is best-effort and not CI-verified. **[Verified]** |

## Content worth promoting into the curriculum library

1. **The plan-review note as a reusable artefact.** Classification of every change as
   create / in-place update / replacement, citing the plan's own annotation
   (`brief.md:60`; `coaching §2 E10`). Strong candidate for a course-wide template.
   **[Recommendation]**
2. **The DoD evidence table pattern.** DoD → run → paste/capture → acceptance → caveat
   (`coaching §3`). Reusable across stages. **[Recommendation]**
3. **The static-key scan exercise** (DoD-02): a real scan plus "what it can miss" —
   reusable security habit, but keep the *answer* learner-owned. **[Recommendation]**
4. **The troubleshooting map structure** (symptom → cause → diagnostic → smallest fix →
   escalate), with sensitive rows kept process-only. See
   `m01-common-errors.md`. **[Recommendation]**
5. **The workstation-proof pair** (version output after a switch + caller identity) as
   the first evidence a learner ever captures (`coaching §2 E1-E2`).
   **[Recommendation]**

## Adaptation checklist (for another stage or another course)

- [ ] Replace `versions.env` numbers with the target's own pin source; never hard-code
      a version into prose.
- [ ] Replace `aws_ssm_parameter` and AWS-specific commands with the target's resource
      and cloud.
- [ ] Decide which items are learner research prompts and keep them unanswered —
      re-run the leak check against the target brief.
- [ ] Re-derive DoD items from the target brief rather than reusing M01's.
- [ ] Re-tag every claim: nothing runtime is verified until a build exists.
- [ ] Confirm the target's clean-up gate and cost rule before reusing the runbook.

## Known limitations of the M01 material

- No learner build and no sandbox: all runtime behaviour is **[Expected]**, not verified.
- The coaching package's "ACCEPTED" review status has no report artifact in-repo
  (see runbook §7).
- Trainer decisions still open (`brief.md:74-79`): OS-coverage method, redaction fields,
  whether the sandbox permits `aws_ssm_parameter`, expected write-up depth.
- Whether handovers/coaching packages should be committed or kept local is still
  undecided (`retros/2026-10-14 §Still open`).

## Source references

- `modules/m01-getting-started-with-terraform/brief.md`
- `docs/handovers/m01-getting-started-with-terraform-handover.md`,
  `m01-devops-mentor-coaching-package.md`
- `README.md:80-116`; `versions.env`
- `docs/arch-docs/adrs/ADR-002`, `ADR-005`, `ADR-010`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
