# M01 — Getting Started with Terraform — Write-up

> This write-up is meant to become part of the content library: write it so the next cohort could learn from it, not just as a record of what you did. Copy this file to `write-up.md` in this folder and fill in the copy; leave this template untouched. Write each section as you build, not after it works. Never paste credentials, tokens or key material anywhere in this file.

| | |
| --- | --- |
| Trainee | Romeo |
| Status | Draft <!-- Draft → In review → Revising → Accepted --> |
| Build location | <!-- TODO: GitLab repository and branch or merge request holding your Terraform code --> |
| Hours spent | 1 |

## What I built

I set up my own workstation and built a three-file Terraform configuration that manages one simple AWS resource — an SSM parameter — and took it through the full lifecycle: create, in-place update, destroy.

- `versions.tf` — the `terraform` block: the minimum Terraform version and the required AWS provider with its version constraint. No infrastructure in this file.
- `providers.tf` — the AWS provider for my sandbox region, with a `default_tags` block so every resource inherits the same tags.
- `main.tf` — a single `aws_ssm_parameter` (a `String` parameter with a placeholder value).
- `.gitignore` — keeps local state and the `.terraform/` cache out of version control while letting `.terraform.lock.hcl` be committed.

```
<working folder>/
  versions.tf       provider requirements (no infrastructure)
  providers.tf      AWS provider + default_tags
  main.tf           one aws_ssm_parameter
  .gitignore        ignores terraform.tfstate* and .terraform/ ; keeps the lock file
  write-up.md       this file
```

The workstation side: Terraform installed through a version manager, the AWS CLI, VS Code with the HashiCorp Terraform extension, and sign-in to AWS through IAM Identity Center — no access keys on disk anywhere.

The layout keeps one concern per file, so anyone reading it can see immediately where requirements, provider configuration and resources live.

## Why it's built this way (key decisions)

> Research-prompt answers. Every entry says what I considered, what I chose, why, and what I gave up.

**What problem Terraform solves that a script or the cloud console does not, and where I would not use it.** A script records the steps, so re-running it means I have to write the "does it already exist?" handling myself, and a script that half-failed leaves the system in a state nobody can see without reading the script. The cloud console does each step by hand and leaves no reviewable record — nothing I can diff, review or roll back. Terraform is declarative: I describe the end state I want and it works out what must change and in what order, and the plan shows the difference before anything happens. I would *not* reach for it on a one-off, throwaway task (the state file and plan/apply cycle cost more than the task), or where some other system already owns the state and would fight mine. Desired state versus scripted steps is the difference between saying "this is how it should be" and saying "this is what to do" — the first is checkable, the second is only ever as correct as the day you wrote it.

**Which install method for each tool, and what each choice costs.** I used a version manager for Terraform (`tfenv`, with `asdf` as the equivalent) because it installs an exact build and lets me switch, which is what "the version you pinned" means in practice — a plain install (`brew install terraform`, an MSI) gives whatever is current and drifts whenever you upgrade. The version manager costs an extra tool to install and itself depends on Git; a plain install is simpler but hands the version choice to Homebrew's release cadence. For the AWS CLI and VS Code I used the per-OS installers (`brew install awscli` on macOS, the MSI on Windows) — CLI version differences rarely affect this stage, so the maintenance cost of pinning it is not worth paying. On Windows the differences that bite are shell and path behaviour: both `tfenv` and `asdf` assume a POSIX shell, so on native Windows they need Git Bash or WSL, and in plain PowerShell neither works as documented — that is the honest "where neither does" note for my notes. CRLF line endings and execution policy for scripts are the other Windows-only trip hazards; on macOS it is usually `PATH`/Homebrew shims.

**How a version manager keeps Terraform at the version I pinned.** The manager holds many installed versions and shims the `terraform` binary to whichever one is active; `tfenv use 1.16.5` (or a `.terraform-version` file in the project folder) selects it, so every `terraform` invocation in that folder runs that exact build. The pin in `versions.env` is the source of truth (ADR-010), and the version manager is how the machine honours it. What I gave up: the simplicity of a single always-current binary.

**How I proved I am connected to AWS without static keys.** I signed in through IAM Identity Center (`aws configure sso` once, then `aws sso login`) and ran `aws sts get-caller-identity` — it returns the account and ARN of the identity the session is actually using. The login produces a short-lived cached token, not an access key, so there is no AKIA… key on disk to leak or rotate. Evidence: see DoD-01 below.

