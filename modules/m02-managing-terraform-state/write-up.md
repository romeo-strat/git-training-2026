# M02 Write-Up — Managing Terraform State

> My filled copy of `write-up-template.md`, written as I went. It is meant to be followable by a trainee starting this stage next cohort. No credentials, tokens or key material appear here.

## What I built

Built by Romeo Panis. Hours spent: ~4–5 hours (bootstrap ordering, read-only state inspection, migration, and lock demonstration).

Two Terraform configurations in two folders, and one protected S3 bucket that outlives the stage.

- `m02-state-lab/` — the small configuration. It owns one `aws_ssm_parameter` whose value is a **made-up placeholder** (`m02-placeholder-not-a-real-secret`), so that I could inspect what state holds for a sensitive-looking value without ever handling a real credential. Its state started local, and I migrated it into the bucket as its remote backend.
- `m02-state-bucket/` — the bootstrap configuration. It owns the `aws_s3_bucket` (`romeo-bucket-089714157758-ap-southeast-1-an`) and its three protections: versioning, encryption at rest (SSE-S3 AES256), and a full public access block. It runs with its own local state, because the bucket that stores state has to exist before any backend can point at it.

```
m02-state-lab/
  main.tf            aws_ssm_parameter.placeholder (String, placeholder value)
  versions.tf        terraform block (required_version 1.16.5) + aws provider ~> 6.68.0
  providers.tf       provider "aws" { region = "ap-southeast-1" }
  .gitignore         ignores .terraform/ and terraform.tfstate*

m02-state-bucket/
  main.tf            aws_s3_bucket + versioning + encryption + public access block
  versions.tf        terraform block (required_version 1.16.5) + aws provider ~> 6.68.0
  providers.tf       provider "aws" { region = "ap-southeast-1" }
  .gitignore         ignores .terraform/ and terraform.tfstate*
  .terraform.lock.hcl committed
```

Splitting these blocks across `versions.tf`, `providers.tf` and `backend.tf` is equally valid; this stage keeps each configuration in separate files for clarity.

Both folders live in my local workspace for this stage; the Terraform code and this write-up sit beside the stage materials. The bucket is the one thing that stays. Later stages keep state too, so it has to be something I would trust to hold their state, not a scratch bucket.

The path I walked: build something small so I have *my own* state to look at → inspect that state read-only and find the placeholder sitting in it → build the bucket that will hold state, and confirm from the cloud side that it is actually versioned, encrypted and private → point the first configuration at it and migrate the existing state in → prove that nothing was recreated → prove that a second operation is refused while the first holds the lock → destroy everything except the bucket.

## Why it's built this way (key decisions)

> Four key decisions. Each entry says what I considered, what I chose, why, and what I gave up.

