# M01 — DevOps Mentor Coaching Package

> **Trainer/agent material. Not trainee-facing.** Companion to [m01-getting-started-with-terraform-handover.md](m01-getting-started-with-terraform-handover.md). Produced from the Curriculum Architect → DevOps Mentor handover.
>
> **Leak control:** none of the five research prompts in `modules/m01-getting-started-with-terraform/brief.md:13-17` are answered here. The hints narrow *where to look and what to record*, never the conclusion. The learner resolves them alone.

## 0. Mapping to the teaching sequence

Delivered in the order in `.opencode/agents/devops-mentor.md:14-26`: problem → concept → outcome/constraints → focused task → hints → implement/troubleshoot → verify with evidence → trade-offs → document. No phase ends with "done" — each ends with evidence captured for the Technical Reviewer. The mentor does not mark the stage complete.

## 1. Coaching plan (mapped to `tasks.md` and the brief's 5 steps)

### Phase 0 — Setup (Setup 1-3) — prerequisite gate
- Read `brief.md` top-to-bottom and README "Rules for every stage" (`README.md:80-91`).
- Copy `write-up-template.md` → `write-up.md`; leave the template untouched.
- Confirm access + tools against the stack constraints; raise gaps with the trainer.
- **Read the pinned version from `versions.env`** at the repo root — `TF_VERSION=1.16.5` (latest stable). DoD-01's version evidence is unblocked (see §6).

### Phase 1 — Step 1: Workstation (B01, zero code)
- Toolchain: Terraform 1.11+ via a version manager (`tfenv`/`asdf`) where one works, AWS CLI, VS Code + HashiCorp extension, Git, `jq`; sign in via IAM Identity Center; no access keys; notes must serve macOS **and** Windows.
- Prove AWS connectivity and Terraform version; switch Terraform across two versions and paste both outputs.
- Exercises E1-E3.

### Phase 2 — Step 2: `versions.tf` (B02)
- Required-providers block written by the learner; run `terraform init`; observe `.terraform` and `.terraform.lock.hcl`; commit the lock file.
- Exercises E4-E6. Risk: over-tight/over-loose constraints, floating versions.

### Phase 3 — Step 3: `providers.tf` (B03)
- AWS provider + `default_tags`; `terraform fmt` and `terraform validate` pass with no errors (pasted).
- Exercises E7-E8. Trade-off to record: where configuration lives and why.

### Phase 4 — Step 4: `main.tf` (B04)
- One `aws_ssm_parameter`; `terraform plan`; confirm default tags are attached; start the plan-review note.
- Exercises E9-E11. Risk: applying before reading the plan.

### Phase 5 — Step 5: Apply and destroy (B05)
- Apply; change **one** attribute; `plan` shows an in-place update; apply again; `destroy`; confirm absence from the cloud side.
- Exercises E12-E14. Cost rule: look up billing before apply; record own estimate; destroy at the end.

### Phase 6 — Deliverable assembly (B06, B07)
Three files managing one resource, create → in-place update → destroy, plus the plan-review note. Code lives in the learner's own GitLab repo, linked from the write-up header.

### Phase 7 — Verify (V01…V07 = DoD-01…07)
See §3.

### Phase 8 — Write-up (W01…W10)
Fill sections as the learner builds, then set Status → "In review" and tell the trainer.

## 2. Focused exercises + escalating hints (no leaked answers)

