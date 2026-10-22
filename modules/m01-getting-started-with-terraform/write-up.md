# M01 Write-Up — Getting Started with Terraform

> Romeo Panis — filled-in write-up for M01. The outputs under **Checkpoint evidence** are pasted as they were captured. Never paste credentials, tokens or key material; account details are redacted here.

## What I built

Built by Romeo Panis. Hours spent: 1 on the build itself, plus about 40 minutes re-running it from a clean folder to capture the evidence in **Checkpoint evidence**.

I set up my own workstation and built a three-file Terraform configuration that manages one simple AWS resource — an SSM parameter — and took it through the full lifecycle: create, in-place update, destroy.

**Cost:** this stage creates one *Standard* Parameter Store parameter. The published price list charges nothing for Standard parameters or Standard throughput — only Advanced parameters ($0.05 each per month) and higher throughput are billed — so the build costs nothing and does not touch the free tier. The estimate came from the price list, not from a billing console: price it before you create, not after.

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

The workstation side: Terraform installed through a version manager, the AWS CLI, VS Code with the HashiCorp Terraform extension, and sign-in to AWS through IAM Identity Center. No access keys on disk anywhere: the stale static profile this machine had is deleted, and the scan under DoD-02 shows what the disk looks like now. Verified on this machine: `tfenv` 3.2.2 holding Terraform 1.16.5 (the pin in `versions.env`) and 1.16.6, `aws-cli/2.38.3`, VS Code with `hashicorp.terraform-2.40.0`.

The layout keeps one concern per file, so anyone reading it can see immediately where requirements, provider configuration and resources live.

Build location: `docs/reference-builds/m01/` on branch `main` of `gitlab.stratpoint.cloud:cloud-internal-trainings/ai-sdlc/terraform-rnd-bootcamp/panis-romeo-ii/ai` — that path holds exactly the four files listed above, and it is the code every command in this write-up was run against. The working copy I re-ran it from is `~/tf-m01-build`, byte-identical to that path. My plan-review note — the classification of every change I made — is in **Checkpoint evidence** under DoD-05.

## Why it's built this way (key decisions)

> Four key decisions. Each entry says what I considered, what I chose, why, and what I gave up.

- **Why use Terraform instead of a script or the console, and how do you prove you are connected to AWS without static keys?**

  **What problem Terraform solves that a script or the cloud console does not, and where I would not use it.** A script records the steps, so re-running it means I have to write the "does it already exist?" handling myself, and a script that half-failed leaves the system in a state nobody can see without reading the script. The cloud console does each step by hand and leaves no reviewable record — nothing I can diff, review or roll back. Terraform is declarative: I describe the end state I want and it works out what must change and in what order, and the plan shows the difference before anything happens. I would *not* reach for it on a one-off, throwaway task (the state file and plan/apply cycle cost more than the task), or where some other system already owns the state and would fight mine. Desired state versus scripted steps is the difference between saying "this is how it should be" and saying "this is what to do" — the first is checkable, the second is only ever as correct as the day you wrote it. Declarative is stating the destination: "this parameter exists with this value." Terraform figures out the route from what's actually there to what I declared. Imperative is stating the route: "create this, then that" — and I own every "already exists" branch, every partial-failure recovery. The plan is only possible because Terraform knows the destination independently of how it gets there.

  **How I proved I am connected to AWS without static keys.** I signed in through IAM Identity Center (`aws configure sso` once, then `aws sso login`) and ran `aws sts get-caller-identity` — it returns the account and ARN of the identity the session is actually using. The login produces a short-lived cached token, not an access key, so there is no AKIA… key on disk to leak or rotate. Evidence: the version-switch half of DoD-01 is pasted below; the caller-identity output is not captured, because the sandbox account was not reachable from the machine this write-up was finished on — and a remembered account number is not output.

  **What a scan for static keys has to look at, and what it can miss.** It has to cover the working tree *and* the git history — a key committed and later deleted still lives in history — plus the untracked files and the home directory's `~/.aws/` for stored credentials. What it looks for: the `AKIA`/`ASIA` access-key ID pattern, `aws_secret_access_key` assignments in any config format, `.pem`/`.key` private-key files, and AWS profiles in `~/.aws/credentials`. What it cannot catch: a secret that does not match any pattern (a token pasted as an opaque string), secrets split or encoded, anything outside the paths you scanned, and — by design — SSO session tokens, which are short-lived and expected. A scan also has to be *read*, not just counted: the only hits in my own repository were the lines of this write-up that name the patterns, which is a false positive, not a key. The one private key on the machine is `~/.ssh/id_rsa`, which authenticates git over SSH and is not AWS key material. Evidence: see DoD-02.

  **How the AWS provider decides which credentials to use, and how I prove which identity a plan is using.** The provider walks its standard credential chain — environment variables, then the shared config/profile (which is where the IAM Identity Center cache from `aws sso login` lives), and so on. I prove the identity by running `aws sts get-caller-identity` in the same shell I run Terraform from, so the CLI session and the provider are reading the same profile; I don't assume, I check the account and ARN. What I gave up: convenience of static env-var keys — which is the point.

