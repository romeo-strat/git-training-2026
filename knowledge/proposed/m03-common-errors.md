# M03 — Common Errors & Troubleshooting (Managing Resources with Network Provisioning)

> **STATUS: DRAFT — no learner build, no AWS sandbox.** Derived from the M03 coaching
> package's troubleshooting map (`m03-devops-mentor-coaching-package.md §4`, 13 rows).
> The package's first review pass was NEEDS_REVISION with seven findings, all resolved,
> and the re-review was ACCEPT — but **no Technical-Reviewer report artifact is committed
> to the repository, so treat that ACCEPT as [Unverified] in-repo** until the report is
> attached. Error *text* below is illustrative of the class of failure, not captured from
> a real run unless marked. **No runtime behaviour has been verified.** See the status
> vocabulary in the runbook.
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.
>
> **Audience:** trainers/mentors diagnosing a learner's M03 failures; maintainers
> curating the course-wide common-errors list. **Not trainee-facing.**

## How to use this

Order a diagnosis the way the mentor sequence does (`.opencode/agents/devops-mentor.md:108-119`):
read the exact error, form one hypothesis, run the smallest diagnostic, only then act.
Keep the **exact error text** — the write-up's "What tripped me up" section
(`TASK-M03-W06`; `tasks.md:39`) is where these become the course's common-errors list
(`README.md:103`). **[Verified]**

**Several rows are deliberately process-only.** Where a failure touches a research prompt
— the ordering the learner inferred or stated (prompt 2), what changes when the repeated
set changes (prompt 3), what a data source manages (prompt 4), and what the public-tier
routing needs (prompt 5) — the guide gives the *safe action*, not the mechanism. Those
rows are marked `Sensitive — answer belongs in the write-up (research prompt N)`.
**[Verified]**

## Diagnostic legend

- **Symptom / error** — what the learner reports.
- **Likely cause** — hypothesis to test, not a conclusion.
- **Diagnostic** — the smallest evidence-gathering step.
- **Smallest fix** — the least invasive resolution.
- **Escalate** — when this is a trainer/sandbox-owner decision, not a learner fix.

Placeholders used: `<AWS_PROFILE>`, `<AWS_ACCOUNT_ID>`, `<AWS_REGION>`, `<VPC_ID>`,
`<SUBNET_ID>`, `<AZ>`, `<CIDR>`.

**Prerequisite check first.** M03's Setup requires M01 accepted (`tasks.md:11`) **and** a
sandbox able to create a VPC, subnets and routing (`brief.md:66`). If the learner reports
*anything* failing at Setup, confirm both before diagnosing the error. **[Verified]**

---

## 1. Credential and sign-in failures

### 1.1 `ExpiredToken` / SSO session expired
- **Likely cause:** the interactive IAM Identity Center login expired (expected —
  `ADR-005`; re-login and expiry symptoms are taught from M01).
- **Diagnostic:** `aws sts get-caller-identity` fails the same way, confirming a session
  problem, not a Terraform problem.
- **Smallest fix:** re-authenticate (`aws sso login`), then re-check identity before
  continuing.
- **Escalate:** no — this is a taught skill.

### 1.2 `No valid credential sources found`
- **Likely cause:** not signed in, or the wrong profile/region is selected.
- **Diagnostic:** `aws sts get-caller-identity`; check `AWS_PROFILE` / `AWS_REGION`.
- **Smallest fix:** point at the correct profile.
- **Do not:** create a static access key to "get moving" (`README.md:86`, `ADR-005`).
  **[Verified]**
- **Escalate:** if no profile exists at all, raise with the sandbox owner.

---

## 2. Prerequisite and pre-flight failures

### 2.1 `AccessDenied` creating a VPC/subnet/route
- **Likely cause:** the sandbox role cannot create (or delete) a VPC, subnets or routing.
- **Diagnostic:** the error names the denied action/ARN.
- **Smallest fix:** none in-stage.
- **Escalate:** raise with the trainer — it is a sandbox capability gap, **not** something
  to work around (`brief.md:66`; `handover §7`). **[Verified]**

### 2.2 Setup blocked because M01 is not accepted
- **Likely cause:** the M01 prerequisite is not met (`tasks.md:11`).
- **Diagnostic:** confirm M01 is complete, accepted and its clean-up gate clean before
  building.
- **Smallest fix:** none in-stage — M03 does not begin until M01 is accepted.
  **[Verified]**

---

## 3. Configuration validation

### 3.1 Region / AZ mismatch (a zone or region is not what you expected)
- **Likely cause:** the provider region and the zones the configuration consumes disagree.
- **Diagnostic:** compare the data source's output with the provider region in use; check
  `AWS_REGION`/profile.
- **Smallest fix:** align the provider region and the consumed zones; re-run `plan`.
  **[Expected]**

