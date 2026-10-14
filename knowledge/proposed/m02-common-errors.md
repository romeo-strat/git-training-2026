# M02 — Common Errors & Troubleshooting (Managing Terraform State)

> **STATUS: DRAFT — no learner build, no AWS sandbox.** Derived from the M02 coaching
> package's troubleshooting map (`m02-devops-mentor-coaching-package.md §4`), which the
> Technical Reviewer accepted leak-clean. Error *text* below is illustrative of the
> class of failure, not captured from a real run unless marked. **No runtime behaviour
> has been verified.** See the status vocabulary in the runbook.
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.
>
> **Audience:** trainers/mentors diagnosing a learner's M02 failures; maintainers
> curating the course-wide common-errors list. **Not trainee-facing.**

## How to use this

Order a diagnosis the way the mentor sequence does (`.opencode/agents/devops-mentor.md:108-119`):
read the exact error, form one hypothesis, run the smallest diagnostic, only then act.
Keep the **exact error text** — the write-up's "What tripped me up" section
(`TASK-M02-W06`) is where these become the course's common-errors list
(`README.md:103`). **[Verified]**

**Several rows are deliberately process-only.** Trusting a state file, what leaks a
secret into state, how you know nothing was recreated, and what locking prevents are the
learner's research prompts (1, 2, 5, 6). For those, the guide gives the *safe action*,
not the mechanism. **[Verified]**

## Diagnostic legend

- **Symptom / error** — what the learner reports.
- **Likely cause** — hypothesis to test, not a conclusion.
- **Diagnostic** — the smallest evidence-gathering step.
- **Smallest fix** — the least invasive resolution.
- **Escalate** — when this is a trainer/sandbox-owner decision, not a learner fix.

Placeholders used: `<AWS_PROFILE>`, `<AWS_ACCOUNT_ID>`, `<IAM_ROLE_ARN>`,
`<BUCKET_NAME>`, `<STATE_KEY>`, `<LOCK_KEY>`, `<SSM_PARAMETER_NAME>`, `<REGION>`.

**Prerequisite check first.** M02's Setup requires M01 accepted (`tasks.md:11`). If the
learner reports *anything* failing at Setup, confirm the prerequisite before diagnosing
the error. **[Verified]**

---

## 1. Credential and sign-in failures

### 1.1 `ExpiredToken` / SSO session expired
- **Likely cause:** the interactive IAM Identity Center login expired (expected —
  `ADR-005`; re-login and expiry symptoms are taught from M01).
- **Diagnostic:** `aws sts get-caller-identity` fails the same way, confirming a session
  problem, not a Terraform problem.
- **Smallest fix:** re-authenticate, then re-check identity before continuing.
- **Escalate:** no — this is a taught skill.

### 1.2 `No valid credential sources found`
- **Likely cause:** not signed in, or the wrong profile is selected.
- **Diagnostic:** `aws sts get-caller-identity`; check the `AWS_PROFILE` value.
- **Smallest fix:** point at the correct profile.
- **Do not:** create a static access key to "get moving" (`README.md:86`, `ADR-005`).
  **[Verified]**
- **Escalate:** if no profile exists at all, raise with the sandbox owner.

---

## 2. Local state inspection (read-only)

### 2.1 `state show` / `state list` returns nothing
- **Likely cause:** the command is run from the wrong directory or against the wrong
  state.
- **Diagnostic:** `pwd`; confirm you are in the configuration directory that owns the
  state.
- **Smallest fix:** run from the migrated config's directory.
- **Do not:** mutate state to "fix" an empty listing — state subcommands are read-only
  inspection only (`brief.md:26`). **[Verified]**

### 2.2 `.tfstate` appears in `git status`
- **Likely cause:** the ignore rule is missing or the file was staged before it existed.
- **Diagnostic:** check `.gitignore` and the staged set.
- **Smallest fix:** add `terraform.tfstate*` to `.gitignore`; `git rm --cached` if it was
  already staged. State files never go into version control (`brief.md:25`). **[Verified]**

### 2.3 A value appears in the state file
- **Diagnostic:** capture the exact line; record it in the write-up (`TASK-M02-W07`).
- **Smallest fix:** none needed — this is the observation the stage wants.
- **Do not explain:** what leaks a secret into state, or why state is sensitive
  (research prompt 2). **[Learner-owned]**

### 2.4 Unsure whether to trust a state file you did not create
- **Diagnostic:** compare `state show` against the cloud-side resource, read-only.
- **Smallest fix:** none in-stage.
- **Do not explain:** what to check or what breaks on a hand-edited state file
  (research prompt 1). **[Learner-owned]**

---

## 3. The bucket (bootstrap and protections)

### 3.1 `NoSuchBucket` / wrong endpoint when applying the backend
- **Likely cause:** the bucket name or region in the backend block disagrees with the
  bucket that exists.
- **Diagnostic:** compare the block against `aws s3 ls`.
- **Smallest fix:** correct the name/region, then re-run `init`. **[Expected]**

### 3.2 Cloud-side show the protections are off
- **Likely cause:** a versioning/encryption/public-access-block setting was omitted or
  applied to the wrong bucket.
