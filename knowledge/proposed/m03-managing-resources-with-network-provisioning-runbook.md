# M03 — Managing Resources with Network Provisioning — Trainer Runbook & Lesson

> **STATUS: DRAFT — no learner build, no AWS sandbox.** This content was curated from
> the M03 handover, the reviewed coaching package, the stage brief and the course rules.
> No learner has built M03 yet and there is no sandbox to run against, so **nothing
> runtime has been verified**. Every claim below is tagged. See [Status vocabulary](#status-vocabulary).
>
> **Library mapping note.** This repository's learning area is `knowledge/` (with
> `retros/`, `patterns/`, `rules/`, `prompts/`), not the generic `library/` named in the
> Knowledge Curator role file. This draft's spec location `library/proposed/` maps to
> **`knowledge/proposed/`** here.
>
> **Audience:** trainers, DevOps mentors and curriculum maintainers who run M03 and
> verify it. **Not trainee-facing.** Do not copy into `modules/` or any learner-visible
> artifact (trainee-view rule, `docs/templates/build-to-teach-playbook.md`).

| | |
| --- | --- |
| Source stage | `M03` — `modules/m03-managing-resources-with-network-provisioning` |
| Source tasks | `TASK-M03-B01…B06`, `V01…V07`, `W01…W10` |
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

**Audience:** a trainer or mentor delivering M03 for the first time, a curriculum
maintainer adapting M03, or a reviewer checking that a learner's network, graph and
evidence are real.

By the end of this runbook the reader can:

1. Describe what M03 asks the learner to build — one VPC with public and private subnets
   across more than one availability zone and the routing a public tier needs, **with no
   NAT gateway** — and why the deliverable is a small network rather than a diagram.
   **[Verified]**
2. Coach the five scope topics (references/dependency graph → implicit vs explicit
   dependencies → repeating a resource → data sources → VPC/subnets/public-tier routing)
   without implementing the stage for the learner and without leaking any of the five
   research-prompt answers. **[Verified]**
3. Verify each of DoD-01…DoD-07 against real, pasted evidence — plan/JSON addresses,
   the graph, and cloud-side output — rather than a claim or a configuration.
   **[Verified]**
4. Recognise the failure modes a learner is most likely to hit — a plan change after a
   repeated set changes, a `depends_on` that hides a missing reference, a NAT gateway
   slipping into the plan, and a sandbox that cannot create a VPC. **[Expected]**
5. Know what must be re-verified once a real build exists. **[Unverified]**

## 2. Prerequisites

- The trainer has read the stage `brief.md` top to bottom and the course-wide
  "Rules for every stage" (`README.md:80-91`). **[Verified]**
- **M01 must be accepted first** (`brief.md:3`, `tasks.md:11`; `handover §6`). At curation
  time M01 has no learner build, so this is an **open, blocking prerequisite**. M01's
  Technical Reviewer report is also absent from the repository, so M01's acceptance is
  unverifiable in-repo. **[Verified]**
- A pre-made, short-lived AWS sandbox reachable via IAM Identity Center is available
  **before** the stage — a hard dependency on the sandbox owner (`ADR-005`). **[Verified]**
- **Sandbox capability (pre-flight):** the role must be able to create **and delete** a
  VPC, subnets and routing (`brief.md:66`). If it cannot, the learner raises it with the
  trainer **before** building; the mentor does not work around it (`handover §7`).
  **[Verified]**
- `versions.env` exists at the repo root and is the single source of truth for pins
  (ADR-010). Current pins: `TF_VERSION=1.16.5` (≥ 1.11), `AWS_PROVIDER_VERSION=6.68.0`,
  `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0`. **[Verified]**
- Toolchain as M01: Terraform CLI via a version manager (`tfenv`/`asdf`), AWS CLI,
  VS Code + HashiCorp Terraform extension, Git, `jq`; lab scripts are POSIX shell.
  **[Verified]**
- The learner must **not** be handed the answers to the five research prompts; the trainer
  never states the conclusion (`brief.md:13-17`; leak rule
  `docs/templates/trainee-task-planner.md:44-56`). **[Verified]**

## 3. Problem statement — why this stage exists