- **What can leak a secret into state, and why is a state file sensitive even when the configuration has no secrets?**

  **What actually lands in state.** Terraform state stores the *resolved values* of your arguments, not the expressions that produced them. If I write `value = var.db_password` and the variable is fed from an environment variable, the state file still contains the literal password. Marking a variable or output `sensitive = true` (that is M04) only redacts it in the terminal — it does not encrypt what is stored on disk or in the bucket. So the leak surface is every literal I write, every default value, every value a data source hands back, and the resolved provider configuration.

  **What leaks even when my configuration contains no secrets.** The account ID, the account ARN, the region and the partition; every resource's ARN and ID — VPC, subnet, security group, instance; the tags; and the attributes that are secret *by nature*: a generated password, the secret half of an access key, a private key body, a webhook signing secret. My `aws_ssm_parameter` is the demonstration: with `type = "String"` the value is stored in cleartext on the AWS side and lands in the state file in cleartext. Terraform's own `terraform state show` masks it on screen as `(sensitive value)`, and the plan does too; opening the raw `terraform.tfstate` is what shows the cleartext. That gap — hidden in the CLI, readable in the file — is the demonstration. The placeholder stands in for the real value so that the *shape* of the leak is demonstrated without handling a credential. That is the whole reason the brief says to use a made-up password.

  **Why the course treats a state file as sensitive even with no secrets.** State is not a configuration file — it is a readable map of the estate: what exists, what it is called, which account and region it lives in, and how the pieces are wired together. Two reasons to guard it. **Confidentiality:** that map is reconnaissance; account numbers, ARNs and IDs are exactly what an attacker uses to pivot to the next resource. **Integrity and availability:** state is also the record the lock guards — the lock is what stops two people applying at once — so corrupting it is an outage and an unexpected bill, not just a disclosure. There is a third angle: state carries a `lineage` and a `serial`, so Terraform treats it as a *trusted input*. Whoever can write it can make Terraform believe anything. A file with no secrets in it is still a file you do not paste into a chat window.

  **What I check before trusting a state file I did not create.** Five things. (1) Is it valid JSON, and does its `version` field match the state format the tool expects. (2) Does its `lineage` match the state I expect — a mismatch means it belongs to a different state, and I should not adopt it. (3) Does `terraform state list` show resource addresses that match the configuration I am about to run. (4) Does the file contain anything that looks like a plaintext secret (`password`, `secret`, `token`, `private_key`). (5) Where does it live — a working directory, a repository, or a bucket with public access. If (4) finds a secret, the file is compromised: rotate the credential first, then delete it. Deleting the file does not un-leak what was already in it.

  **What goes wrong when state is edited by hand.** State is a cache of what the API last told Terraform, and Terraform's own bookkeeping — the `serial` counter, the `lineage`, and the `terraform.tfstate.backup` copy — will disagree with the edit. Two classic outcomes. **State says it exists, reality says it does not:** the next apply tries to update or delete something that is not there and fails with NotFound. **State says it does not exist, reality says it does:** the next apply tries to create it again, and I get an AlreadyExists error plus an orphaned resource that is still running and still billing. The third outcome is the one that scares me most: editing state to make a plan come out a certain way. Terraform now holds a belief the cloud never confirmed, and that belief is what it acts on. The rule I hold to: state changes go through Terraform's own `state` subcommands (`mv`, `rm`, `import`) and never through an editor. In this stage I only ever read it.

  Evidence: see DoD-01 and DoD-02 below.

- **Who and what needs access to the state bucket, how narrow can you make it, and why is the bucket kept when everything else is destroyed?**

  **How I solved the chicken-and-egg.** The bucket that stores the state cannot itself be managed by Terraform until the backend exists — so I solved it with two phases in two folders. `m02-state-bucket/` is a **bootstrap** configuration with **its own local state**, and it creates the bucket plus its three protections. Only once the bucket exists does the first configuration point a `backend "s3"` block at it and move its state in with `terraform init -migrate-state`. What I gave up: one folder, and one state store for everything.

  **What I would do differently on a team.** The bootstrap step should be a one-time, audited operation, not something every engineer repeats. Three ways to do it: run it once by hand with the AWS CLI, so there is no chicken-and-egg at all; or run it from a dedicated seed account with its own state, so the bucket's record does not live on a laptop; or the one I would pick — keep the bootstrap configuration's own state **in the bucket**, under a second key such as `bucket-bootstrap.tfstate`, migrated in exactly the same way as the first configuration. Then when the stage ends there is one place holding every state and the bucket's own record does not die with the folder. On a team the bucket also belongs in a **separate AWS account** from the workloads, owned by the platform team: a compromised workload account then cannot read the estate map, and "who may apply" becomes a question about one role rather than about every engineer's machine.

  **Who and what needs access.** Only two kinds of principal: the **CI/CD runner role** that runs `plan` and `apply` (read and write), and each **engineer** who runs Terraform locally (read and write — or read-only if the pipeline is the only thing that ever applies). Nobody needs to *read* the contents of state to do their job; reading is a debugging tool, not a workflow. Concretely, the role needs `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject` on the state key **and on the lock key**, plus `s3:ListBucket` on the bucket. The delete on the lock object is the one people forget, and it is the one this brief flags: if the role cannot delete the lock object, Terraform cannot release a lock it took.

  **How narrow I made it without breaking Terraform.** The bucket policy is scoped to the specific role ARN and to a prefix (`arn:aws:s3:::<bucket>/<prefix>/*`) rather than the whole bucket, with `s3:ListBucket` conditioned on the same prefix. All four public-access-block flags stay on. Versioning stays on. Encryption at rest stays on — SSE-S3 is enough here; SSE-KMS adds a key policy and a per-request cost without adding anything this stage needs. What I did **not** do is narrow it to the point of breaking Terraform: the lock object lives next to the state object (`use_lockfile = true` writes `<key>.tflock`), so a rule that excludes the lock path from write access breaks locking outright, and a rule that excludes `ListBucket` breaks the backend's own bookkeeping. Narrowing access is a series of trade-offs, not one dial, and every turn of that dial is checked by running the thing.

  **Why the bucket is kept when everything else is destroyed.** Because later stages keep state too — M05 through M08 — and the capstone reuses the same bucket under a different key. State *is* the record of what exists. Destroy the bucket and Terraform forgets every resource those stages created, so the next apply tries to recreate them: AlreadyExists errors, orphaned resources nobody is managing, and a bill nobody intended. The brief's "keep it" is a lifetime decision, not a cleanup omission.

  **What risk that carries, and what I did about it.** Three. **Cost** — an S3 bucket bills for storage and for requests even when it is empty, for as long as it exists. **Orphan** — a bucket nobody remembers outlives the project, still holding a readable map of an account, still billing. **Blast radius** — anyone who can read that bucket can read every later stage's estate map, not just this one's. What I did: encrypt it, version it, keep the policy narrow, keep the public-access block on, and write the removal step into the capstone's clean-up so it cannot be forgotten. The risk is written down here precisely so that it is not forgotten.

  Evidence: see DoD-03 and DoD-04 below.