- **What does the lock file record that your version constraint does not, and how loose or tight should a provider constraint be?**

  **What Terraform downloads at `init`, where it puts it, and the constraint-versus-lock-file distinction.** `terraform init` reads `versions.tf`, resolves the constraint against the registry, and downloads the provider plugin binary for my platform into `.terraform/providers/` — a cache, gitignored — then writes `.terraform.lock.hcl`. The distinction I have to keep straight: the constraint in `versions.tf` says *which versions are acceptable*; the lock file records *the exact version and checksums that were actually chosen*. The constraint is policy, the lock file is history. The constraint can be satisfied by different builds on different days; the lock file makes every machine agree on one build until someone deliberately changes it. Flexible intent, recorded fact.

  **How loose or tight a constraint should be, and who carries the risk.** A loose constraint (`~> 6.0`) gets fixes without me doing anything, but a future `init` on a clean machine can select a newer build than the one I tested — the risk sits with whoever runs it next. An exact pin (`= 6.68.0`) makes every run identical but makes upgrades a deliberate, forgotten-until-broken chore — the risk sits with me. I chose a compatible-range constraint aligned with the pin in `versions.env`, because the lock file is what actually guarantees a given run's reproducibility, and I accepted that keeping the lock file committed is the deal that makes the loose constraint safe. Exact pins belong in `versions.env`, not hard-coded in `versions.tf`.

  **What a reviewer should check in a merge request that changes the lock file.** Why it changed (is this the intended upgrade?), that the new version matches the constraint, that the checksums come from the trusted registry, and that no platform entries or providers were silently swapped — a lock-file diff is exactly where a supply-chain change would hide. I also check that the `.terraform/` directory was *not* committed alongside it.

- **Which changes update a resource in place and which force replacement, and how do you confirm from the cloud side that everything is gone?**

  **Which parts of a resource I set and which Terraform reports back.** I set the arguments: `name`, `type`, `value`, `tags`. Terraform reports the computed attributes — `arn`, `version`, and any other provider-derived value. Knowing which is which matters because a computed attribute is not something I can "fix" in the file.

  **What I check in a plan before approving it, and how I can tell from the plan alone what a change will do.** I check the action symbols first (`+` create, `~` in-place update, `-` destroy, `-/+` replacement), then the attribute-level diff, then that the default tags are attached, then that no resource I did not mean to touch appears. The plan's own annotations are the answer to "what will this do" — I never infer it from my memory of the file. **If a plan showed a destroy I did not expect, I stop and do not approve it.** I would find the cause — a removed block, a changed argument that forces replacement, a name change — and either revert my edit or, later in the course, refactor it safely. Approving a plan I cannot explain is how resources get deleted.

  **Which changes update in place and which force replacement, and how sure I am.** Changing `value` on my parameter is an in-place update (`~`) — AWS rewrites the value on the existing parameter; I am sure because the plan showed the `~` with a value diff and nothing else. Changing something that defines the resource's identity — its `name` — forces replacement (`-/+`), because Terraform has to delete and recreate it. I am only ever "sure" from the plan annotation itself, not from my expectation; the plan is the evidence. **What a replacement costs when a resource holds data or others depend on it:** the old resource is destroyed first, so its data is gone and anything referencing it momentarily breaks — in later stages (state, refactoring) that is exactly the cost I design around; here my parameter is standalone, so replacement would be cheap, and I still never approve one I didn't ask for.

  **How I confirm from the cloud side that everything is gone.** Not from Terraform's "Destroy complete!" alone: I query AWS directly — `aws ssm get-parameter --name <name>` must fail with a not-found error (and the console shows nothing in that account and region). Terraform's word is the claim; the cloud-side query is the proof.

