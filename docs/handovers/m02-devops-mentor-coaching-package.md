# M02 — DevOps Mentor Coaching Package

> **Trainer/agent material. Not trainee-facing.** Companion to [m02-managing-terraform-state-handover.md](m02-managing-terraform-state-handover.md). Produced from the Curriculum Architect → DevOps Mentor handover. Follows the teaching sequence in `.opencode/agents/devops-mentor.md:14-26`; the mentor does not mark the stage complete and submits evidence for independent review (`devops-mentor.md:105-106`).
>
> **Leak control:** none of the six research prompts in `modules/m02-managing-terraform-state/brief.md:13-18` are answered here. Sensitive items are marked `Sensitive — answer belongs in the write-up (research prompt N)`. The learner resolves them alone.

## 0. Prerequisite gate (BLOCKING — resolve before any build)

| Gate | Status at handover | Action |
|---|---|---|
| **M01 accepted** (`tasks.md:11`, handover §6) | **NOT met.** `modules/m01-getting-started-with-terraform/` holds only `brief.md`, `tasks.md`, `write-up-template.md` — no `write-up.md`, no learner build. | Confirm M01 complete, accepted and clean-up gate clean **before starting M02**. |
| AWS sandbox via IAM Identity Center (ADR-005) | Assumed; unverifiable here | Live dependency on the sandbox owner. |
| **Sandbox role can create + delete the lock object** (`brief.md:30-31`, ADR-006) | **Unverified** | Pre-flight probe (E3). If denied: **escalate — do not work around.** |
| Terraform ≥ 1.11 | **Met by pin** — `versions.env`: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0` | Read the pin from `versions.env`; do not hard-code. |

**Focused question to the learner (one, per `devops-mentor.md:131`):** has M01 been reviewed and accepted, and is its clean-up gate confirmed clean? If not, stop.

## 1. Coaching plan (mapped to scope topics / lab steps / `tasks.md`)

### Coverage matrix

| # | Scope topic (`brief.md:13-18`) | Lab step (`brief.md:44-48`) | `tasks.md` | DoD |
|---|---|---|---|---|
| 1 | Understanding and inspecting local state (read-only) | Steps 1–2 | B01 | DoD-01, DoD-06(part) |
| 2 | Secrets and state | Step 2 | B02 | DoD-02 |
| 3 | Why state moves to a remote backend | Step 4 rationale | B03 | write-up |
| 4 | Bootstrapping and securing the state bucket | Step 3 | B04 | DoD-04 |
| 5 | Configuring the backend and migrating existing local state | Step 4 | B05 | DoD-03 |
| 6 | Native state locking | Step 5 | B06 | DoD-05 |
| — | Deliverable: bucket + migrated config | Steps 3–4 | B07 | DoD-03/04 |
| — | Locking demonstrated | Step 5 | B08 | DoD-05 |

### Phases

- **Phase 0 — Setup (Setup 1–3):** read brief + `README.md:80-91`; copy `write-up-template.md` → `write-up.md`; confirm M01 accepted + tools/access; read the pin from `versions.env`; complete the prerequisite gate.
- **Phase 1 — Local state, read-only (B01 · Lab 1–2 · E1–E5):** small config (one `aws_ssm_parameter`, placeholder password), init, apply, watch `terraform.tfstate`; inspect with `state list`/`state show`; **read-only only**; add `terraform.tfstate*` to `.gitignore`.
- **Phase 2 — Secrets and state (B02 · E6–E7):** locate where the placeholder sits in the learner's own file; **placeholder only, never a real credential**.
- **Phase 3 — Why remote (B03 · E8):** reconnaissance on the learner's own setup, not a doc reading.
- **Phase 4 — Bootstrap & secure the bucket (B04 · Lab 3 · E9–E12):** look up billing first (`README.md:88`, ADR-011); separate folder; `aws_s3_bucket` + versioning + encryption + public-access block; apply with **local state**; this folder is **never destroyed**.
- **Phase 5 — Backend + migration (B05 · Lab 4 · E13–E16):** add `backend "s3"` to the *first* config (bucket, native locking, no DynamoDB); `terraform init -migrate-state`; `terraform plan` → capture no-change.
- **Phase 6 — Native locking (B06 · Lab 5 · E17–E20):** two-terminal demonstration; paste the lock error; reconcile claims against **1.16.5** release notes.
- **Phase 7 — Deliverable assembly (B07, B08):** bucket + migrated config + lock demo; code in the learner's own GitLab repo, linked from the write-up header.
- **Phase 8 — Verify (V01–V07 = DoD-01…07):** see §3.
- **Phase 9 — Write-up (W01–W10):** fill as they build; set Status → "In review".

## 2. Focused exercises + escalating hints

> **Explicit leak statement:** all six research-prompt answers are withheld. No exercise names, confirms or eliminates a mechanism, option or reason the learner must reach alone. Answers appear only in the learner's write-up.

**Phase 1 — Local state (read-only)**
- **E1 — Reproduce Step 1.** Config exactly as `brief.md:44`; `init` + `apply`; capture `pwd` + `ls -la` showing `terraform.tfstate`.
- **E2 — Read-only inspection.** `terraform state list` and `terraform state show` on the parameter; paste both; record which fields `show` reports that the config never wrote. `show` is read-only.
- **E3 — Pre-flight sandbox capability probe.** Confirm the role can create **and delete** an object under the bucket's lock key. If denied → **trainer (sandbox gap)**, never a workaround.
- **E4 — State hygiene baseline (DoD-06 partial).** Add `terraform.tfstate*` to `.gitignore`; prove with `git status` + `git check-ignore -v`.
- **E5 — Research prompt 1 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 1).* Process only: compare `show` output against the cloud-side resource read-only; record differences. Do not conclude the effect of a hand-edited state file.

**Phase 2 — Secrets and state**
- **E6 — Locate the placeholder (DoD-02).** Open the file; find where the placeholder sits; paste only the relevant lines.
- **E7 — Research prompt 2 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 2).* Process only: record what you observed and what a scan of your own file would/would not catch. Do not state what leaks a secret into state or why state is sensitive.

**Phase 3 — Why remote**
- **E8 — Research prompt 3 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 3).* Process only: enumerate what sits on your own machine now and who can reach it; re-examine after migration. Do not enumerate what a remote backend gives a team.

**Phase 4 — Bootstrap & secure the bucket**
- **E9 — Cost before create (README:88, ADR-011).** Look up billing on AWS's public pricing pages; write your **own** estimate. No billing APIs.
- **E10 — Build the bucket in its own folder (Step 3, DoD-04).** Globally-unique name; versioning, encryption, public-access block; `fmt` + `validate` before apply; **local state**. (`default tags` is optional course style, not a step or DoD requirement.)
- **E11 — Protect the kept resource.** This folder's state stays local and this folder is **not** destroyed at clean-up.
- **E12 — Research prompt 4 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 4).* Process only: document the sequence you used, who/what needed access, and the access you gave. Do not state the chicken-and-egg reasoning, the team alternative, the access actions the lock object requires, or the risk of keeping the bucket.

**Phase 5 — Backend config + migration (highest-risk step)**
- **E13 — Migrate, don't recreate.** Add `backend "s3"` (bucket, native locking, no DynamoDB); `terraform init -migrate-state`; answer the prompt; capture output. Checkpoint: `state list` still lists your resource.
- **E14 — Prove no change (DoD-03).** `terraform plan` → capture no-change; paste `state list` before vs after.
- **E15 — State object listing (DoD-03).** List the bucket cloud-side; paste the state object at your key. The listing is independent evidence.
- **E16 — Research prompt 5 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 5).* Process only: capture the plan. If any change appears, **stop, do not apply, capture exact text, raise with trainer**. Do not state why a no-change plan is the proof.

**Phase 6 — Native locking**
- **E17 — Two-terminal demonstration (Step 5, DoD-05).** Terminal 1: start `terraform apply`, hold at the approval prompt. Terminal 2: `terraform plan`; capture the **lock error verbatim**.
- **E18 — No DynamoDB (constraint).** Show cloud-side that no table was created/used for this stage.
- **E19 — Reconcile against the pin.** Re-read the **1.16.5** release notes; confirm each locking statement matches that version.
- **E20 — Research prompt 6 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 6).* Process only: record what you observed in E17. Do not state what locking prevents or does not.

## 3. Verification instructions and exact evidence (DoD-01…DoD-07)

All AWS queries are **cloud-side and read-only**. Redact account IDs/ARNs. Paste output trimmed to relevant lines.

| DoD | Run (read-only) | Paste / capture | Acceptance | Caveat |
|---|---|---|---|---|
| **DoD-01** | `pwd`; `ls -la terraform.tfstate`; `terraform state list`; `terraform state show <parameter address>` | State path; `list`; `show` | From the learner's **own** state, read-only | Inspection only; do not modify |
| **DoD-02** | `terraform state show <parameter>` + open `terraform.tfstate` | Lines holding the **placeholder** | Sensitive value captured; real credential never present | Placeholder only; redact the rest |
| **DoD-03** | `terraform init -migrate-state` (once); `state list` before/after; `terraform plan`; `aws s3 ls s3://<bucket>/ --recursive` | Migration output; identical `list`; plan **No changes**; bucket listing at the configured key | State object exists **and** nothing recreated | Plan alone insufficient — listing is independent |
| **DoD-04** | `aws s3api get-bucket-versioning`; `get-bucket-encryption`; `get-public-access-block` | Versioning `Enabled`; encryption rule; all four flags `true` | **Cloud side**, not the config | Config is not evidence |
| **DoD-05** | backend block; T1: `terraform apply` held at approval; T2: `terraform plan`; (optional) `aws dynamodb list-tables` | Block with `use_lockfile = true` and **no** `dynamodb_table`; lock error verbatim; table list (may show unrelated tables in a shared account) | Backend config (no table referenced) is the **deciding** evidence; denial demonstrated | `list-tables` is account/region-wide — not stage-specific; reconcile against 1.16.5 notes (E19) |
| **DoD-06** | `aws s3 ls`; `aws ssm get-parameter --name <name>`; `git check-ignore -v terraform.tfstate`; `git log --oneline --all -- '*.tfstate'`; static-key/state-content scan (`rg -n --hidden 'AKIA[0-9A-Z]{16}'` and `git grep -n -E '"version" *: *4|"serial"|terraform.tfstate' $(git rev-list --all)`); `git status` | Bucket listed (retained); `ParameterNotFound`; ignore matched; empty state history; no access-key pattern and no state-like content in history; clean tree | Bucket alone retained; nothing else running; no state/keys committed | Bucket is the **only** allowance (`brief.md:22`); the scan is the standing control carried from M01 DoD-02 |
| **DoD-07** | Follow the learner's own "How to build it" end-to-end from a **clean state** | Dated run-through notes + corrections | A first-timer goes local state → protected remote backend with locking, unaided | Only the learner can produce this |