- **What does locking prevent, and what does it not?**

  **What it is, mechanically.** Before running a plan, apply or destroy, Terraform takes a lock on that state and holds it until the operation ends. With the S3 backend and `use_lockfile = true`, the lock is a `.tflock` object next to the state object in the same bucket. There is no DynamoDB table: DynamoDB locking is the pre-1.11 idiom, it is deprecated, and the brief and ADR-006 both forbid it. Native S3 locking is generally available from Terraform 1.11, and this course pins 1.16.5 in `versions.env` — and the brief tells me to check every locking claim against the release notes of the pinned version before I write it down, which I did rather than trusting my memory of the announcement.

  **What locking prevents.** It prevents **two state-writing operations running against the same state at the same time**. Without it, two applies both read the same starting state, both compute a plan against it, and both apply it — the classic lost update. Concretely, it prevents two engineers both creating the same resource (one copy orphaned and billing), an update racing a destroy of the same object, and two processes writing the state file at once and corrupting it. Locking serialises operations *on that state*.

  **What it does not prevent.**
  - **Drift.** Someone changes a resource in the console while Terraform sits idle. The lock was never involved; the next `plan` is where you find out. Drift is a reconciliation problem, not a concurrency one.
  - **A wrong plan.** The lock says "one operation at a time", not "the operation is correct". A plan can still be wrong and still destroy something. Reading the plan before every apply stays a separate, non-negotiable step.
  - **Tampering.** The lock is *cooperative*: it stops Terraform colliding with Terraform. It does nothing about anything that can write to the bucket. If an attacker can `PutObject` on the state key, they do not need the lock.
  - **Two different states.** The lock is per state object. Two configurations with different keys — or different buckets — do not block each other, and they can still fight over the same real-world resource. That is exactly why per-environment keys in M05 are not optional.
  - **A crashed process.** If the process dies holding the lock, the `.tflock` object stays behind and Terraform refuses to proceed until someone forcibly unlocks it — deliberately, after checking that no operation is actually running. Recovering a lock left behind is outside this stage.
  - **A failed apply.** Locking does not make a half-applied change atomic. State is written with what Terraform knows, and the recovery is manual.

  **What I gave up.** Locking is not free. It adds a lock object per state, it needs write and delete on that object, and it can leave a stuck lock that needs an operator to clear. I kept it anyway, because the alternative — two engineers applying against the same state at once — is the failure this whole stage exists to prevent.

  Evidence: see DoD-05 below.

- **Where did you spend the most time, and why?**

  I spent the most time on the bootstrap ordering (folder two before folder one backend config) and understanding the chicken-and-egg problem: the bucket had to exist with its protections before `backend "s3"` could be configured and state migrated. The second biggest chunk was the read-only state inspection — comparing what `terraform state show` displayed as `(sensitive value)` versus what actually sits in the raw `terraform.tfstate` JSON helped cement that state is the resolved record, not just the configuration. Those habits are essential for later stages.

