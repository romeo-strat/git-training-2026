# M03 — Reuse Note: What Generalises vs What Is Course-Specific

> **STATUS: DRAFT — no learner build.** A curation aid for turning M03 material into
> reusable curriculum assets and for adapting it to other stages. **Trainer/maintainer
> facing. Not trainee-facing.**
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.

## Why this note exists

The M03 handover, coaching package and runbook mix two kinds of content: **universal
Terraform practice** that any stage or team can reuse (dependency inference, repetition,
data sources, a basic VPC pattern), and **course-specific decisions** that only make sense
inside this curriculum (or this cohort). Separating them is what makes the material safe
to reuse elsewhere (`knowledge-curator.md` "Separate universal principles from
project-specific implementation"). **[Verified]**

## Generalises beyond M03

| Principle | Where it comes from | Reuse |
| --- | --- | --- |
| **Reading `terraform graph` to find dependency edges (method only)** | `brief.md:13`; `coaching E1-E2` | Any `terraform graph` walkthrough; *how ordering is inferred stays learner-owned*. **[Verified]** |
| **Implicit vs explicit dependencies: adding exactly one `depends_on` (*when* it is required stays learner-owned)** | `brief.md:14,41`; `coaching E4` | Any multi-resource ordering problem. **[Verified]** |
| **Repeating a resource with one of two mechanisms** (*which, its trade-offs and its set-change effect stay* **[Learner-owned]**, prompt 3) | `brief.md:15`; `coaching E6` | Any repeated resource. **[Learner-owned]** |
| **Data sources read existing state instead of hard-coding it** | `brief.md:16`; `coaching E8` | Any config needing an account/region/AZ/AMI value. **[Verified]** |
| **The public-tier network pattern** (*what its routing needs stays* **[Learner-owned]**, prompt 5) | `brief.md:17,30`; `coaching E10` | Any AWS public-tier network build. **[Learner-owned]** |
| **Prove destruction cloud-side, not from Terraform's output** | DoD-06; `coaching E14` | Any destroy/clean-up verification. **[Verified]** |
| **Cost-before-create; keep resources small and destroy at stage end** | `brief.md:23`; `README.md:88`; ADR-011 | Any cost-aware lab or shared-infra stage. **[Verified]** |
| **Local state is never committed; fmt and validate before "done"** | `brief.md:24`; `README.md:90` | Any repo-managed infrastructure. **[Verified]** |
| **Evidence over claim** (paste output, redact secrets) | `README.md:99,103`; DoD-01…07 | Any write-up/review. **[Verified]** |
| **Reconcile version-specific claims against the pinned release notes** | `versions.env`; ADR-010 | Any feature whose behaviour depends on a version. **[Verified]** |

## Is course- or project-specific

| Item | Why it does not generalise |
| --- | --- |
| Exact pins: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0` | Point-in-time, overwritten by handled version-bump MRs (`ADR-010`). Reuse the *idea* of `versions.env`, never the numbers. **[Verified]** |
| **State is local in this stage** | Course sequencing choice (`brief.md:24`; `handover §4`) — M02 owns remote state; other projects decide their own backend. **[Verified]** |
| **No NAT gateway anywhere in this stage** | Course cost rule (`brief.md:22`; ADR-011); the capstone may create exactly one. Not a universal networking rule. **[Verified]** |
| **No compute instances, security groups or IAM roles** | This stage's deliberate scope boundary (`brief.md:22`). **[Verified]** |
| Resource choices (`aws_vpc`, `aws_subnet`, `aws_internet_gateway`, `aws_route_table`) and AWS-only `aws ec2 describe-*` checks | AWS-primary decision (`ADR-003`); the checks map to other clouds only loosely. **[Verified]** |
| IAM Identity Center via AWS CLI | Course auth choice (`ADR-005`); other orgs differ. **[Verified]** |
| **The five research prompts** (`brief.md:13-17`) | Learner-owned; must not be answered, in M03 or any derived asset. **[Verified]** |
| **The brief-level leak (open trainer decision)** | The brief pre-empts parts of prompts 1, 2, 3 and 5 (`brief.md:13,41,61,40`); prompt 4 is not pre-answered. A brief reword + regeneration of `tasks.md`/`write-up-template.md` is the correct fix (`handover §7`). **[Verified]** |
| DoD-01…07 wording; rubric totals (≥70 pass, ≥90 library candidate) | This repository's acceptance model (`README.md:97-114`). **[Verified]** |
| Terraform CLI over OpenTofu | Program decision (`ADR-002`). **[Verified]** |
| Sandbox-compatible tooling only (no Organizations/SCPs, billing APIs, policy-as-code) | Program sandbox model (`ADR-015`). **[Verified]** |
| Local check scripts built on native Terraform commands | Program verification model (`ADR-009`). **[Verified]** |

## Content worth promoting into the curriculum library

1. **The dependency-graph reading exercise.** `terraform graph` output → identify nodes and
   edges → name one dependency pair and the expression that connects them
   (`coaching E1–E2`, DoD-05). A reusable "how to read what Terraform already knows" lab.
   Keep *how ordering is inferred* learner-owned. **[Recommendation]**
2. **The implicit-vs-explicit dependency lesson.** Add exactly one `depends_on`, capture
   plan/graph before and after, compare (`coaching E4`, prompt 2). Generalises to any
   ordering lesson; keep *when it is required* learner-owned. **[Recommendation]**
3. **The repetition-mechanism lesson.** Repeat one block, record which mechanism and the
   reasoning, then observe the set-change effect (`coaching E6`, prompt 3). Strong
   standalone candidate; the mechanisms, the preference and the set-change effect all stay
   **[Learner-owned]**. **[Recommendation]**
4. **The data-source vs resource lesson.** Read a value instead of hard-coding it, then
   observe it across plan/state/destroy (`coaching E8`, prompt 4). Keep the
   destroy distinction learner-owned. **[Recommendation]**
5. **The public-tier network pattern.** One VPC with public and private subnets across ≥2
   AZs and the routing the public tier needs, no NAT (`coaching E10`). *The routing
   components and how they appear in the plan stay* **[Learner-owned]** (research prompt 5);
   work from the brief's lab step 3. Reusable as a "smallest public network" reference.
   **[Recommendation]**
6. **The cloud-side destroy-evidence pattern.** `describe-vpcs`/`-subnets`/
   `-internet-gateways`/`-route-tables` after `destroy` (`coaching E14`, DoD-06).
   Generalises to any "nothing left behind" proof. **[Recommendation]**
7. **The troubleshooting map structure** (symptom → cause → diagnostic → smallest fix →
   escalate) with sensitive rows kept process-only. See `m03-common-errors.md`.
   **[Recommendation]**

## Adaptation checklist (for another stage or another course)

- [ ] Replace `versions.env` numbers with the target's own pin source; never hard-code a
      version into prose.
- [ ] Replace the AWS network resources and `aws ec2 describe-*` commands with the target's
      resource and cloud.
- [ ] Decide which items are learner research prompts and keep them unanswered — re-run the
      leak check against the target brief (watch for answers conceded by the brief itself,
      as M03's brief does for prompts 1, 2, 3 and 5).
- [ ] Re-derive DoD items from the target brief rather than reusing M03's.
- [ ] Re-tag every claim: nothing runtime is verified until a build exists.
- [ ] Decide the target's state/backend rule (M03 keeps state local) and its cost rule
      (M03 forbids NAT) before reusing the runbook.

## Known limitations of the M03 material

- No learner build and no sandbox: all runtime behaviour is **[Expected]**, not verified.
- **M01 is not yet accepted** (and M01's Technical Reviewer report is absent in-repo), so
  M03's blocking prerequisite cannot be confirmed. See runbook §2/§7.
- **Sandbox VPC capability is an unverified pre-flight** (`brief.md:66`): whether the role
  can create **and** delete a VPC, subnets and routing is not confirmed. See runbook §2.
- The coaching package's "ACCEPT" review status has no report artifact in-repo: the first
  pass was NEEDS_REVISION with seven findings (all resolved) and re-review was ACCEPT, but
  the report was not committed (runbook §7).
- **The brief pre-empts parts of research prompts 1, 2, 3 and 5** (`brief.md:13,40,41,61`).
  Prompt 4 is not pre-answered. Recorded as an open trainer decision; the mentor does not
  name the mechanism either way (`handover §7`; `coaching §6`).
- Trainer decisions still open (`brief.md:64-67`): the sandbox VPC capability, and the
  expected write-up length/depth.
- Whether handovers/coaching packages should be committed or kept local is still undecided
  (`retros/2026-10-14 §Still open`).

## Source references

- `modules/m03-managing-resources-with-network-provisioning/brief.md`
- `docs/handovers/m03-managing-resources-with-network-provisioning-handover.md`,
  `m03-devops-mentor-coaching-package.md`
- `README.md:80-116`; `versions.env`
- `docs/arch-docs/adrs/ADR-002`, `ADR-003`, `ADR-005`, `ADR-009`, `ADR-010`, `ADR-011`,
  `ADR-015`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