**Clean-up gate (`README.md:111`):** run `destroy` in the **first config only** (parameter destroyed, bucket stays). **Do not** destroy the bucket folder. Confirm cloud-side.

## 4. Troubleshooting map

Process-level diagnostics only; sensitive causes are never stated.

| Symptom | Process-level diagnostic | Smallest fix / where to look |
|---|---|---|
| `ExpiredToken` / SSO expired (ADR-005) | `aws sts get-caller-identity` fails the same way | Re-login (`aws sso login`); re-check identity |
| `No valid credential sources found` | `aws sts get-caller-identity`; check `AWS_PROFILE` | Correct profile; **never** create a static key |
| `state show`/`list` returns nothing | Confirm you're in the config directory that owns the state | `pwd`; run from the migrated config's directory |
| `.tfstate` appears in `git status` | Check `.gitignore` and staging | Add ignore rule; `git rm --cached` if staged |
| **A value appears in your state file** | Capture the exact line; record in the write-up | **Sensitive — answer belongs in the write-up (research prompt 2)** |
| **Unsure whether to trust a state file** | Compare `show` with the cloud-side resource, read-only | **Sensitive — answer belongs in the write-up (research prompt 1)** |
| `Error: Backend initialization required…` | The block changed; re-init needed | Run `terraform init` (`-migrate-state` for the move) |
| `init` says state object exists / asks about a key | Read the prompt; configured key collides | Choose a distinct key; **do not** recreate resources |
| **`plan` after migration shows a change** | Read the plan annotation beside the changed attribute | **Sensitive — answer belongs in the write-up (research prompt 5)**; then stop, do not apply, capture, raise with trainer |
| `AccessDenied` on a state/lock object request | Error names the denied action/ARN | Check bucket/key; if the role is the limit → **trainer (sandbox gap)** |
| **Lock object put/delete denied** | Error names the denied action under the lock key | **Escalate (`brief.md:30-31`); do not work around** |
| `Error acquiring the state lock` **unexpectedly** | Confirm no `terraform` process is running in any terminal you own | **Sensitive — answer belongs in the write-up (research prompt 6)**. Recovering a lock left behind is **out of scope** (`brief.md:32`) → trainer |
| DynamoDB-related error/table referenced | Compare the backend block against the constraints | Remove any DynamoDB setting; block must match `brief.md:27` |
| `NoSuchBucket` / wrong endpoint | Bucket name/region in the backend block vs `aws s3 ls` | Correct name/region; re-run `init` |
| Bucket accidentally targeted by `destroy` | Check which folder/state you are in | Stop; only the **first config** is destroyed |
| Resource still present after clean-up | Cloud-side query vs Terraform output | Re-run `destroy` in the **first** config only; reconfirm |