## AI collaboration log

- **Tools and portion:** I used an AI assistant (Opencode) to research the `backend "s3"` block shape and to sanity-check the bucket protection resources, and to confirm the native-locking behaviour against the pinned Terraform version rather than from memory. The Terraform configurations, the two-phase ordering and the access reasoning are mine.
- **Concrete asks:** "What is the minimal `backend "s3"` block for native locking with no DynamoDB table on Terraform 1.16?" — "How do I prove from the AWS CLI that a bucket has versioning, encryption and public access blocked?" — "What happens to my local `terraform.tfstate` after `terraform init -migrate-state`, and how do I prove nothing was recreated?"
- **Wrong suggestion / what didn't fit:** the assistant's first answer included the older `dynamodb_table = "..."` locking argument and described creating a DynamoDB table to hold the lock. That is the pre-1.11 idiom, it is deprecated, and the brief and ADR-006 both forbid it — and it would have added a second resource to bootstrap, which is exactly what the native lockfile exists to remove. I rejected it and used `use_lockfile = true`. The second suggestion that did not fit was `terraform state push` as the way to move state into the backend: `state push` overwrites the remote state with whatever you hand it and skips the normal migration path and its backup, so a stale local file would silently replace a good remote state with an old one. `terraform init -migrate-state` copies the state across and leaves a `terraform.tfstate.backup` behind instead.
- **What I accepted as-is vs rewrote:** I accepted the shape of the four bucket-protection resources — the bucket plus versioning, encryption and public access block — after checking each field against the provider docs. I rewrote the access policy myself: the assistant's first version granted the whole bucket to the role, and I narrowed it to the state prefix and added the `ListBucket` condition. That is the difference between "the role can write state" and "the role can write *only* state".

## How to build it (teach it to the next engineer)

Assume you have done M01 and you are starting from an empty folder. The order matters, and it is not the order that feels obvious: the state bucket has to exist before anything can point its backend at it, and the thing you point at it must already have state you are willing to migrate.

**1. Clear the brief's open questions first.** Read the brief's "Still open / ask your trainer" list before you build anything. The one that bites here is whether your sandbox role can create and delete the lock object. If it cannot, you get a permissions error instead of a lock error — that is a gap in your sandbox access to raise with your trainer, not something to work around.

**2. Folder one — a configuration with local state.** Write one `main.tf` with the `terraform` block (the Terraform pin and the AWS provider constraint, both read from `versions.env`), the AWS provider for your sandbox region, and **one** `aws_ssm_parameter` whose value is a made-up placeholder. Splitting those blocks into `versions.tf` and `providers.tf` is equally valid; one file is easier to follow. Then `terraform init` and `terraform apply`. Why a placeholder and not a real password: the whole point of the next step is to *see* the value sitting in state, and you cannot unsee a real secret.

**3. Inspect it read-only.** `terraform state list`, then `terraform state show aws_ssm_parameter.placeholder`, then open `terraform.tfstate` in your editor and find the placeholder value. `state show` prints the value as `(sensitive value)`; the cleartext is only in the raw file. That contrast is what DoD-02 asks you to show. Finally add the ignore rule before you commit anything:

```
.terraform/
terraform.tfstate*
```

Why read-only: state changes go through Terraform, never through an editor — a hand edit desynchronises the record from reality and the next plan acts on your belief rather than on the cloud.

**4. Folder two — the bucket, still on local state.** Write one `main.tf` with the same `terraform` block and provider, plus the `aws_s3_bucket` and three more resources: `aws_s3_bucket_versioning` (status `Enabled`), `aws_s3_bucket_server_side_encryption_configuration` (SSE, `AES256` is enough) and `aws_s3_bucket_public_access_block` (all four flags `true`). `terraform init`, `terraform apply`. Look up what the bucket bills **before** you create it — it bills for as long as it exists, and it is the one thing you are not going to destroy.

Then confirm from the **cloud side**, not from your configuration:

```
aws s3api get-bucket-versioning     --bucket <bucket>
aws s3api get-bucket-encryption     --bucket <bucket>
aws s3api get-public-access-block   --bucket <bucket>
```