M03 is where the learner moves from single resources to a small network and learns three
foundational Terraform behaviours: how Terraform works out what depends on what, how to
create several similar resources without writing each one out by hand, and how to read
information that already exists instead of hard-coding it. After M01 (first resources)
and M02 (state), M03 has the learner build a VPC with subnets across availability zones
and public-tier routing, then read the dependency graph Terraform derives, state one
explicit dependency, repeat a resource, and consume a data source. **[Verified]**
(`brief.md:5-7,11`)

Deliverable (`brief.md:28-30`): **a small AWS network configuration — one VPC with public
and private subnets across more than one availability zone and the routing the public
tier needs — with no NAT gateway.** **[Verified]**

**Design intent to preserve when adapting:** the learner builds and inspects **their own**
network, not a worked example (`brief.md:11`). State is **local** in this stage
(`brief.md:24`); anything repeated across availability zones is repeated by one of the two
mechanisms in scope and the learner's notes say which (`brief.md:25`). The evidence is the
plan, the graph and cloud-side output, never the code alone. **[Verified]**

## 4. Workflow overview

```
  Step 0  Setup      read brief + rules · copy write-up template · CONFIRM M01 ACCEPTED + VPC pre-flight  (no code)
  Step 1  Graph      aws_vpc + data "aws_availability_zones" in main.tf · init · terraform graph          (local state)
  Step 2  Explicit   add exactly one depends_on · capture plan + graph before/after                        (local state)
  Step 3  Repeating  repeat one aws_subnet block across zones · note which mechanism, and why              (local state)
  Step 4  Data       consume the data source output where zones are needed, not a literal                  (local state)
  Step 5  Network    public + private subnets across >=2 AZs + the routing the public tier needs (brief lab step 3)  (local state)
  Step 6  Assembly   fmt -check -recursive + validate · plan -out · cost pre-check · apply · console view  (local state)
  Step 7  Verify     destroy · confirm cloud-side · capture redacted evidence                              (local state)
  Step 8  Write-up   fill sections as you build · Status -> "In review" · hand to the trainer              (local state)
```

Lifecycle exercised: **build → inspect the graph → state one explicit dependency →
repeat → read a data source → apply → destroy**. **[Verified]** (`brief.md:34-46`)

State is deliberately **local** throughout M03 — remote backends, native locking,
`.tfvars`, dynamic blocks and modules are all out of scope here (`brief.md:24`; `handover
§4`). A reviewer should be able to tell which resource was repeated and with which
mechanism from the learner's notes. **[Verified]**

## 5. Concepts explained (trainer level)

Keep each of these usable for coaching **without** answering a learner research prompt.

- **Resource references and the dependency graph. [Verified]** `terraform graph` shows
  nodes (the learner's blocks) and the edges between them; coach the learner to read it
  rather than explaining how ordering arises (`brief.md:13`; `coaching E1-E2`). Where the
  learner relied on Terraform to infer ordering is **[Learner-owned]** (prompt 1); do not
  state the inference rule.
- **Implicit vs explicit dependencies. [Verified]** The stage asks for **exactly one**
  `depends_on` (`brief.md:14,41`; `coaching E4`). Which ordering Terraform infers and which
  the learner had to state are **[Learner-owned]** (prompt 2); do not explain the
  distinction in coaching.
- **Repeating a resource. [Verified]** The brief names two mechanisms for repeating a
  resource across zones; the learner picks one and records which and why (`brief.md:15`).
  The course has a preference and the brief's "Best practices" names it — the mentor must
  **not** name or confirm it (`brief.md:61`; `coaching E6`). What happens to existing
  subnets when the set changes is **[Learner-owned]** (prompt 3).
- **Data sources. [Verified]** A data source reads information that already exists (for
  M03, the available zones via `data "aws_availability_zones"`) instead of hard-coding it
  (`brief.md:16`; `coaching E8`). How a data source differs from a resource in what
  Terraform manages, and what happens to each on destroy, is **[Learner-owned]**
  (prompt 4).
- **The public-tier network. [Verified]** One VPC with public and private subnets across
  more than one AZ and the routing the public tier needs — **no NAT gateway**
  (`brief.md:17,30`; `coaching E10`). What that routing needs is **[Learner-owned]**
  (prompt 5); the learner works from the brief's lab step 3.
- **Cost before apply. [Verified]** Some networking resources bill by the hour, so the
  learner looks up what each resource in the plan bills and writes their **own** estimate
  before applying; billing APIs are not used (`brief.md:23`; `README.md:88`; ADR-011).
- **Local state hygiene. [Verified]** State is local this stage and `terraform.tfstate*`
  must never be committed; formatting and validation must pass before the stage is called
  done (`brief.md:24`; `README.md:90`).

**Learner-owned concept areas — [Learner-owned], do not answer:** where in the learner's
own configuration they relied on Terraform to infer ordering; whether and where an
ordering had to be stated explicitly; the trade-offs between the two ways of repeating a
resource, why the course wants one preferred, and what happens to existing subnets if one
is later added to or removed from the set; the difference between a resource and a data
source in what Terraform manages and what happens to each on destroy; and what the
routing for a public tier needs and how the learner sees it in the plan. Covering these in
a coached lesson would leak the stage's design answers. Coach the *method* (where to look,
what to compare, what to record), never the conclusion. **[Verified]**