- **Diagnostic:** re-run the cloud-side getters for the bucket in the error's region.
- **Smallest fix:** add the missing setting and re-apply the bucket config. "The config
  says so" is not evidence (DoD-04). **[Verified]**

### 3.3 `destroy` run in the bucket folder
- **Likely cause:** the learner treated the bucket folder like the first config.
- **Diagnostic:** check which folder/state `destroy` is running in.
- **Smallest fix:** **stop**; the bucket is the one retained resource (`brief.md:22,52`).
  Only the **first** config is destroyed at clean-up. **[Verified]**

---

## 4. Backend migration (highest-risk step — process-only rows)

> These rows are where a leak is easiest. Give the **safe action**, never the mechanism.
> The reasoning belongs in the learner's write-up (`TASK-M02-W02/W07`).

### 4.1 `Error: Backend initialization required…`
- **Likely cause:** the backend block changed; re-initialisation is needed.
- **Diagnostic:** read the error; confirm the block you intend.
- **Smallest fix:** run `terraform init` (`-migrate-state` for the move). **[Expected]**

### 4.2 `init` asks about an existing state object / key collision
- **Likely cause:** the configured key already holds a state object.
- **Diagnostic:** read the prompt; inspect the bucket at the key.
- **Smallest fix:** choose a distinct key; **do not** recreate resources. **[Expected]**

### 4.3 A change appears in `plan` after `init -migrate-state`
- **Likely cause:** the migration did not preserve the mapping (a botched move can
  recreate resources).
- **Diagnostic:** read the annotation the plan prints beside the changed attribute.
- **Smallest fix:** **stop**; do not apply. Capture the exact text and raise it with the
  trainer. This is the DoD-03 guard. **[Verified]**
- **Do not explain:** why a no-change plan is the proof (research prompt 5).
  **[Learner-owned]**

---

## 5. Native locking

### 5.1 Lock-object create/delete denied (`AccessDenied` on a state/lock object request)
- **Likely cause:** the sandbox role cannot create or delete the lock object.
- **Diagnostic:** the error names the denied action/ARN.
- **Smallest fix:** none in-stage.
- **Escalate:** raise with the trainer — it is a sandbox access gap, **not** something to
  work around (`brief.md:30-31`). **[Verified]**

### 5.2 A DynamoDB error or a `dynamodb_table` reference
- **Likely cause:** the backend block carries a DynamoDB setting.
- **Diagnostic:** compare the block against the constraints.
- **Smallest fix:** remove any DynamoDB setting; the block must use native locking only
  (`brief.md:27`). **[Verified]**

### 5.3 `Error acquiring the state lock` **unexpectedly**
- **Diagnostic:** confirm no `terraform` process is running in any terminal you own.
- **Smallest fix:** none in-stage.
- **Do not explain:** what locking prevents or does not (research prompt 6).
  **[Learner-owned]**
- **Escalate:** recovering a lock left behind is **out of scope** (`brief.md:32`) — raise
  it with the trainer. **[Verified]**

### 5.4 Locking claim does not match reality
- **Likely cause:** the notes assert behaviour from memory rather than the pinned
  version.
- **Diagnostic:** re-read the `1.16.5` release notes for the specific claim.
- **Smallest fix:** correct the note to match the pinned version (`brief.md:28`).
  **[Verified]**

---

## 6. Clean-up and leftovers

### 6.1 Resource still present after `destroy`
- **Likely cause:** destroy run from a different directory/state, or a partial failure.
- **Diagnostic:** cloud-side query vs Terraform's output.
- **Smallest fix:** re-run `destroy` in the **first** config only. Terraform's "Destroy
  complete" is **not** sufficient evidence (DoD-06). **[Verified]**

### 6.2 The bucket is gone (but it should not be)
- **Likely cause:** the bucket config was destroyed, or the bucket was targeted by a
  broad clean-up.
- **Diagnostic:** cloud-side bucket listing.
- **Smallest fix:** rebuild the bucket config and re-apply; note this is the capstone's
  job, not M02's (`brief.md:52`; ADR-006, ADR-011). **[Verified]**
- **Escalate:** if state for later stages pointed at the deleted bucket, raise with the
  trainer before continuing. **[Recommendation]**

### 6.3 State or key material committed
- **Likely cause:** the ignore rule was missing, or state content was committed under
  another name.
- **Diagnostic:** the ignore rule plus a static-key/state-content scan over the working
  tree and history.
- **Smallest fix:** remove from tracking, add the ignore rule, and (if needed) scrub
  history — then prove a clean history (DoD-06). **[Expected]**

---

## Reuse note

This file is a **stage-scoped** common-errors entry. The error *classes* (credential
expiry, backend/migration mistakes, lock-object permission gaps, stale locks and
cloud-side leftovers) recur across stages; the **exact** M02 rows are project-specific.
When a course-wide common-errors list exists, migrate the reusable classes and leave
stage-specific rows here. See `knowledge/proposed/m02-reuse-note.md`. **[Recommendation]**

## Source references

- `docs/handovers/m02-devops-mentor-coaching-package.md §4`
- `modules/m02-managing-terraform-state/{brief.md,tasks.md,write-up-template.md}`
- `README.md:86,88,103,111`; `versions.env`
- `docs/arch-docs/adrs/ADR-005`, `ADR-006`, `ADR-011`