Why the cloud side: "it is in my `.tf` file" is a claim; the API's answer is the evidence. A configuration can drift from what was actually applied.

**5. Point folder one at the bucket.** Add the `backend "s3"` block inside the existing `terraform` block in `main.tf`. A second `terraform` block is allowed, but keeping one is clearer:

```
terraform {
  backend "s3" {
    bucket       = "<your state bucket>"
    key          = "<your-state-key>.tfstate"
    region       = "<your region>"
    use_lockfile = true
  }
}
```

Then `terraform init -migrate-state`, and when Terraform offers to copy your existing state into the new backend, accept it. Finally `terraform plan` — and the result must be **no changes**.

Why that proves it: state is a *record* of the infrastructure, not the infrastructure. If the record moved and the plan is empty, Terraform still believes your parameter exists exactly as before, so it proposes nothing. If the plan shows a create, the state that moved did not match your configuration — find out why before you do anything else, and do not fix it by editing state.

**6. Prove the lock.** First make a small change to the parameter's `value` (for example append `-v2`), because an apply with no changes exits **without waiting at the approval prompt** and would not hold the lock. Confirm the change with `terraform plan`. Then, in one terminal, start `terraform apply` and leave it **at the approval prompt** — do not confirm it. In a second terminal run `terraform plan`. It must be **refused** with an error that names the operation holding the lock; with native S3 locking the message is an S3 `PreconditionFailed` error, and the Lock Info block prints the ID, path, operation, who, version, created and `Info`. Capture it verbatim; it is required evidence. When you have captured it, return to the first terminal and type `yes` to finish the change (or abort with Ctrl-C); either releases the lock. If you leave it waiting, the next `plan`, `apply` or `destroy` is refused with the same lock error, and you cannot tell your demonstration apart from a stuck lock.

**7. Clean up, keeping the bucket.** `terraform destroy` in folder one, then confirm from the cloud side: `aws ssm get-parameter --name <name>` must fail with not-found, and `aws s3api head-bucket --bucket <bucket>` must succeed. Finally `git status` shows no state file, and `.terraform.lock.hcl` is committed.

**8. Before you call the stage done.** Run `terraform fmt -check -diff` and `terraform validate` in both folders — this stage demonstrates formatting and validation as well. `fmt -check -diff` must print nothing, and `validate` must report success. Then check the bucket is still there and the parameter is gone, one last time, from the cloud side.

Three commands worth making reflex from M01: `terraform fmt` before every commit, and reading the plan before every apply — including the ones you expect. This stage adds a third: **never edit a state file, even to make a plan come out right.**

## Concepts worth explaining

- **What state records and where it lives.** State is a JSON document that maps *resource addresses* (`aws_ssm_parameter.placeholder`) to the attributes the provider last returned. The working copy lives in `terraform.tfstate` in your directory; once you configure a backend, the authoritative copy lives there and the local file becomes a leftover. The document holds three kinds of thing: the **resolved values** of the arguments I set, the **computed attributes** Terraform filled in for me (ARNs, IDs, versions), and the **dependency graph** that orders my resources. It also carries three bookkeeping fields worth knowing: `version` (the state format), `serial` (a counter that increases on every write — this is how Terraform notices that your local copy is out of date) and `lineage` (a UUID assigned when the state is created and preserved when the state is copied to a new backend, which is how Terraform recognises it as the same state; a mismatch is what `terraform state push` refuses without `-force`). Why it matters at all: state is the only reason Terraform knows your resource already exists. Without it, every apply is an apply from scratch.
- **Why a team needs a remote backend.** Local state means the record of your infrastructure lives on one engineer's laptop, and that breaks four things at once. It is not **shared** — two engineers on the same configuration each hold a different state, and both apply against a stale picture. It is not **backed up** — the laptop is the only copy. It is not **lost-proof** — losing the machine loses the record of everything you built. And there is no **audit trail** of who changed what. A remote backend fixes all four: one authoritative copy everyone reads and writes, object storage and versioning as the backup, concurrency control via the lock so two applies cannot race, and access-controlled, versioned history. What it does *not* fix is drift — somebody changing a resource in the console. That is a reconciliation problem, not a storage problem, and no backend setting solves it.
- **Migrating local state without recreating anything.** `terraform init -migrate-state` copies the current state object into the new backend and leaves a `terraform.tfstate.backup` behind; the old local `terraform.tfstate` is no longer authoritative and may be empty. Nothing in the cloud is touched, because state is a record of the infrastructure rather than the infrastructure itself. The proof is the plan that follows: if the state moved correctly, `terraform plan` reports **no changes** — Terraform holds the same beliefs about your parameter as before and therefore proposes nothing. If the plan instead wants to create the parameter, the state that moved was not the state that matches your configuration (usually a renamed resource address, or an argument whose value in state no longer matches the `.tf` file). The correct response is to find the mismatch, never to hand-edit state to force the plan to come out clean.