**What a scan for static keys has to look at, and what it can miss.** It has to cover the working tree *and* the git history — a key committed and later deleted still lives in history — plus the untracked files and the home directory's `~/.aws/` for stored credentials. What it looks for: the `AKIA`/`ASIA` access-key ID pattern, `aws_secret_access_key` assignments in any config format, `.pem`/`.key` private-key files, and AWS profiles in `~/.aws/credentials`. What it cannot catch: a secret that does not match any pattern (a token pasted as an opaque string), secrets split or encoded, anything outside the paths you scanned, and — by design — SSO session tokens, which are short-lived and expected. Evidence: see DoD-02.

**What Terraform downloads at `init`, where it puts it, and the constraint-versus-lock-file distinction.** `terraform init` reads `versions.tf`, resolves the constraint against the registry, and downloads the provider plugin binary for my platform into `.terraform/providers/` — a cache, gitignored — then writes `.terraform.lock.hcl`. The distinction I have to keep straight: the constraint in `versions.tf` says *which versions are acceptable*; the lock file records *the exact version and checksums that were actually chosen*. The constraint is policy, the lock file is history.

**How loose or tight a constraint should be, and who carries the risk.** A loose constraint (`~> 6.0`) gets fixes without me doing anything, but a future `init` on a clean machine can select a newer build than the one I tested — the risk sits with whoever runs it next. An exact pin (`= 6.68.0`) makes every run identical but makes upgrades a deliberate, forgotten-until-broken chore — the risk sits with me. I chose a compatible-range constraint aligned with the pin in `versions.env`, because the lock file is what actually guarantees a given run's reproducibility, and I accepted that keeping the lock file committed is the deal that makes the loose constraint safe. Exact pins belong in `versions.env`, not hard-coded in `versions.tf`.

**What a reviewer should check in a merge request that changes the lock file.** Why it changed (is this the intended upgrade?), that the new version matches the constraint, that the checksums come from the trusted registry, and that no platform entries or providers were silently swapped — a lock-file diff is exactly where a supply-chain change would hide. I also check that the `.terraform/` directory was *not* committed alongside it.

**How the AWS provider decides which credentials to use, and how I prove which identity a plan is using.** The provider walks its standard credential chain — environment variables, then the shared config/profile (which is where the IAM Identity Center cache from `aws sso login` lives), and so on. I prove the identity by running `aws sts get-caller-identity` in the same shell I run Terraform from, so the CLI session and the provider are reading the same profile; I don't assume, I check the account and ARN. What I gave up: convenience of static env-var keys — which is the point.

**Why tags go on the provider, and when I would tag a resource individually.** `default_tags` puts tagging in exactly one place: a tag changed there is applied to every managed resource consistently, and nothing can be forgotten. I would still tag an individual resource when the value is specific to it — a per-resource `Name`, for example — which is why `main.tf` carries its own `Name` tag alongside the inherited defaults. The trade-off: two places to look when auditing tags.

**Which parts of a resource I set and which Terraform reports back.** I set the arguments: `name`, `type`, `value`, `tags`. Terraform reports the computed attributes — `arn`, `version`, and any other provider-derived value. Knowing which is which matters because a computed attribute is not something I can "fix" in the file.

**What I check in a plan before approving it, and how I can tell from the plan alone what a change will do.** I check the action symbols first (`+` create, `~` in-place update, `-` destroy, `-/+` replacement), then the attribute-level diff, then that the default tags are attached, then that no resource I did not mean to touch appears. The plan's own annotations are the answer to "what will this do" — I never infer it from my memory of the file. **If a plan showed a destroy I did not expect, I stop and do not approve it.** I would find the cause — a removed block, a changed argument that forces replacement, a name change — and either revert my edit or, later in the course, refactor it safely. Approving a plan I cannot explain is how resources get deleted.

**Which changes update in place and which force replacement, and how sure I am.** Changing `value` on my parameter is an in-place update (`~`) — AWS rewrites the value on the existing parameter; I am sure because the plan showed the `~` with a value diff and nothing else. Changing something that defines the resource's identity — its `name` — forces replacement (`-/+`), because Terraform has to delete and recreate it. I am only ever "sure" from the plan annotation itself, not from my expectation; the plan is the evidence. **What a replacement costs when a resource holds data or others depend on it:** the old resource is destroyed first, so its data is gone and anything referencing it momentarily breaks — in later stages (state, refactoring) that is exactly the cost I design around; here my parameter is standalone, so replacement would be cheap, and I still never approve one I didn't ask for.

**How I confirm from the cloud side that everything is gone.** Not from Terraform's "Destroy complete!" alone: I query AWS directly — `aws ssm get-parameter --name <name>` must fail with a not-found error (and the console shows nothing in that account and region). Terraform's word is the claim; the cloud-side query is the proof.