- **E1 — Prove the workstation.** Two commands turn "I think it works" into evidence: one for the Terraform binary/version, one for who AWS thinks you are. If either errors, fix the environment before Step 2.
- **E2 — Switch Terraform versions.** Paste `terraform -version` after each switch (B-A-B). Do not assume the version; read the pin from `versions.env` at the repo root (§6).
- **E3 — Design your own static-key scan (DoD-02).** Decide what a leaked credential would match, search the working tree and the repository, then write down what the scan cannot catch. Tool/pattern/blind-spots are research prompt 1 — resolved alone.
- **E4 — Write `versions.tf` from constraints.** `init` refuses an undeclared required provider; run it right after writing the block and read the error. Do not copy a pin from a blog post.
- **E5 — Observed vs recorded (DoD-03).** Open `.terraform.lock.hcl` after init; describe in your own words what it recorded; cross-check against your constraint; commit it and capture the commit evidence.
- **E6 — Reviewer's-eye.** A merge request changes only the lock file — what makes you approve or stop? Research prompt 2; answer in the write-up.
- **E7 — Small file, early syntax check.** Run both `fmt` and `validate` on `providers.tf`; paste output; re-run `validate` if `fmt` rewrites.
- **E8 — Tags at the right level.** Why the default tags block belongs in `providers.tf`, and when you would still tag one resource directly. Research prompt 3.
- **E9 — Resource anatomy.** Split the resource block into what you set vs what Terraform reports back; find the default tag column.
- **E10 — Read the plan, then classify.** Build a pre-approval checklist; classify every change as create / in-place update / replacement and cite the plan's own annotation. Becomes the plan-review note.
- **E11 — Unexpected destroy rehearsal.** If a plan showed a destroy you did not expect, what is the safe first action? Research prompt 4. Process rule: never approve a plan with a change you cannot explain.
- **E12 — Pre-apply cost check.** Look up what your plan bills before apply; write your own estimate. The figure is your evidence, not the mentor's.
- **E13 — One-attribute change → in-place update (DoD-06).** Change exactly one attribute, `plan` before `apply`, capture it. In-place vs replacement is research prompt 5.
- **E14 — Prove destruction from the cloud side.** Query the cloud for the resource's existence and paste the empty result; Terraform's "Destroy complete" is not sufficient.

## 3. Verification instructions and exact evidence per DoD

| DoD | Run | Paste / capture | Acceptance | Caveat |
|---|---|---|---|---|
| **DoD-01** | Version manager: switch Terraform across two versions; `terraform -version` after each; caller-identity query from signed-in session | Both version outputs; caller-identity output | Actual version + identity, not assumed; installed via a version manager | Redact account ID/ARN as directed; pin read from `versions.env` (`TF_VERSION=1.16.5`) |
| **DoD-02** | Learner-designed static-key scan across disk and repo | Scan command + output; what it looked for and what it can miss | A real scan, not a claim | Tool/pattern intentionally unspecified |
| **DoD-03** | `terraform init` from the learner's own `versions.tf` | `.terraform` + `.terraform.lock.hcl` exist; commit including the lock file | Lock file committed; notes describe in own words what it recorded | Not doc wording |
| **DoD-04** | `terraform fmt` and `terraform validate` on `providers.tf`/`main.tf` | Pasted output | Pass, no errors | Not from memory |
| **DoD-05** | `terraform plan` (initial create) | Pasted plan showing default tags; plan-review note | Every change classified; trainer confirms each | Cite the plan's own annotation |
| **DoD-06** | `plan` before the one-attribute change; then `destroy` | Pasted in-place-update plan; cloud-side query after destroy | Cloud-side proves nothing remains | Terraform output alone insufficient |
| **DoD-07** | Follow your own "How to build it" from a clean state | Written end-to-end run-through on macOS **and** Windows | A first-timer could go empty-folder → destroyed resource unaided | OS you don't own: agree method with trainer |

**Stage clean-up gate (`README.md:111`):** no stored credential, no committed state file, nothing left running. Verify `terraform.tfstate` is not committed and the SSM parameter is gone.

## 4. Troubleshooting map