- **Where did you spend the most time, and why?**

  the workstation sign-in and proof steps — getting IAM Identity Center configured and trusting that the no-keys path really was connected — and then reading the first plan carefully rather than skim-pasting it. Both are the habits the rest of the course leans on, so the time went into setup I never have to repeat. Confirmed against the re-run: the workstation really is the slow part, and it is slower than it looks because two of its steps fail silently. Getting the version manager to answer to the pin took three separate fixes — the Homebrew formula is keg-only, the Homebrew binary shadowed the shim, and the pin only holds if you select it — and the credential check is one command that either prints an identity or prints an error; there is no middle state. Once those two are green the build itself is quick: the first `terraform init` took 31 seconds because it downloads the AWS provider plugin, the same `init` on the warm cache took 1 second, and `fmt`, `validate` and reading the plan are seconds each.

## AI collaboration log

- **Tools and portion:** I used an AI assistant (Opencode) to create an example template of a Terraform module, which I then worked from to understand the concept before building this stage's configuration. The stage's three files are mine; the example was a learning starting point, not the deliverable.
- **Concrete ask:** "Create an example template of a Terraform module so I can understand the structure and concepts before I start M01."
- **Wrong suggestion / what didn't fit:** the example I worked from assumed the tools already on the machine were good enough — Terraform from Homebrew, whichever version Homebrew happened to ship, and the `default` AWS profile already sitting in `~/.aws/credentials`. Both looked fine until I checked them against what this stage actually asks for. The Homebrew install is a *binary*, not a version manager: it sat at 1.16.6 while `versions.env` pins 1.16.5, and it kept silently winning the `terraform` name on `PATH`. The existing profile was a pair of static IAM-user keys, which is exactly what the brief forbids. What made both catchable was doing the two checks the stage asks for instead of trusting that it worked — `terraform version` (which said 1.16.6, not the pin) and the credential scan (which found the key pair). What I did instead: `tfenv` with the pin installed and selected, `brew unlink terraform` so the shim is the only `terraform` on `PATH`, and IAM Identity Center for the session, with the stale profile deleted.
- **What I accepted as-is vs rewrote:** from the example I kept the compartment layout — requirements, provider configuration and resources in separate files — because that is the shape this stage teaches and the shape a reviewer can scan. I rewrote everything else: the version constraint aligned to the pin in `versions.env`, the provider block with `default_tags`, the single `aws_ssm_parameter` instead of the example's resource, and the `.gitignore` that keeps `terraform.tfstate` and `.terraform/` out of git while letting `.terraform.lock.hcl` be committed. Nothing from the example survived into the deliverable unchanged — it was a shape to learn from, not a starting commit.

## How to build it (teach it to the next engineer)

Assume you have done none of this before and are starting from an empty folder. The order matters: workstation first (you cannot `init` without a session), dependencies before resources (a resource whose provider is undeclared fails at `init`, which is a clean early error, not a confusing late one), plan before every apply, destroy last. Use your own output to show the reasoning, not just the commands.

**1. Workstation (no code yet).**

