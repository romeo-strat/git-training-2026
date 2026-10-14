# M02 — Reuse Note: What Generalises vs What Is Course-Specific

> **STATUS: DRAFT — no learner build.** A curation aid for turning M02 material into
> reusable curriculum assets and for adapting it to other stages. **Trainer/maintainer
> facing. Not trainee-facing.**
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.

## Why this note exists

The M02 handover, coaching package and runbook mix two kinds of content: **universal
Terraform and state-management practice** that any stage or team can reuse, and
**course-specific decisions** that only make sense inside this curriculum (or this
cohort). Separating them is what makes the material safe to reuse elsewhere
(`knowledge-curator.md` "Separate universal principles from project-specific
implementation"). **[Verified]**

## Generalises beyond M02

| Principle | Where it comes from | Reuse |
| --- | --- | --- |
| **Remote state with native locking; no DynamoDB** | `brief.md:27`; ADR-006 | Any Terraform project past single-user scale. **[Verified]** |
| **Migrate state, never recreate** | `brief.md:29,47`; `coaching §2 E13` | Any backend migration; any state-reparenting work. **[Verified]** |
| **Prove cloud-side, not from configuration** | DoD-04, DoD-06; `coaching §3` | Any protection/destruction verification. **[Verified]** |
| **Read-only state inspection only** | `brief.md:26` | Any troubleshooting that touches state. **[Verified]** |
| **State is sensitive; never commit it** | `brief.md:25`; DoD-06 | Any repo-managed infrastructure. **[Verified]** |
| **Reconcile version-specific claims against the pinned release notes** | `brief.md:28` | Any feature whose GA point matters. **[Verified]** |
| **Bootstrap the "thing that stores your state" separately, then keep it** | `brief.md:29`; `coaching §2 E11` | Any self-hosting/backend bootstrap (chicken-and-egg). **[Verified]** |
| **Least-privilege bucket access scoped to what Terraform needs** | `brief.md:30`; research prompt 4 | Any remote-backend IAM design. **[Learner-owned]** |
| **Cost-before-create; retain only what later stages need** | `brief.md:22,24`; ADR-011 | Any cost-aware lab or shared-infra stage. **[Verified]** |
| **Evidence over claim** (paste output, redact secrets) | `README.md:99,103`; DoD-01…07 | Any write-up/review. **[Verified]** |

## Is course- or project-specific

| Item | Why it does not generalise |
| --- | --- |
| **"The bucket is kept when everything else is destroyed"** | This course's deliberate exception (`brief.md:22`), tied to later stages reusing the bucket (`M05`, `M07`, `M08`) and capstone cleanup (ADR-006, ADR-011). **[Verified]** |
| Exact pins: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0` | Point-in-time, overwritten by handled version-bump MRs (`ADR-010`). Reuse the *idea* of `versions.env`, never the numbers. **[Verified]** |
| Resource choices `aws_ssm_parameter` / `aws_s3_bucket` and AWS-only `aws s3api` checks | AWS-primary decision (`ADR-003`); the checks map to other clouds only loosely. **[Verified]** |
| IAM Identity Center via AWS CLI | Course auth choice (`ADR-005`); other orgs differ. **[Verified]** |
| **The six research prompts** (`brief.md:13-18`) | Learner-owned; must not be answered, in M02 or any derived asset (some are partly conceded by the brief's own DoD — see runbook §7). **[Verified]** |
| DoD-01…07 wording; rubric totals (≥70 pass, ≥90 library candidate) | This repository's acceptance model (`README.md:97-114`). **[Verified]** |
| Terraform CLI over OpenTofu | Program decision (`ADR-002`). **[Verified]** |

## Content worth promoting into the curriculum library

1. **The state-migration evidence pattern.** `init -migrate-state` output + identical
   `state list` before/after + a **No changes** plan + an independent bucket listing
   (`coaching §3`, DoD-03). A reusable "a migration is only done when nothing changed"
   checklist. **[Recommendation]**
2. **The cloud-side protection trio.** `get-bucket-versioning` /
   `get-bucket-encryption` / `get-public-access-block` (DoD-04) — generalises to any
   "prove the protection from the platform, not the code" lesson. **[Recommendation]**
3. **The two-terminal locking demonstration** (E17, DoD-05): hold one operation, refuse
   the second, paste the verbatim error. Generalises to any concurrency/serialisation
   lesson; keep *what it prevents* learner-owned. **[Recommendation]**
4. **The backend-bootstrap chicken-and-egg exercise** (E11/E12, research prompt 4):
   strong candidate for a standalone design discussion across stages. Keep the access
   answer learner-owned. **[Recommendation]**
5. **The DoD evidence table pattern** (DoD → run → paste/capture → acceptance → caveat,
   `coaching §3`). Reusable across stages. **[Recommendation]**
6. **The troubleshooting map structure** (symptom → cause → diagnostic → smallest fix →
   escalate) with sensitive rows kept process-only. See `m02-common-errors.md`.
   **[Recommendation]**

## Adaptation checklist (for another stage or another course)

- [ ] Replace `versions.env` numbers with the target's own pin source; never hard-code
      a version into prose.
- [ ] Replace `aws_ssm_parameter`/`aws_s3_bucket` and `aws s3api` commands with the
      target's resource and cloud.
- [ ] Decide which items are learner research prompts and keep them unanswered — re-run
      the leak check against the target brief (watch for answers conceded by the brief's
      own DoD).
- [ ] Re-derive DoD items from the target brief rather than reusing M02's.
- [ ] Re-tag every claim: nothing runtime is verified until a build exists.
- [ ] Decide the target's retention policy (what is kept vs destroyed) and its cost rule
      before reusing the runbook.

## Known limitations of the M02 material

- No learner build and no sandbox: all runtime behaviour is **[Expected]**, not verified.
- **M01 is not yet accepted** (and M01's Technical Reviewer report is absent in-repo), so
  M02's blocking prerequisite cannot be confirmed. See runbook §2/§7.
- The coaching package's "ACCEPTED" review status has no report artifact in-repo
  (runbook §7).
- Trainer decisions still open (`brief.md:70-73`): whether the sandbox role can create
  **and** delete the lock object; expected write-up length/depth.
- The brief itself concedes parts of research prompts 5 and 6 (and the objective overlaps
  prompts 2–3); a brief reword + regeneration of `tasks.md`/`write-up-template.md` is the
  correct fix (`handover §7`).
- Whether handovers/coaching packages should be committed or kept local is still
  undecided (`retros/2026-10-14 §Still open`).

## Source references

- `modules/m02-managing-terraform-state/brief.md`
- `docs/handovers/m02-managing-terraform-state-handover.md`,
  `m02-devops-mentor-coaching-package.md`
- `README.md:80-116`; `versions.env`
- `docs/arch-docs/adrs/ADR-002`, `ADR-003`, `ADR-005`, `ADR-006`, `ADR-010`, `ADR-011`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