Exact error text goes into the write-up's **"What tripped me up"** (`tasks.md:41`).

## 5. Knowledge check (learner-answerable; mentor supplies no answers)

1. Where does your local state live, and which command lists tracked resources **without changing anything**?
2. Before migrating, what is your go/no-go check, and what do you capture to prove it afterwards? *(Reasoning → write-up, research prompt 5.)*
3. How do you show **cloud-side** that versioning/encryption/public-access blocking are on — and why is the config not enough?
4. Which Terraform version is pinned, and how do you reconcile a locking claim against that version's notes rather than memory?
5. What must your sandbox role be able to do for the locking demonstration, and what is the correct response if it cannot?
6. In the two-terminal demonstration, which operation holds, which is refused, and what evidence do you paste? *(What it prevents / does not → write-up, research prompt 6.)*
7. After clean-up, what is the **one** thing that remains, and what cloud-side query proves everything else is gone?
8. What would you check before trusting a state file you did not create? *(Answer → write-up, research prompt 1.)*

## 6. What could NOT be verified (no sandbox) + handoff to the Technical Reviewer

### Unverified — nothing was invented
No AWS sandbox and **no learner build** (M01 has no `write-up.md`/repo). Unverified: SSO sign-in and identity; sandbox role lock-object permission (E3); bucket creation and protections (DoD-04); `-migrate-state` success, state object existence, no-change plan (DoD-03); the lock error (DoD-05); absence of DynamoDB; real cost; cloud-side absence and the DoD-07 run-through; `versions.env` behaviour beyond the declared pins.

### Open trainer decisions (`brief.md:70-73`)
Whether the sandbox role can create **and** delete the lock object; expected length/depth of the notes.

### Handoff package to the Technical Reviewer (mentor does **not** self-approve)
1. Learner `write-up.md` (Status = "In review") + GitLab repo/branch link.
2. The two configurations (migrated + bucket) and the `.gitignore` rule.
3. DoD-01…07 evidence, redacted.
4. Clean-up-gate confirmation: no stored credential, no committed state file, nothing left running that the brief says to destroy — **the bucket is the sole retained resource**.
5. Trainer confirmations for the lock-object permission and notes-depth.

**Review against** `README.md:97-114`: accept at **≥70 total**, deliverable works, every DoD met and evidenced, clean-up gate clean.

**Focused question back to the trainer:** confirming M01 acceptance is the one blocking input before this package can proceed.