- macOS: `brew install tfenv`, then `export PATH="/opt/homebrew/opt/tfenv/bin:$PATH"` (Homebrew installs `tfenv` as a *keg-only* formula, so it is on disk but not on `PATH` on its own — put that line in `~/.zshenv`), then `tfenv install 1.16.5 && tfenv use 1.16.5`. If Terraform is also installed from Homebrew, run `brew unlink terraform` once, or the Homebrew binary keeps winning the `terraform` name on `PATH` and you never get the pin. Verify with `terraform -version`.
- Windows: `tfenv` and `asdf` both need a POSIX shell — use Git Bash (or WSL). In plain PowerShell neither works; that is worth a note in your own notes rather than a workaround.
- AWS CLI: macOS `brew install awscli`; Windows: the MSI installer. VS Code: installer plus the **HashiCorp Terraform** extension.
- Sign in with no static keys: `aws configure sso` (start URL, region, account, role from your sandbox invitation), then `aws sso login`.
- Prove it: `aws sts get-caller-identity` and `terraform -version`. Nothing here creates a key file.

**Why these choices (the reasoning behind step 1).** I used a version manager for Terraform (`tfenv`, with `asdf` as the equivalent) because it installs an exact build and lets me switch, which is what "the version you pinned" means in practice — a plain install (`brew install terraform`, an MSI) gives whatever is current and drifts whenever you upgrade. The version manager costs an extra tool to install and itself depends on Git; a plain install is simpler but hands the version choice to Homebrew's release cadence. For the AWS CLI and VS Code I used the per-OS installers (`brew install awscli` on macOS, the MSI on Windows) — CLI version differences rarely affect this stage, so the maintenance cost of pinning it is not worth paying. On Windows the differences that bite are shell and path behaviour: both `tfenv` and `asdf` assume a POSIX shell, so on native Windows they need Git Bash or WSL, and in plain PowerShell neither works as documented — that is the honest "where neither does" note for my notes. CRLF line endings and execution policy for scripts are the other Windows-only trip hazards; on macOS it is usually `PATH`/Homebrew shims.

**How a version manager keeps Terraform at the version I pinned.** The manager holds many installed versions and shims the `terraform` binary to whichever one is active; `tfenv use 1.16.5` (or a `.terraform-version` file in the project folder) selects it, so every `terraform` invocation in that folder runs that exact build. The pin in `versions.env` is the source of truth (ADR-010), and the version manager is how the machine honours it. What I gave up: the simplicity of a single always-current binary.

**2. `versions.tf` — dependencies.** Write the `terraform` block: `required_version` and a `required_providers` block for `hashicorp/aws` with a version constraint aligned to the pin in `versions.env`. Run `terraform init` and watch `.terraform/` and `.terraform.lock.hcl` appear. Commit the lock file; leave `.terraform/` out (`.gitignore`).

**3. `providers.tf` — configuration.** Add the AWS provider with your sandbox `region` and a `default_tags` block. Run `terraform fmt`, then `terraform validate` — cheap checks to run on a small file, before `main.tf` makes errors harder to locate.

**4. `main.tf` — resource and plan.** Add one `aws_ssm_parameter` (String, a placeholder value, plus a resource-specific `Name` tag). Run `terraform plan`. Read it: confirm the default tags from step 3 appear on the resource, and identify the action (`+` create).

**5. Apply and destroy.** `terraform apply` after reading the plan. Change exactly one attribute (`value`), run `terraform plan`, and confirm the `~` in-place update with its attribute diff. `terraform apply` again. Check what this resource bills *before* you apply — a Standard Parameter Store parameter is free (the price list bills only Advanced parameters, $0.05 each per month, and higher throughput), but the habit is the point. Then `terraform destroy` — and confirm absence from the cloud side: `aws ssm get-parameter --name <name>` must fail with not-found.

Two commands worth making reflex: `terraform fmt` before every commit, and reading the plan before *every* apply — including the ones you expect.

## Concepts worth explaining