| Symptom | Likely cause | Diagnostic | Smallest fix |
|---|---|---|---|
| `ExpiredToken` / SSO session expired | Interactive login expired (ADR-005) | `aws sts get-caller-identity` fails the same way | Re-login; re-check identity before continuing |
| `No valid credential sources found` | Not signed in / wrong profile | `aws sts get-caller-identity`; check `AWS_PROFILE` | Point at correct profile; never create a static key |
| `init` no matching provider / checksum mismatch | Constraint too tight or lock inconsistent | Read init error; compare `versions.tf` vs `.terraform.lock.hcl` | Adjust constraint or deliberately `init -upgrade`; re-commit lock |
| `init` cannot install provider | Offline / registry issue | Error names the network/registry failure | Retry on working network; do not disable checksum verification |
| `Error acquiring the state lock` | Leftover lock info from a crashed run | Inspect lock file; confirm no `terraform` process | Remove stale lock only after confirming no run; never hand-edit state |
| `validate` unsupported/missing argument | Typo or provider mismatch | `validate` output with file/line | Fix the named line; re-run `fmt` then `validate` |
| Plan shows unexpected **replace** | Sensitive — answer belongs in the write-up (research prompt 5) | Read the annotation the plan prints beside the changed attribute | Stop; decide deliberately before any apply |
| Plan shows unexpected **destroy** | Sensitive — answer belongs in the write-up (research prompt 4) | Capture the plan and identify which block changed before acting | Stop; reconcile with the trainer before any apply |
| `apply` `AccessDenied` for SSM | Sandbox policy tighter than assumed | Error names the denied action/ARN | Raise with trainer — sandbox perms out of M01 scope |
| Resource already exists on apply | Leftover from a previous run | Cloud-side query | Destroy/remove leftover or use a distinct name; import is out of scope (M08) |
| `.terraform.lock.hcl` missing from commit | `.gitignore` / skipped `git add` | `git status` / `git show` | Add and commit the lock file |
| Windows vs macOS: a lab step does not behave the same | Sensitive — answer belongs in the write-up (research prompt 1) | Compare how each OS resolves the tool and the shell | Record the difference; agree the verification method with the trainer |
| Resource still present after destroy | Destroy run from different dir/state or partial failure | Cloud-side query vs Terraform output | Re-run destroy in the same directory; confirm cloud-side empty |

Order per `.opencode/agents/devops-mentor.md:108-119`. Exact error text goes into "What tripped me up".

## 5. Knowledge check (learner-answerable; answers not supplied)

1. How does describing *desired state* differ from scripting *steps*, and what does a script/console fail to give you?
2. Difference between a declared version constraint and what `.terraform.lock.hcl` records — and why it matters?
3. A merge request changes only the lock file — what do you check, and who carries the risk?
4. How does the AWS provider decide which credentials to use, and how would you prove which identity a `plan` uses?
5. Quote the plan annotation that signals replacement vs in-place; what if it appeared unexpectedly?
6. Why set tags at the provider level, and when would you still tag a resource directly?
7. After `destroy`, what cloud-side check proves the resource is gone, and why is Terraform's own output not enough?
8. Symptoms of an expired interactive sign-in; plan for verifying the OS you do not own; what your static-key scan looks for and cannot catch.

## 6. What could not be verified (no sandbox), and handoff to the Technical Reviewer

### Dependency / open trainer decisions (raise, do not guess)
- **`versions.env` is now present at the repo root** (`TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0`, `GOOGLE_PROVIDER_VERSION=8.7.0`, `AZURERM_PROVIDER_VERSION=5.9.0`), so it no longer blocks the DoD-01 version pin. Read the pin from it; do not hard-code a version.
- Trainer decisions from `brief.md:74-79`: how the non-owned OS is verified; which caller-identity fields to redact; whether the sandbox permits creating an `aws_ssm_parameter`; expected write-up depth.

### Facts that cannot be asserted here
No AWS sandbox and no learner build yet: connectivity, caller identity, SSO behaviour, successful `init`/`plan`/`apply`/`destroy`, the pinned version, cloud-side absence, and real cost are all unverifiable. Nothing was invented.

### Handoff to the Technical Reviewer (mentor does not self-approve)
Provide: learner `write-up.md` (Status = "In review") + GitLab repo/branch link; the three files and plan-review note; DoD-01…07 evidence (redacted); clean-up gate confirmation; trainer confirmations for DoD-05 classifications and the OS-coverage method. Review against `README.md:97-114` (accept at ≥70 total, deliverable works, every DoD met and evidenced, clean-up gate clean).