**Where I spent the most time, and why.** _TODO (Romeo): confirm this against your own run — as written for a one-hour build:_ the workstation sign-in and proof steps — getting IAM Identity Center configured and trusting that the no-keys path really was connected — and then reading the first plan carefully rather than skim-pasting it. Both are the habits the rest of the course leans on, so the time went into setup I never have to repeat.

## AI collaboration log

- **Tools and portion:** I used an AI assistant (Opencode) to create an example template of a Terraform module, which I then worked from to understand the concept before building this stage's configuration. The stage's three files are mine; the example was a learning starting point, not the deliverable.
- **Concrete ask:** "Create an example template of a Terraform module so I can understand the structure and concepts before I start M01."
- **Wrong suggestion / what didn't fit:** _TODO (Romeo): add one specific moment — e.g. a suggestion you rejected while setting up `versions.tf`, the sign-in, or the plan reading — what was wrong, how you noticed, what you did instead. The rubric requires this._
- **What I accepted as-is vs rewrote:** _TODO (Romeo): one or two lines — what you kept from the example, what you rewrote for your own build._

## How to build it (teach it to the next engineer)

Assume you have done none of this before and are starting from an empty folder. The order matters: workstation first (you cannot `init` without a session), dependencies before resources (a resource whose provider is undeclared fails at `init`, which is a clean early error, not a confusing late one), plan before every apply, destroy last.

**1. Workstation (no code yet).**

- macOS: `brew install tfenv`, then `tfenv install 1.16.5 && tfenv use 1.16.5`. Verify with `terraform -version`.
- Windows: `tfenv` and `asdf` both need a POSIX shell — use Git Bash (or WSL). In plain PowerShell neither works; that is worth a note in your own notes rather than a workaround.
- AWS CLI: macOS `brew install awscli`; Windows: the MSI installer. VS Code: installer plus the **HashiCorp Terraform** extension.
- Sign in with no static keys: `aws configure sso` (start URL, region, account, role from your sandbox invitation), then `aws sso login`.
- Prove it: `aws sts get-caller-identity` and `terraform -version`. Nothing here creates a key file.

**2. `versions.tf` — dependencies.** Write the `terraform` block: `required_version` and a `required_providers` block for `hashicorp/aws` with a version constraint aligned to the pin in `versions.env`. Run `terraform init` and watch `.terraform/` and `.terraform.lock.hcl` appear. Commit the lock file; leave `.terraform/` out (`.gitignore`).

**3. `providers.tf` — configuration.** Add the AWS provider with your sandbox `region` and a `default_tags` block. Run `terraform fmt`, then `terraform validate` — cheap checks to run on a small file, before `main.tf` makes errors harder to locate.

**4. `main.tf` — resource and plan.** Add one `aws_ssm_parameter` (String, a placeholder value, plus a resource-specific `Name` tag). Run `terraform plan`. Read it: confirm the default tags from step 3 appear on the resource, and identify the action (`+` create).

**5. Apply and destroy.** `terraform apply` after reading the plan. Change exactly one attribute (`value`), run `terraform plan`, and confirm the `~` in-place update with its attribute diff. `terraform apply` again. Check what this resource bills (it is effectively free, but the habit is the point). Then `terraform destroy` — and confirm absence from the cloud side: `aws ssm get-parameter --name <name>` must fail with not-found.

Two commands worth making reflex: `terraform fmt` before every commit, and reading the plan before *every* apply — including the ones you expect.

## Concepts worth explaining

- **Declarative vs imperative (Step 1).** Declarative is stating the destination: "this parameter exists with this value." Terraform figures out the route from what's actually there to what I declared. Imperative is stating the route: "create this, then that" — and I own every "already exists" branch, every partial-failure recovery. The plan is only possible because Terraform knows the destination independently of how it gets there.
- **Constraint vs lock file (Step 2).** The constraint in `versions.tf` is a *range of acceptable versions* — it expresses intent for the future. The lock file is *what was actually chosen once* — exact version plus checksums, written by `init`. The constraint can be satisfied by different builds on different days; the lock file makes every machine agree on one build until someone deliberately changes it. Flexible intent, recorded fact.
- **In-place update vs replacement (Step 5).** The plan's annotation decides it: `~` mutates the existing object, `-/+` destroys it and creates a new one. In-place keeps identity and data; replacement loses them — anything referencing the old resource breaks while it is recreated. So the habit is: read the symbol, and never approve a `-/+` you did not ask for.