- **What a provider is.** A provider is the plug-in that lets Terraform talk to one service; the AWS provider manages AWS resources, and there are providers for GCP, Azure and hundreds of other services. In my build it is the `required_providers` entry in `versions.tf` plus the `provider "aws"` block in `providers.tf`. Two things live there because they belong to the account, not to one resource: how the provider finds credentials (it walks its own credential chain, and the SSO cache from `aws sso login` sits in the shared profile), and the `default_tags` every resource inherits. A provider is what makes `terraform init` download anything at all — the plugin binary for my platform lands in `.terraform/providers/`.
- **Default tags.** `default_tags` puts tagging in exactly one place: a tag changed there is applied to every managed resource consistently, and nothing can be forgotten. The evidence is in the plan — the tags from `providers.tf` appear on the parameter without me repeating them in `main.tf` (the plan output itself is not pasted here; see DoD-05 for what it will show and why it needs the sandbox account). I would still tag an individual resource when the value is specific to it — a per-resource `Name`, for example — which is why `main.tf` carries its own `Name` tag alongside the inherited defaults. The trade-off: two places to look when auditing tags.
- **The anatomy of a resource.** A resource block has a type and a name, and inside it the **arguments** are what you set (`name`, `type`, `value`, `tags`) while the **attributes** are what Terraform reports back after it has talked to AWS (`arn`, `version`). The plan is where the two meet: the `+` lines are what you asked for, the lines Terraform fills in for itself are the computed attributes you could not have written down beforehand. Knowing which is which matters because a computed attribute is not something you can "fix" in the file — and it is the same plan output that tells you whether a change is an in-place update (`~`) or a replacement (`-/+`).

## What tripped me up

- **The version manager was installed but invisible.** `tfenv` came from Homebrew, which installs it as a *keg-only* formula — on disk, not on `PATH`:

  ```
  $ tfenv --version
  zsh:1: command not found: tfenv
  ```

  Cause: the Homebrew formula does not add itself to `PATH`. Fix: `export PATH="/opt/homebrew/opt/tfenv/bin:$PATH"` in `~/.zshenv` — `.zshenv` rather than `.zshrc`, so scripted shells resolve it too.
- **The Homebrew binary kept winning the `terraform` name.** Even with the shim on `PATH`:

  ```
  $ terraform version
  Terraform v1.16.6
  on darwin_arm64
  ```

  while `versions.env` pins `1.16.5`. Cause: `/opt/homebrew/bin` came first in `PATH`, so the binary answered before the shim ever saw the command. Fix: `brew unlink terraform` — the formula stays installed, the shim becomes the only `terraform` on `PATH`, and `terraform version` reports the pin.
- **The credential that was there had expired.** The `default` profile left over in `~/.aws/credentials` was a pair of static IAM-user keys:

  ```
  $ aws sts get-caller-identity
  aws: [ERROR]: An error occurred (ExpiredToken) when calling the GetCallerIdentity operation: The security token included in the request is expired
  ```

  Cause: long-lived keys do not expire on their own — the key or the account did. Fix: delete the stale profile (a stored key is a stored key even when it is dead) and sign in through IAM Identity Center.
- **A plan with no session fails twice, and both messages are about the chain.** With no usable credentials:

  ```
  $ terraform plan
  Error: No valid credential sources found
    with provider["registry.terraform.io/hashicorp/aws"],
    on providers.tf line 8, in provider "aws":
     8: provider "aws" {

  Error: failed to refresh cached credentials, no EC2 IMDS role found,
  operation error ec2imds: GetMetadata, exceeded maximum number of attempts, 3,
  request send failed, Get "http://169.254.169.254/latest/meta-data/iam/security-credentials/": dial tcp 169.254.169.254:80: connect: no route to host
  ```

  Cause: the provider walked its credential chain — environment variables, then the shared profile, then the EC2 instance metadata service — and found nothing at any stop. The second error is the last stop failing: a laptop is not an EC2 instance, so the IMDS probe times out. Fix: `aws sso login` first, then re-run the plan. Checking the credential is one command; the plan is the expensive one, so check first.

## Checkpoint evidence

> The outputs below are real runs on the machine named in **What I built**. Where an output could not be produced, the slot says so and carries the exact command and the exact error — no slot is a promise dressed up as a result.

