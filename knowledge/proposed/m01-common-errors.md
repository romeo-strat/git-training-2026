# M01 — Common Errors & Troubleshooting (Getting Started with Terraform)

> **STATUS: DRAFT — no learner build, no AWS sandbox.** Derived from the M01 coaching
> package's troubleshooting map (`m01-devops-mentor-coaching-package.md §4`), which the
> Technical Reviewer accepted leak-clean. Error *text* below is illustrative of the
> class of failure, not captured from a real run unless marked. **No runtime behaviour
> has been verified.** See the status vocabulary in the runbook.
>
> **Library mapping:** spec `library/proposed/` → this repo's `knowledge/proposed/`.
>
> **Audience:** trainers/mentors diagnosing a learner's M01 failures; maintainers
> curating the course-wide common-errors list. **Not trainee-facing.**

## How to use this

Order a diagnosis the way the mentor sequence does (`.opencode/agents/devops-mentor.md:108-119`):
read the exact error, form one hypothesis, run the smallest diagnostic, only then act.
Keep the **exact error text** — the write-up's "What tripped me up" section
(`TASK-M01-W06`) is where these become the course's common-errors list
(`README.md:103`). **[Verified]**

**Two rows are deliberately process-only.** Plan surprises and OS differences are the
learner's research prompts (4, 5, 1). For those, the guide gives the *safe action*, not
the mechanism. **[Verified]**

## Diagnostic legend

- **Symptom / error** — what the learner reports.
- **Likely cause** — hypothesis to test, not a conclusion.
- **Diagnostic** — the smallest evidence-gathering step.
- **Smallest fix** — the least invasive resolution.
- **Escalate** — when this is a trainer/sandbox-owner decision, not a learner fix.

Placeholders used: `<AWS_PROFILE>`, `<AWS_ACCOUNT_ID>`, `<IAM_ROLE_ARN>`,
`<SSM_PARAMETER_NAME>`, `<REGION>`.

---

## 1. Credential and sign-in failures

### 1.1 `ExpiredToken` / SSO session expired
- **Likely cause:** the interactive IAM Identity Center login expired (expected —
  `ADR-005` consequences; M01 must teach re-login and expiry symptoms).
- **Diagnostic:** `aws sts get-caller-identity` fails the same way, confirming it is a
  session problem and not a Terraform problem.
- **Smallest fix:** re-authenticate, then re-check identity before continuing.
- **Escalate:** no — this is a taught skill.

### 1.2 `No valid credential sources found`
- **Likely cause:** not signed in, or the wrong profile is selected.
- **Diagnostic:** `aws sts get-caller-identity`; check the `AWS_PROFILE` value.
- **Smallest fix:** point at the correct profile.
- **Do not:** create a static access key to "get moving" (`README.md:86`, `ADR-005`).
  **[Verified]**
- **Escalate:** if no profile exists at all, raise with the sandbox owner.

### 1.3 Terraform uses a different identity than expected
- **Likely cause:** ambient credentials/`AWS_PROFILE` differ from what the learner
  assumed; credential resolution order is **[Learner-owned]** (research prompt 3).
- **Diagnostic:** prove which identity a `plan` uses rather than assuming; compare the
  caller-identity output against the account the resource lands in.
- **Smallest fix:** make the environment unambiguous (correct profile) — do not supply
  the resolution-order answer to the learner.
- **Escalate:** no; this is coaching.

---

## 2. Dependency / `init` failures

### 2.1 `init` reports no matching provider version
- **Likely cause:** the `required_providers` constraint is too tight (or the wrong
  value) relative to the pinned provider.
- **Diagnostic:** read the `init` error; compare the constraint in `versions.tf` against
  the pin in `versions.env` and against `.terraform.lock.hcl`.
- **Smallest fix:** adjust the constraint to match the pin. Do not copy a pin from a
  blog post (`coaching §2 E4`).
- **Escalate:** no.

### 2.2 Checksum mismatch on install
- **Likely cause:** lock file inconsistent with the constraint, or a changed provider
  source.
- **Diagnostic:** read the error; compare `versions.tf` with `.terraform.lock.hcl`.
- **Smallest fix:** deliberately run `init -upgrade` (and re-commit the lock) **only**
  when the change is intended.
- **Do not:** disable checksum verification (`coaching §4`). **[Recommendation]**
- **Escalate:** if the mismatch is unexplained, stop and raise it.

### 2.3 `init` cannot install the provider
- **Likely cause:** offline or registry/network failure.
- **Diagnostic:** the error names the network or registry failure.
- **Smallest fix:** retry on a working network.
- **Escalate:** if the registry is blocked sandbox-wide, raise with the owner.

### 2.4 `init` refuses an undeclared required provider
- **Likely cause:** a resource uses a provider not yet declared in `versions.tf`.
- **Diagnostic:** the error names the missing provider.
- **Smallest fix:** declare the required provider, then re-run `init`. This is the
  normal first `init` error and is expected when building `versions.tf` from constraints
  (`coaching §2 E4`). **[Expected]**