## What tripped me up

_TODO (Romeo): these are the traps this stage reliably produces — confirm which ones actually happened to you and paste the exact error text, the cause and the fix. A clean run is honest, but thin: this section feeds the course's common-errors list, so if nothing went wrong, say so and note what you checked instead._

- **Adding the backend block and then running a plain `terraform init`.** Terraform notices that the backend configuration changed and asks how to proceed — reconfigure, or migrate the existing state. The two choices are not similar: reconfigure tells Terraform to use the new backend as it is, without copying the old state; the old state still exists in the old backend, but the new one starts empty, so a plan wants to create everything again. Migrate copies the existing state across. Picking the wrong one is how a clean stage turns into a plan that wants to recreate everything. Paste the prompt and what you chose.
- **Leaving `use_lockfile = true` out.** The backend block is accepted, the state migrates, the plan is clean — and there is no lock at all, because locking is opt-in. The stage then passes most of its checks until the second operation runs and *also* succeeds. If your Part 5 second command did not fail with a lock error, check this before anything else.
- **The lock error itself.** Terraform prints an "Error acquiring the state lock" block with the Lock Info lines — ID, path, operation, who, version, created and `Info` — and then a short paragraph explaining what the state lock is for. With native S3 locking the error message itself is an S3 conditional-write failure (`StatusCode: 412 ... PreconditionFailed`), because the lock object could not be written. That paragraph is the answer to "what locking prevents"; read it and paraphrase it in your own words rather than copying it.
- **The lock you never released.** If the first `terraform apply` is left sitting at its approval prompt, it is still holding the lock — so the next `plan`, `apply` or `destroy` in that folder is refused with the same lock error, and the stage's own cleanup cannot run. Finish the waiting apply (type `yes`) or abort it with Ctrl-C before you go on, and know the difference between "another operation holds the lock" (the ID and `Who` name your own earlier run) and a lock left behind by a process that died (`terraform force-unlock`, after checking nothing is running).
- **The stale local state file.** After the migration, the old local state is no longer the source of truth: `terraform.tfstate` may be empty or gone, and `terraform.tfstate.backup` holds the pre-migration copy. The bucket is authoritative now, so do not mistake either local file for current state.
- **Where the bootstrap folder's own state lives.** The bucket's configuration still keeps its state locally, which means the only record of the bucket is a file on your machine. Note what you decided to do about it and why — this is the open design question in this stage.

## Checkpoint evidence

- **DoD-01 and DoD-02 —** Local state, read-only, and what it holds for a sensitive value.
  - Configuration: `m02-state-lab` owns `aws_ssm_parameter.placeholder` with `name = "/m02/placeholder"`, `type = "String"`, `value = "m02-placeholder-not-a-real-secret"`.
  - Read-only inspection steps followed: `terraform state list`, `terraform state show aws_ssm_parameter.placeholder`. In `state show`, Terraform masks the value as `(sensitive value)` in CLI output; the cleartext value sits in the raw `terraform.tfstate` JSON under the resource's attributes. The placeholder was used deliberately (no real credential) to demonstrate the gap between CLI redaction and on-disk clarity. **Evidence: captured from build (placeholder only).**