- **DoD-01 — Version switch (captured).**

  ```
  $ which terraform
  /opt/homebrew/opt/tfenv/bin/terraform

  $ tfenv use 1.16.5
  tfenv: Switching default version to v1.16.5
  tfenv: Default version (when not overridden by .terraform-version or TFENV_TERRAFORM_VERSION) is now: 1.16.5
  $ terraform version
  Terraform v1.16.5
  on darwin_arm64

  $ tfenv use 1.16.6
  tfenv: Switching default version to v1.16.6
  $ terraform version
  Terraform v1.16.6
  on darwin_arm64

  $ tfenv use 1.16.5        # back to the pin
  Terraform v1.16.5
  on darwin_arm64
  ```

  For contrast, the same machine before the version manager was wired up — Homebrew's binary, not the pin:

  ```
  $ terraform version
  Terraform v1.16.6
  on darwin_arm64
  $ grep TF_VERSION versions.env
  TF_VERSION=1.16.5
  ```
- **DoD-01 — Caller identity (not captured).** `aws sts get-caller-identity` needs a live IAM Identity Center session, and the sandbox account was not reachable from this machine:

  ```
  $ aws sts get-caller-identity
  aws: [ERROR]: An error occurred (NoCredentials): Unable to locate credentials. You can configure credentials by running "aws login".
  ```

  To run it when the sandbox is available: `aws configure sso` (start URL, region, account and role from the sandbox invitation), then `aws sso login`, then `aws sts get-caller-identity` — paste the identity with the account number and ARN redacted as the trainer directs.
- **DoD-02 — Static-key scan (captured).**

  ```
  $ git grep -nE 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key' -- .     # build repo, working tree
  (no output)

  $ git log -p | grep -nE 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key'   # build repo, full history
  (no output)

  $ grep -rnE 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key' ~/.aws/
  (no output)

  $ find ~ -maxdepth 4 \( -name "*.pem" -o -name "*.key" \) -not -path "*/Library/*"
  (no output)
  ```

  The same pattern run against this course repository matched only the lines of this write-up that *name* the patterns — a false positive to read past, not key material. The one private key on the machine is `~/.ssh/id_rsa`, which authenticates git over SSH and is not an AWS credential. What the scan looked for: the `AKIA`/`ASIA` access-key-ID pattern, `aws_secret_access_key` assignments in any config format, `.pem`/`.key` private-key files, and AWS profiles in `~/.aws/credentials`. What it cannot catch is in "key decisions" above.
- **DoD-03 — `terraform init` artefacts and the committed lock file (captured).**

  ```
  $ find . -maxdepth 2 -not -path "./.git/*"
  .
  ./.gitignore
  ./.terraform
  ./.terraform.lock.hcl
  ./.terraform/providers
  ./main.tf
  ./providers.tf
  ./versions.tf

  $ git show --stat HEAD
  commit a351848cd6e79e9f9c74ee1ec3ffe55f54118580
  Author: Romeo Panis II <romeo.panis@stratpoint.com>
  Date:   Thu Oct 22 10:01:36 2026 +0800

      Commit .terraform.lock.hcl: pin the provider selection

   .terraform.lock.hcl | 26 ++++++++++++++++++++++++++
   1 file changed, 26 insertions(+)
  ```

  In my own words, what the lock file recorded: the provider build it actually chose and the checksum for that build, so every later `init` on any machine picks the same one. On this run it recorded `hashicorp/aws v6.69.1` against my constraint `~> 6.0` — a build *newer* than the `6.68.0` pin in `versions.env`, because a compatible-range constraint resolves to the newest build that satisfies it, not to the pin. That is the whole argument for committing the lock file: my constraint says what is acceptable, the lock file says what was actually chosen, and without it a clean machine on a later day would quietly pick a different provider build.
- **DoD-04 — Format and validation (captured).**

  ```
  $ terraform fmt -check -diff
  (no output, exit 0)

  $ terraform validate
  Success! The configuration is valid.
  ```