**Brief-level leak (open trainer decision). [Verified]** The brief itself pre-empts parts
of four of the five research prompts: `brief.md:13` couples "references" with inferred
ordering (prompt 1); `brief.md:41` names where an explicit dependency is needed
(prompt 2); `brief.md:61` ("Best practices this stage demonstrates") names `for_each` over
`count` (prompt 3); `brief.md:40` enumerates the public-tier routing components
(prompt 5). Prompt 4 is **not** pre-answered. Trainer to decide whether to reword the
brief and regenerate `tasks.md`/`write-up-template.md`, then run a fresh end-to-end leak
re-read (`handover §7`; `coaching §6`). The mentor does not name the mechanism either way.
See [Concepts explained (trainer level)](#5-concepts-explained-trainer-level).

## 6. Implementation walkthrough — how to coach each step

The mentor follows the teaching sequence in `.opencode/agents/devops-mentor.md:14-26`
(problem → concept → outcome/constraints → focused task → hints → implement/troubleshoot
→ verify → trade-offs → document) and **does not implement the stage for the learner**.
**[Verified]** Every phase ends with evidence captured, not with "done". **[Verified]**

| Step | Learner builds | Trainer's job | Evidence to capture |
| --- | --- | --- | --- |
| 0 Setup | Reads brief + rules, copies `write-up-template.md` → `write-up.md` | **Confirm M01 accepted** and run the VPC sandbox pre-flight before anything; confirm the notes' expected depth (`brief.md:64-67`) | Not applicable |
| 1 Graph | `aws_vpc` + `data "aws_availability_zones"` in `main.tf`; `init`; `terraform graph` | Keep graph reading process-level: nodes/edges, one dependency pair + the expression (E1–E2). **Do not state how ordering is inferred** | Graph output; the pair of blocks and the expression connecting them **[Expected]** |
| 2 Explicit | Exactly **one** `depends_on`; capture plan + graph before/after | Narrow to the single case that genuinely needs it (E4). **Do not state when an explicit dependency is required** | Before/after plan and graph **[Expected]** |
| 3 Repeating | Repeat one `aws_subnet` block across zones; record which mechanism and why | The learner chooses; **never indicate which mechanism is preferred** (E6). Point at the plan addresses the block produced | The one repeated block; the subnet addresses; the mechanism noted **[Expected]** |
| 4 Data | Consume the data source output where zones are needed, not a literal | `fmt -check -recursive` + `validate` right after adding it (E8). **Do not explain resource-vs-data-source** | The data block; where its output is consumed **[Expected]** |
| 5 Network | One VPC with public + private subnets across ≥ 2 AZs and the routing the public tier needs (brief lab step 3) | Work from the brief's lab step 3 list; confirm **no NAT gateway** block anywhere (E10). Do not state the routing components for prompt 5 | The configuration; `validate` output **[Expected]** |
| 6 Assembly | `fmt -check -recursive` + `validate`; `plan -out`; cost pre-check; `apply`; console view | Addresses from the plan/JSON, not the code; the learner's own cost estimate is the evidence (E12–E13) | fmt/validate output; plan/JSON addresses; no-NAT plan; console view **[Expected]** |
| 7 Verify | `destroy`; cloud-side confirmation; redacted evidence | Cloud-side is the standard; Terraform's "Destroy complete" is not enough (E14) | Empty cloud-side VPC/subnet/IGW/route-table queries **[Expected]** |
| 8 Write-up | Fills sections as they build; `Status → "In review"` | Check the header links the GitLab repo/branch; run the clean-up gate | Signed-off DoD evidence; clean-up gate **[Expected]** |

The six build tasks are `TASK-M03-B01…B06` (`tasks.md:15-20`); the coaching package maps a
contiguous 14 exercises (E1–E14, including exactly one write-up-only E-ID per research
prompt) onto these phases (`coaching §1-2`). The write-up-only mappings are **E3 → prompt
1, E5 → prompt 2, E7 → prompt 3, E9 → prompt 4, E11 → prompt 5**. **[Verified]**

## 7. Verification steps and expected outcomes (DoD-01…07)

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable
works, every DoD item met and evidenced, and no stored credential, no committed state file
and nothing left running that the brief says to destroy. **[Verified]** A stage scoring ≥ 90
is a content-library candidate. **[Verified]**

| DoD | What the trainer verifies | Expected evidence | Tag |
| --- | --- | --- | --- |
| DoD-01 | fmt/validate pass with no errors, and the plan (or its JSON) lists the VPC, subnets in ≥ 2 AZs and the public-tier routing — addresses **from the plan**, not the code | `fmt -check -recursive`; `validate`; `plan -out`; `show -json tfplan` addresses | **[Expected]** |
| DoD-02 | Subnets across more than one AZ come from **one repeated** `aws_subnet` block (reviewer reads the config) | The single block + multiple `aws_subnet` addresses; `state list` filtered to `aws_subnet` | **[Expected]** |
| DoD-03 | At least one account/region value is read with `data "aws_availability_zones"` and consumed, not hard-coded | The data block and where its output is used instead of a literal | **[Expected]** |
| DoD-04 | **No NAT gateway** in the plan or in state, shown from real output | `show -json tfplan` searched for NAT addresses; `state list` shows none | **[Expected]** |
| DoD-05 | The note names the **implicit** dependencies in the learner's own config and where each comes from | The note, cross-checked against `terraform graph` | **[Expected]** |
| DoD-06 | Everything destroyed, confirmed **from the cloud side**, not only Terraform's output | `aws ec2 describe-vpcs`, `describe-subnets`, `describe-internet-gateways`, `describe-route-tables` | **[Expected]** |
| DoD-07 | The write-up takes a first-time learner to the same network unaided, from a clean state | Dated run-through notes + corrections | **[Expected]** |

**Evidence reality check.** All DoD evidence above is **[Expected]** only. No learner build
exists, so none of it has been observed. The pinned version `TF_VERSION=1.16.5` is
**[Verified]** in `versions.env`, but that a learner's `fmt`/`validate` pass, that the
graph shows the expected edges, that the data source reads successfully, that the network
applies, that no NAT appears, and that the cloud side is empty after `destroy` are all
**[Unverified]**.

**Acceptance gate.** The mentor hands the build + write-up + evidence to the **Technical
Reviewer**; the mentor does not self-approve (`handover §8`;
`.opencode/agents/devops-mentor.md:105-106`). **[Verified]**

**Note on the coaching package's review status.** The M03 coaching package was reviewed by
the Technical Reviewer this run. The first pass returned **NEEDS_REVISION** with seven
findings, all of which were resolved; the re-review returned **ACCEPT**. The seven findings
were: (1 **HIGH**) the package had restated the answers to research prompts 1 and 2 in the
phase/exercise prose (fixed); (2 **MEDIUM**) it enumerated the public-tier routing
components for prompt 5 (fixed); (3 **MEDIUM**) a troubleshooting row presupposed prompt
3's effect (fixed); (4 **MEDIUM**) the brief-overlap disclosure was incomplete (fixed);
(5 **MEDIUM**) a broken `tasks.md:52` citation (fixed to `tasks.md:39`); (6 **LOW**) two
stage constraints were missing (fixed); (7 **LOW**) a typo (fixed). **No
Technical-Reviewer report artifact was committed to the repository**, so treat "ACCEPT" as
**[Unverified]** in-repo until the report is attached. The package describes itself as a
handoff (`coaching §6`).

## 8. Troubleshooting scenarios

The full diagnostic map is in [`m03-common-errors.md`](m03-common-errors.md). The first
risk in this stage is not technical — it is the **open M01 prerequisite** plus the
**sandbox VPC pre-flight**: M03's Setup requires M01 accepted (`tasks.md:11`) and a
sandbox able to create a VPC, subnets and routing (`brief.md:66`), and at curation time
neither is confirmed. **[Verified]**

A short summary of the failure classes:

- **Configuration validation** (region/AZ mismatch, or subnet CIDRs overlapping the VPC or
  each other). Align the provider region and the zones; give each subnet a distinct
  in-range CIDR; re-run `validate` then `plan`. **[Expected]**
- **Ordering surprises** (a plan change after the repeated set changes; a `depends_on`
  that hides a connection meant to be a reference; route/association ordering). These
  touch research prompts 2, 3 and 5, so the process rule is **stop, capture the exact
  plan/graph, record it, reconcile — never apply blind**. **[Learner-owned]**
- **Data-source surprises** (the data source returns values the learner did not expect).
  Capture the outputs and compare against the console for the configured region; do not
  explain what a data source manages. **[Learner-owned]** (prompt 4).
- **Constraint violation — a NAT gateway appears in the plan.** NAT is out of scope for
  this stage (`brief.md:22`; ADR-011). Find the block that declared it, remove it, re-run
  `plan`, and confirm it is gone. **[Verified]**
- **Sandbox access gap** (`AccessDenied` creating a VPC/subnet/route). This is a sandbox
  capability gap to **escalate**, never to work around (`brief.md:66`). **[Verified]**
- **Clean-up slips** (a resource still present after `destroy`, or `terraform.tfstate*`
  staged). Re-run `destroy` in the **same** config and confirm cloud-side empty; add the
  ignore rule and `git rm --cached` if state was staged. **[Expected]**

## 9. Security considerations

- **No static credentials, ever.** No IAM user access keys and no long-lived credentials
  of any kind; sandbox accounts and short-lived sign-in only (`README.md:86`,
  `ADR-005`). **[Verified]**
- **Deliberately small surface. [Verified]** This stage creates **no** compute instances,
  security groups or IAM roles (`brief.md:22`), which keeps the network configuration
  free of compute and identity attack surface. Reviewers should still reject any drift
  that adds them.
- **No NAT gateway.** NAT is excluded for cost (ADR-011) and is a hard stage boundary
  (`brief.md:22`); its absence in the plan **and** state is evidence (DoD-04).
  **[Verified]**
- **State is local, and never committed** (`brief.md:24`; rules for every stage,
  `README.md:90`). Confirm no `terraform.tfstate*` is staged (DoD-06 clean-up gate).
  **[Verified]**
- **Redact account IDs and ARNs** before pasting any plan, state or cloud-side output.
  What to redact is a trainer decision. **[Verified]** — placeholders: `<AWS_ACCOUNT_ID>`,
  `<AWS_REGION>`, `<VPC_ID>`, `<SUBNET_ID>`, `<AZ>`, `<CIDR>`.
- **Read-only inspection only** for `terraform graph`, `state list` and all cloud-side
  queries; never edit state by hand (`README.md:91`). **[Verified]**
- **Sandbox-compatible tooling only** — no Organizations/SCPs, billing APIs or
  policy-as-code engines (ADR-015). **[Verified]**
- **Never paste credentials, tokens or key material** in the write-up
  (`write-up-template.md:3`). **[Verified]**

## 10. Alternatives and trade-offs

- **Repeat with one mechanism, chosen by the learner. [Verified]** The brief names two
  mechanisms; the course prefers one, and which — and why — is **[Learner-owned]**
  (prompt 3, `brief.md:61`). Do not name or confirm the preference in coaching.
  **[Learner-owned]**
- **Exactly one explicit dependency (`depends_on`). [Verified]** The stage asks for exactly
  one (`brief.md:41`); when one is genuinely required is **[Learner-owned]** (prompt 2).
- **Data source instead of a hard-coded literal. [Verified]** DoD-03 requires at least one
  account/region value be read, not written (`brief.md:52`). What a data source manages and
  what happens to it on destroy is **[Learner-owned]** (prompt 4). **[Verified]**
- **No NAT gateway. [Verified]** NAT is excluded here for cost (ADR-011); the capstone may
  create exactly one, so the M03 boundary is a deliberate restriction, not a general rule
  (ADR-011). **[Verified]**
- **Local state, not remote. [Verified]** Remote state and native locking are M02's theme
  and are not repeated here (`brief.md:24`; `handover §4`). **[Verified]**
- **AWS only. [Verified]** GCP and Azure appear only in M09 as setup/read-only checks
  (`ADR-003`; the ADR's own text says "Module 10" — the repo maps multi-cloud to M09).
  **[Verified]**
- **Terraform CLI over OpenTofu. [Verified]** Activities use the Terraform CLI; OpenTofu is
  an optional, non-graded sidebar in M01 (`ADR-002`). **[Verified]**
- **Out of scope by design. [Verified]** Variables and validation (M04), advanced
  repetition, dynamic blocks and in-depth data sources (M06), and reusable modules (M07)
  all belong to later stages (`brief.md:26`). **[Verified]**

## 11. Knowledge check (trainer-facing)

These check the *trainer's* readiness to run the stage. They are not the learner's design
questions. The learner-facing knowledge check lives in the coaching package (`coaching §5`)
with answers deliberately not supplied.

1. Which of the five research prompts must you never answer, and what does the brief itself
   already pre-empt? **[Learner-owned]**
2. What are the seven DoD items, and which one requires a **cloud-side** check rather than
   Terraform's own output?
3. Which single resource block does the learner repeat, and what must the mentor **not**
   reveal about the choice?
4. Why can a change appear in the plan after the repeated set changes, and what is the
   process rule when it does?
5. What is the sandbox VPC pre-flight, and what is the correct response if it fails?
6. How many explicit dependencies does the stage ask for, and where is that stated?
7. What is the acceptance gate, and who signs off?
8. What must be re-verified once a first learner build exists?

## 12. Cleanup instructions

- **Stage clean-up gate (`README.md:111`, `brief.md:46`; ADR-011):** destroy
  **everything** — the VPC, subnets, internet gateway and route table; **no NAT gateway
  is created at any point**; no static credential stored; no `terraform.tfstate*`
  committed; nothing left running. **[Verified]**
- Confirm **cloud-side** that the VPC, subnets, internet gateway and route table are gone,
  not only from Terraform's "Destroy complete" (DoD-06). **[Verified]**
- Run `destroy` in the **same directory/configuration** that built the network; re-run if
  anything remains. **[Expected]**
- Re-login is not part of cleanup; but expired sessions are expected and should be
  re-established before the next stage. **[Expected]**

## 13. Further learning

- `modules/m03-managing-resources-with-network-provisioning/brief.md` — objective,
  scope/research prompts, constraints, deliverable, lab, DoD, best practices.
- `modules/m03-managing-resources-with-network-provisioning/tasks.md` — generated
  checklist.
- `docs/handovers/m03-managing-resources-with-network-provisioning-handover.md` — trainer
  requirements.
- `docs/handovers/m03-devops-mentor-coaching-package.md` — coaching plan, exercises E1–E14,
  evidence table, troubleshooting map.
- `README.md:80-91` (rules) and `README.md:93-116` (rubric).
- ADR-002 (CLI vs OpenTofu), ADR-003 (AWS primary), ADR-005 (sandboxes/short-lived
  credentials), ADR-009 (local check scripts), ADR-010 (`versions.env`), ADR-011 (cost and
  destroy controls), ADR-015 (sandbox-compatible tooling).
- `knowledge/proposed/m03-common-errors.md` and `knowledge/proposed/m03-reuse-note.md`.

## Source references

- `modules/m03-managing-resources-with-network-provisioning/{brief.md,tasks.md,write-up-template.md}`
- `docs/handovers/m03-managing-resources-with-network-provisioning-handover.md`
- `docs/handovers/m03-devops-mentor-coaching-package.md`
- `versions.env`; `README.md:80-116`
- `docs/arch-docs/adrs/ADR-002`, `ADR-003`, `ADR-005`, `ADR-009`, `ADR-010`, `ADR-011`,
  `ADR-015`
- `.opencode/agents/{devops-mentor.md,technical-reviewer.md,knowledge-curator.md}`
- `knowledge/retros/2026-10-14-handover-to-devops-mentor.md`