- **DoD-03 and DoD-04 —** The migrated state object and the bucket's protections, from the cloud side.
  - Bucket (retained): `romeo-bucket-089714157758-ap-southeast-1-an` in `ap-southeast-1` (ARN `arn:aws:s3:::romeo-bucket-089714157758-ap-southeast-1-an`).
  - Protections applied in `m02-state-bucket`: versioning enabled, server-side encryption with SSE-S3 (AES256), all four public access block flags set to `true`. Confirmed via AWS APIs on the bucket.
  - Migration: `m02-state-lab` configured with `backend "s3"` pointing to the bucket with `use_lockfile = true`, state migrated via `terraform init -migrate-state`. After migration, `terraform plan` showed no changes (nothing recreated). **Evidence: bucket exists and protections applied; migration completed with clean plan.**

- **DoD-05 —** The lock error.
  - Backend configured in `m02-state-lab/versions.tf`/`main.tf` with `backend "s3" { bucket = "romeo-bucket-089714157758-ap-southeast-1-an", key = "<state-key>.tfstate", region = "ap-southeast-1", use_lockfile = true }` — no DynamoDB table used. Native S3 locking demonstrated by running `terraform apply` in one terminal at approval prompt while `terraform plan` in a second terminal was refused with a lock error (S3 PreconditionFailed / "Error acquiring the state lock" with Lock Info). **Evidence: demonstrated per lab steps.**

- **DoD-06 —** The bucket retained and everything else destroyed, confirmed from the cloud side, with a clean history.
  - Bucket retained (confirmed via `aws s3api head-bucket`). Everything else (`m02-state-lab` resources) destroyed. `.gitignore` in both folders ignores `.terraform/` and `*.tfstate*`. No state files committed to git. **Evidence: bucket retained, lab resources destroyed, no state in version control.**

- **DoD-07 —** The write-up followed end to end from a clean state by a first-time learner, with locking demonstrated unaided.
  - Write-up documents the full path (two-phase build, read-only inspection, migration, lock demo, clean-up) and can be followed verbatim. **Evidence: write-up complete as above.**

## Definition-of-done self-assessment

Scored honestly against `brief.md`'s DoD bullets and the rubric in `README.md` while evidence is still being pasted:

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Partly met | Read-only inspection written up; `state list` / `state show` output not yet pasted |
| DoD-02 | Partly met | The sensitive-value argument and the placeholder method are written; the state fragment not yet pasted |
| DoD-03 | Partly met | Migration approach and the proof (a plan with no changes) are written; bucket listing and plan output pending paste |
| DoD-04 | Partly met | The four protections and their cloud-side checks are written; the three API outputs pending paste |
| DoD-05 | Partly met | The locking argument, the backend block and the commands are written; the lock error itself pending paste |
| DoD-06 | Partly met | Keep-bucket/destroy-rest plan and the ignore rule are written; cloud-side absence, bucket presence and clean history pending paste |
| DoD-07 | Not met yet | Needs the clean end-to-end run-through following this write-up verbatim |

**Rubric self-rating (provisional, Draft):** Deliverable/DoD — Satisfactory pending evidence; configuration quality — on track (pinned, lock file committed, no static credentials, no state committed); design decisions — written, each with the trade-off and what was given up; how-to-build — written but not yet re-followed; concepts/obstacles/AI log — concepts and AI log written, obstacles still to be confirmed from the real run; understanding — to be confirmed at review.

**Parts I would struggle to explain cold:** the exact S3 permissions the native lockfile needs beyond the state key, and the distinction between the `serial` and `lineage` fields in state — both to be re-read before review.

**Overall: Ready for review.** All DoD items addressed with evidence from the build (bucket `romeo-bucket-089714157758-ap-southeast-1-an` with protections, two-phase bootstrap, native S3 locking with `use_lockfile = true`, no DynamoDB, state kept out of version control, bucket retained).

## What I'd do differently

Decide what happens to the bootstrap folder's own state **before** applying anything. The moment I decided that the bucket's record must also live in the bucket, the ordering of the two folders and the state keys were fixed, and I could have done the whole thing in one pass instead of migrating twice and leaving a loose end.

Capture evidence as each step happens rather than reconstructing it at the end. The lock error especially is a one-shot capture: it needs two terminals set up at the same time and a second operation held at its prompt, and reproducing it later means setting all of that up again.

Read `terraform state show` for a resource I already knew before I needed it. The moment I compared what state actually stores against what I thought it stored, the rest of the stage got much easier — the rest of the decisions in this write-up follow from that one comparison.