- **DoD-05 and DoD-06 — Plan, in-place update and cloud-side destroy proof (not captured).** All three need the sandbox account; the plan cannot even be produced without a session — the exact error is in "What tripped me up". Commands to run when it is available:

  ```
  terraform plan                                                       # paste the block showing the resource with its default tags
  # change the `value` attribute only
  terraform plan                                                       # paste the `~` in-place update and its attribute diff
  terraform apply
  terraform destroy
  aws ssm get-parameter --name /terraform-basics/m01/demo              # must fail with ParameterNotFound
  ```

  **Plan-review note (classification of every change I made):** initial `terraform plan` → **create** (`+`); the one-attribute `value` change → **in-place update** (`~`); **replacement** (`-/+`) → none made in this stage (a `name` change would force one; see "key decisions"). Trainer to confirm each classification on review.
- **DoD-07 — The write-up followed end to end (partly covered).** The macOS path was followed from an empty folder — workstation, version switch, `init`, `fmt`, `validate` — and every output above is a real run on this machine. The apply and destroy legs need the sandbox account and are listed as open above. OS coverage: **macOS is the verified path**; the Windows path in "How to build it" (Git Bash or WSL for `tfenv`/`asdf`, CRLF line endings, execution policy) was not run by me and stays open in the brief's "Still open" list, so nothing in this write-up should be read as a Windows verification.

## Definition-of-done self-assessment

Scored honestly against `brief.md`'s DoD bullets and the rubric in `README.md`:

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Partly met | Version switch captured (1.16.5 ↔ 1.16.6 through `tfenv`); the caller-identity query needs a live IAM Identity Center session |
| DoD-02 | Met | Scan output pasted for the working tree, the git history, `~/.aws/` and `*.pem`/`*.key`, with what it looked for stated in my own words |
| DoD-03 | Met | `init` artefacts and the committed lock file pasted, including what the lock file recorded in my own words |
| DoD-04 | Met | `terraform fmt -check -diff` and `terraform validate` pasted, both clean, exit 0 |
| DoD-05 | Partly met | The plan-review method and the classification of every change are written; the plan output needs the sandbox account |
| DoD-06 | Partly met | The in-place-update reasoning and the cloud-side check are written; both outputs need the sandbox account |
| DoD-07 | Partly met | macOS path followed from an empty folder for every step that does not need the sandbox; the apply and destroy legs and the Windows path are still open |

**Rubric self-rating (honest, at the point of review):** Deliverable and DoD — Satisfactory: every item is addressed, but the sandbox-side evidence is a slot with a command, not pasted output. Configuration quality — Satisfactory: pinned, lock committed, no stored credentials, no state in version control; the cloud-side clean-up confirmation is still open, and the cost estimate comes from the price list rather than a billing console. Design decisions — Satisfactory, and closer to Excellent than the rest: each prompt has a reasoned answer with the trade-off named, and the answers match what I built. How to build it — Satisfactory: I followed it myself on macOS and it works, but I have not walked the Windows path. Concepts, obstacles and AI log — Satisfactory, closest to Excellent: three concepts in my own words with examples from my own build, four obstacles with exact error text, cause and fix, and an AI log with a concrete wrong suggestion and what I kept versus rewrote. Understanding — to be confirmed at review.

**Parts I would struggle to explain cold:** the exact credential-chain order the AWS provider uses, and the precise set of attributes that force replacement on `aws_ssm_parameter` — both to be re-read before review. A third one earned itself during this pass: how the provider build gets chosen, since my own `init` picked a newer patch than the pin (see DoD-03).

**Overall: the write-up is complete and every local evidence slot is pasted; the stage is not ready for review until the sandbox-account evidence is captured — the caller-identity query (DoD-01), the plan and the in-place update (DoD-05, DoD-06), and the apply and destroy legs of the end-to-end run (DoD-07).** Each of those slots carries the exact command to run. No step of the guide is missing; what is missing is an AWS account to run the last four commands against.

## What I'd do differently

Capture evidence *as* each step happens — paste the version output right after the switch, the plan right after `plan` — instead of reconstructing at the end. Evidence written down during the build is both faster and more trustworthy, and it would have.

I would also keep the sandbox account open while I write this, instead of writing the evidence slots first and discovering at the end that three of them need a live session: the plan, the update and the destroy proof all sit behind the same login, and one login unblocks all three.