### 2.5 `.terraform.lock.hcl` missing from the commit
- **Likely cause:** `.gitignore` or a skipped `git add`.
- **Diagnostic:** `git status` / `git show` on the commit.
- **Smallest fix:** add and commit the lock file (DoD-03 requires it in the commit).
- **Escalate:** no.

---

## 3. Configuration (`fmt` / `validate`) failures

### 3.1 `validate` reports an unsupported or missing argument
- **Likely cause:** typo or provider/resource argument mismatch.
- **Diagnostic:** `validate` output names the file and line.
- **Smallest fix:** fix the named line; re-run `fmt`, then `validate` again (a `fmt`
  rewrite can change what `validate` sees).
- **Escalate:** no.

### 3.2 `fmt` "fails" by rewriting a file
- **Likely cause:** not a failure — `fmt` normalises formatting.
- **Diagnostic:** re-run `validate` after `fmt`.
- **Smallest fix:** commit the formatted file. **[Recommendation]**

---

## 4. Plan surprises (process-only — learner research prompts)

> These rows are where a leak is easiest. Give the **safe action**, never the
> mechanism. The reasoning belongs in the learner's write-up (`TASK-M01-W02/W05`).

### 4.1 Plan shows an unexpected **replace**
- **Diagnostic:** read the annotation the plan prints beside the changed attribute.
- **Smallest fix:** **stop**; do not apply. Decide deliberately before any apply.
- **Do not explain:** which attributes force replacement (research prompt 5). **[Learner-owned]**
- **Escalate:** to the trainer if the change cannot be explained.

### 4.2 Plan shows an unexpected **destroy**
- **Diagnostic:** capture the plan and identify which block changed before acting.
- **Smallest fix:** **stop**; reconcile with the trainer before any apply. Process rule:
  never approve a plan with a change you cannot explain (`coaching §2 E11`). **[Verified]**
- **Do not explain:** why the destroy appeared if that resolves research prompt 4.
  **[Learner-owned]**

### 4.3 Applying before reading the plan
- **Likely cause:** skipping step 4's habit.
- **Diagnostic:** ask the learner to read their own plan line by line.
- **Smallest fix:** `plan` first, always (`README.md:88`). **[Verified]**

---

## 5. State lock and leftover resources

### 5.1 `Error acquiring the state lock`
- **Likely cause:** leftover lock info from a crashed run.
- **Diagnostic:** inspect the lock file; confirm no `terraform` process is running.
- **Smallest fix:** remove the stale lock **only after** confirming no run is active.
- **Do not:** hand-edit state (`README.md:91`). **[Verified]**
- **Escalate:** if a run is genuinely still active, stop and investigate.

### 5.2 `apply` returns `AccessDenied` for SSM
- **Likely cause:** sandbox policy is tighter than assumed.
- **Diagnostic:** the error names the denied action and ARN.
- **Smallest fix:** none in-stage.
- **Escalate:** raise with the trainer — sandbox permissions are out of M01 scope
  (`brief.md:28`). **[Verified]**

### 5.3 Resource already exists on apply
- **Likely cause:** leftover from a previous run.
- **Diagnostic:** query the cloud side for `<SSM_PARAMETER_NAME>` in `<REGION>`.
- **Smallest fix:** destroy/remove the leftover, or use a distinct name.
- **Do not:** attempt import — importing is out of scope (M08). **[Verified]**
- **Escalate:** if the leftover is not owned by the learner's state.

### 5.4 Resource still present after `destroy`
- **Likely cause:** destroy run from a different directory/state, or a partial failure.
- **Diagnostic:** cloud-side query vs Terraform's output.
- **Smallest fix:** re-run `destroy` in the same directory; confirm the cloud side is
  empty. Terraform's "Destroy complete" is **not** sufficient evidence (DoD-06).
  **[Verified]**

---

## 6. Cross-OS differences (process-only)

### 6.1 A lab step behaves differently on Windows vs macOS
- **Diagnostic:** compare how each OS resolves the tool and the shell.
- **Smallest fix:** record the difference; agree the verification method with the
  trainer.
- **Do not explain:** *why* Windows differs (research prompt 1). **[Learner-owned]**
- **Escalate:** the trainer decides how the OS a learner does not own is verified
  (`brief.md:76`). **[Verified]**

---

## Reuse note

This file is a **stage-scoped** common-errors entry. The error *classes* (credential
expiry, constraint/lock disagreement, stale lock, cloud-side leftovers) recur across
stages; the **exact** M01 rows are project-specific. When a course-wide common-errors
list exists, migrate the reusable classes and leave stage-specific rows here. See
`knowledge/proposed/m01-reuse-note.md`. **[Recommendation]**

## Source references

- `docs/handovers/m01-devops-mentor-coaching-package.md §3-4`
- `modules/m01-getting-started-with-terraform/{brief.md,tasks.md,write-up-template.md}`
- `README.md:86,88,91,103,111`; `versions.env`
- `docs/arch-docs/adrs/ADR-005`