## What tripped me up

- The build itself ran clean — **the create showed no error**; `apply` completed on the first attempt with nothing to paste here. _TODO (Romeo): if the end-to-end run (DoD-07) or the sign-in/setup phase produced a real error, add it here with the exact error text, its cause and the fix — this section feeds the course's common-errors list, and a clean run is honest but thin._

## Checkpoint evidence

> Evidence slots pending paste. Each entry gives the exact command to run and what to trim/redact. Never paste credentials; redact account details as the trainer directs.

- **DoD-01 —** Version switch and identity. Run: `tfenv install 1.16.5 && tfenv use 1.16.5 && terraform -version`, then `tfenv use <other version> && terraform -version`, then `aws sts get-caller-identity`. Paste both outputs trimmed to the relevant lines, redacting the account number and ARN as the trainer directs. **Evidence: pending paste.**
- **DoD-02 —** Static-key scan. Run over the working tree, the repository history and disk, e.g. `git grep -nE 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key' -- .`, `git log -p | grep -nE 'AKIA[0-9A-Z]{16}'`, and a scan of `~/.aws/` and any `*.pem`/`*.key` files. Paste the command and result (empty is a result), plus one line on what it looked for — see "key decisions" above for what it can miss. **Evidence: pending paste.**
- **DoD-03 —** `terraform init` artefacts. Run: `ls -la` (or `find . -maxdepth 2`) showing `.terraform/` and `.terraform.lock.hcl`; `git show --stat <commit>` showing the lock file committed. Paste both; the own-words explanation of what the lock file recorded is under "key decisions". **Evidence: pending paste.**
- **DoD-04 —** Format and validation. Run: `terraform fmt -check -diff` and `terraform validate`. Paste both outputs (no errors, exit 0). **Evidence: pending paste.**
- **DoD-05 —** Plan with default tags, plus plan-review note. Run: `terraform plan` and paste the portion showing the resource with its tags. **Plan-review note (classification of every change I made):** initial `terraform plan` → **create** (`+`); the one-attribute `value` change → **in-place update** (`~`); **replacement** (`-/+`) → none made in this stage (a `name` change would force one; see "key decisions"). Trainer to confirm each classification on review. **Evidence: plan output pending paste.**
- **DoD-06 —** In-place update proven, and cloud-side destroy proof. Run `terraform plan` after the `value` change and paste the `~` in-place update; after `terraform destroy`, run `aws ssm get-parameter --name <name>` and paste the not-found error (this is the cloud-side confirmation, not Terraform's output). **Evidence: pending paste.**
- **DoD-07 —** The write-up followed end to end from a clean state by a first-time learner. Coverage note: commands are named for macOS and Windows throughout "How to build it"; _TODO (Romeo): note how the OS you do not own will be verified (per brief's "Still open" list)_. Verification run itself pending. **Evidence: pending.**

## Definition-of-done self-assessment

Scored honestly against `brief.md`'s DoD bullets and the rubric in `README.md` while evidence is still being pasted:

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Partly met | Version switch and caller-identity run; output not yet pasted here |
| DoD-02 | Partly met | Scan approach written; command output not yet pasted |
| DoD-03 | Partly met | Files and lock-file rationale in place; `init` artefact and commit proof pending paste |
| DoD-04 | Partly met | fmt/validate run; output not yet pasted |
| DoD-05 | Partly met | Plan-review note written (create / in-place / no replacement); plan output pending paste |
| DoD-06 | Partly met | Classification written; plan and cloud-side not-found outputs pending paste |
| DoD-07 | Not met yet | Needs the clean end-to-end run-through following this write-up verbatim |

**Rubric self-rating (provisional, Draft):** Deliverable/DoD — Satisfactory pending evidence; configuration quality — on track (pinned, lock committed, no static credentials); design decisions — written; how-to-build — written but not yet re-followed; concepts/obstacles/AI log — obstacles thin, AI log has open TODOs; understanding — to be confirmed at review.

**Parts I would struggle to explain cold:** the exact credential-chain order the AWS provider uses, and the precise set of attributes that force replacement on `aws_ssm_parameter` — both to be re-read before review.

**Overall: Draft — not ready for review.** Blockers: paste evidence for DoD-01 through DoD-06, complete the three AI-log TODOs, confirm "where I spent the most time", then run the DoD-07 end-to-end pass and set Status to "In review".

## What I'd do differently

Capture evidence *as* each step happens — paste the version output right after the switch, the plan right after `plan` — instead of reconstructing at the end. Evidence written down during the build is both faster and more trustworthy, and it would have.