### 3.2 CIDR overlap (apply rejected)
- **Likely cause:** a subnet CIDR overlaps the VPC CIDR or another subnet.
- **Diagnostic:** compare each subnet CIDR against the VPC CIDR and against each other.
- **Smallest fix:** give each subnet a distinct, in-range CIDR; re-run `validate` then
  `plan`. **[Expected]**

---

## 4. Dependency graph and references

### 4.1 `terraform graph` output unreadable
- **Likely cause:** the raw output is being read on screen rather than as a file.
- **Diagnostic:** write it to a file; read node and edge lines one at a time, or view it in
  a graph renderer.
- **Smallest fix:** read the file rather than the screen.
- **Do not explain:** how ordering is inferred (prompt 1). **[Learner-owned]**

### 4.2 `depends_on` masking a missing reference
- **Likely cause:** an explicit dependency was stated where a reference was meant.
- **Diagnostic:** re-read the graph; check whether the ordering hides a connection that
  should have been a reference.
- **Smallest fix:** reduce to the single explicit dependency the brief asks for
  (`brief.md:41`). **Sensitive — answer belongs in the write-up (research prompt 2).**
  **[Learner-owned]**

---

## 5. Repeating a resource

### 5.1 A plan change appears after the repeated set changes
- **Likely cause:** the set the learner repeats over was changed, and the mechanism's
  effect on existing subnets shows up in the plan.
- **Diagnostic:** capture the plan; list which addresses changed and compare against what
  was expected; record it.
- **Smallest fix:** **stop; do not apply.** Capture the exact plan and reconcile before
  acting. **Sensitive — answer belongs in the write-up (research prompt 3).**
  **[Learner-owned]**

---

## 6. Data sources

### 6.1 The data source returns unexpected values
- **Likely cause:** the data source is reading a different region/account than assumed.
- **Diagnostic:** capture the data source's outputs; compare against the console for the
  region configured.
- **Smallest fix:** none standalone — record observed vs expected in the write-up.
  **Sensitive — answer belongs in the write-up (research prompt 4).** Do not state what a
  data source manages. **[Learner-owned]**

---

## 7. Public-tier routing

### 7.1 Route / association ordering looks wrong
- **Likely cause:** the route table or the association does not reference the blocks it
  depends on in the way the learner intended.
- **Diagnostic:** capture plan and graph; identify which blocks reference which.
- **Smallest fix:** confirm the association references the route table and the subnets.
  **Sensitive — answer belongs in the write-up (research prompt 5).** Do not state what
  the routing needs. **[Learner-owned]**

### 7.2 A NAT gateway appears in the plan
- **Likely cause:** a NAT block was declared (the stage allows none).
- **Diagnostic:** search the plan output/JSON for the NAT resource address; find which
  block declared it.
- **Smallest fix:** **constraint violation** (`brief.md:22`; ADR-011): remove that block;
  re-run `plan` and confirm it is gone. **[Verified]**

---

## 8. Clean-up and leftovers

### 8.1 Resource still present after `destroy`
- **Likely cause:** destroy run from a different directory/config, or a partial failure.
- **Diagnostic:** cloud-side query (`describe-vpcs`, `describe-subnets`,
  `describe-internet-gateways`, `describe-route-tables`) vs Terraform's output.
- **Smallest fix:** re-run `destroy` in the **same** directory/config. Terraform's "Destroy
  complete" is **not**, on its own, cloud-side evidence (DoD-06). **[Verified]**

### 8.2 `terraform.tfstate*` appears staged / in `git status`
- **Likely cause:** the ignore rule is missing or the file was staged before it existed.
- **Diagnostic:** check `.gitignore` and the staging set.
- **Smallest fix:** add/confirm the ignore rule; `git rm --cached` if staged; re-check
  `git status`. State is local this stage and never committed (`brief.md:24`;
  `README.md:90`). **[Verified]**

---

## Reuse note

This file is a **stage-scoped** common-errors entry. The error *classes* (credential
expiry, region/CIDR validation, dependency/ordering surprises, data-source surprises, NAT
constraint violations, sandbox permission gaps and cloud-side leftovers) recur across
stages; the **exact** M03 rows are project-specific. When a course-wide common-errors list
exists, migrate the reusable classes and leave stage-specific rows here. See
`knowledge/proposed/m03-reuse-note.md`. **[Recommendation]**

## Source references

- `docs/handovers/m03-devops-mentor-coaching-package.md §4`
- `modules/m03-managing-resources-with-network-provisioning/{brief.md,tasks.md,write-up-template.md}`
- `README.md:86,88,90,103,111`; `versions.env`
- `docs/arch-docs/adrs/ADR-005`, `ADR-011`, `ADR-015`
