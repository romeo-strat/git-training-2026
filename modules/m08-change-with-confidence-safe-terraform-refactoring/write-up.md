# M08 Write-Up — Change with Confidence: Safe Terraform Refactoring

My filled copy of `write-up-template.md`, written as I built the stage. It is meant to be followable by a trainee starting this stage next cohort. No credentials, tokens or key material appear here.

## 1. Deliverable & Evidence

**Repository:** `modules/m08-change-with-confidence-safe-terraform-refactoring/build/`
**Deliverable:** A small AWS configuration after three refactors — a rename, an adoption and a stop-managing — with saved plans showing no destroys and no replacements, the saved-plan JSON checks, the configuration diffs, the state-command log, and the note on legacy imperative commands.

The layout is:

```
build/
├── .gitignore
├── .terraform.lock.hcl
├── main.tf              # parameters + moved / import / removed blocks
├── providers.tf         # region + default_tags
├── versions.tf          # pins + backend "s3" {}
├── rename.tfplan        # saved plan for the rename
├── adopt.tfplan         # saved plan for the adoption
└── remove.tfplan        # saved plan for the stop-managing
```

State lives in the M02 bucket under the key `m08/terraform.tfstate`, with the same lock settings as M05 and M07.

### DoD-01 — Three saved plans with zero destroys and zero replacements, plus a JSON check

**Rename** (`first` → `primary`, with a `moved` block):

```
terraform plan -out=rename.tfplan

aws_ssm_parameter.first: Refreshing state... [id=/terraform-basics/m08/first]

Terraform will perform the following actions:

  # aws_ssm_parameter.first has moved to aws_ssm_parameter.primary
    resource "aws_ssm_parameter" "primary" {
        id   = "/terraform-basics/m08/first"
        name = "/terraform-basics/m08/first"
        type = "String"
    }

Plan: 0 to add, 0 to change, 0 to destroy.
```

**Adoption** (the hand-made `/terraform-basics/m08/legacy` parameter, with an `import` block):

```
terraform plan -out=adopt.tfplan

aws_ssm_parameter.legacy: Preparing import... [id=/terraform-basics/m08/legacy]
aws_ssm_parameter.legacy: Refreshing state... [id=/terraform-basics/m08/legacy]

Terraform will perform the following actions:

  # aws_ssm_parameter.legacy will be imported
    resource "aws_ssm_parameter" "legacy" {
        id   = "/terraform-basics/m08/legacy"
        name = "/terraform-basics/m08/legacy"
        type = "String"
    }

Plan: 1 to import, 0 to add, 0 to change, 0 to destroy.
```

**Stop-managing** (`second`, with a `removed` block and `destroy = false`):

```
terraform plan -out=remove.tfplan

Terraform will perform the following actions:

  # aws_ssm_parameter.second will no longer be managed by Terraform, but will not be destroyed
  # (because destroy = false is set in the removed block)
  . resource "aws_ssm_parameter" "second" {
        id   = "/terraform-basics/m08/second"
        name = "/terraform-basics/m08/second"
        type = "String"
    }

Plan: 0 to add, 0 to change, 0 to destroy.
```

The saved plans were checked mechanically, not read by eye. For the rename:

```
terraform show -json rename.tfplan | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.previous_address // "-")] | @tsv'

aws_ssm_parameter.primary	no-op	aws_ssm_parameter.first
aws_ssm_parameter.second	no-op	-
```

For the adoption:

```
terraform show -json adopt.tfplan | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.change.importing.id // "-")] | @tsv'

aws_ssm_parameter.legacy	no-op	/terraform-basics/m08/legacy
aws_ssm_parameter.primary	no-op	-
aws_ssm_parameter.second	no-op	-
```

For the stop-managing:

```
terraform show -json remove.tfplan | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.action_reason // "-")] | @tsv'

aws_ssm_parameter.legacy	no-op	-
aws_ssm_parameter.primary	no-op	-
aws_ssm_parameter.second	no-op	forget
```

The three checks cover every resource in each saved plan. `no-op` is the action I wanted to see for the rename and the stop-managing; the import is represented by the `importing.id` field on an otherwise `no-op` change. None of the three plans contains `delete` or `create` on an existing resource, and none contains a replacement (`delete` followed by `create`).

### DoD-02 — Renamed identity kept, adopted resource clean, stopped resource still alive

**The rename kept the real-world identity.** The parameter's ARN is the same before and after:

```
# before the rename
aws ssm get-parameter --name /terraform-basics/m08/first --query 'Parameter.ARN' --output text
arn:aws:ssm:ap-southeast-1:089714157758:parameter/terraform-basics/m08/first

# after applying the moved block
aws ssm get-parameter --name /terraform-basics/m08/first --query 'Parameter.ARN' --output text
arn:aws:ssm:ap-southeast-1:089714157758:parameter/terraform-basics/m08/first
```

`terraform state show aws_ssm_parameter.primary` reports the same `id`, `name` and `arn`:

```
# aws_ssm_parameter.primary:
resource "aws_ssm_parameter" "primary" {
    arn   = "arn:aws:ssm:ap-southeast-1:089714157758:parameter/terraform-basics/m08/first"
    id    = "/terraform-basics/m08/first"
    name  = "/terraform-basics/m08/first"
    type  = "String"
    value = (sensitive value)
}
```

Only the Terraform address changed, from `aws_ssm_parameter.first` to `aws_ssm_parameter.primary`.

**The adopted resource is in state and described by configuration.** After applying `adopt.tfplan`:

```
terraform state list

aws_ssm_parameter.legacy
aws_ssm_parameter.primary
aws_ssm_parameter.second
```

The post-adoption plan is clean:

```
terraform plan

No changes. Your infrastructure matches the configuration.
```

**The stopped resource still exists in AWS.** After applying `remove.tfplan`:

```
aws ssm get-parameter --name /terraform-basics/m08/second --query 'Parameter.Value' --output text
second-value
```

Terraform no longer tracks it:

```
terraform state list

aws_ssm_parameter.legacy
aws_ssm_parameter.primary
```

The parameter is alive, and the responsibility for it has moved from Terraform to me. I recorded that hand-off and deleted it manually during clean-up, after capturing the evidence.

### DoD-03 — A reviewable diff for each refactor, and every state command listed

**Rename diff:**

```diff
-resource "aws_ssm_parameter" "first" {
+resource "aws_ssm_parameter" "primary" {
     name  = "/terraform-basics/m08/first"
     type  = "String"
     value = "first-value"
 
     tags = {
         Name = "m08app-lab-first"
     }
 }
+
+moved {
+  from = aws_ssm_parameter.first
+  to   = aws_ssm_parameter.primary
+}
```

**Adoption diff:**

```diff
+import {
+  to = aws_ssm_parameter.legacy
+  id = "/terraform-basics/m08/legacy"
+}
+
+resource "aws_ssm_parameter" "legacy" {
+  name        = "/terraform-basics/m08/legacy"
+  type        = "String"
+  value       = "legacy-value"
+  description = "Legacy parameter adopted from the console"
+
+  tags = {
+    Name = "m08app-lab-legacy"
+  }
+}
```

**Stop-managing diff:**

```diff
-resource "aws_ssm_parameter" "second" {
-  name  = "/terraform-basics/m08/second"
-  type  = "String"
-  value = "second-value"
-
-  tags = {
-    Name = "m08app-lab-second"
-  }
-}
+removed {
+  from = aws_ssm_parameter.second
+
+  lifecycle {
+    destroy = false
+  }
+}
```

**Every command I ran against state:**

| Command | What it did |
| --- | --- |
| `terraform state list` | Inspection only. Listed the managed addresses after the initial apply, after the rename, after the adoption and after the stop-managing. |
| `terraform state show aws_ssm_parameter.primary` | Inspection only. Confirmed the renamed resource kept its `id`, `name` and `arn`. |
| `terraform state show aws_ssm_parameter.legacy` | Inspection only. Confirmed the adopted parameter's attributes matched the live resource. |

I ran no state-changing commands: no `terraform state mv`, no `terraform state rm`, no `terraform state push`, no `terraform import` command and no hand-editing of state. Every refactor is a change in configuration.

### DoD-04 — Note on legacy imperative commands

| Imperative command | What it does | Declarative equivalent |
| --- | --- | --- |
| `terraform import aws_ssm_parameter.legacy <id>` | Adds an existing resource to state, but writes no configuration and does not check that the configuration matches. | `import { to = aws_ssm_parameter.legacy, id = "<id>" }` plus `terraform plan -generate-config-out=generated.tf`. |
| `terraform state mv aws_ssm_parameter.first aws_ssm_parameter.primary` | Rewrites the address in state, with no plan and no record in the configuration history. | `moved { from = aws_ssm_parameter.first, to = aws_ssm_parameter.primary }`. |
| `terraform state rm aws_ssm_parameter.second` | Removes the resource from state and leaves the real resource running, with no plan entry. | `removed { from = aws_ssm_parameter.second, lifecycle { destroy = false } }`. |
| `terraform state replace-provider` | Rewrites the provider address recorded in state, usually after a provider source change. | Change the provider source in `required_providers`, then `terraform init`; use the command only if the state cannot be migrated by configuration. |

I would meet these commands in inherited or older configurations (the declarative blocks arrived across Terraform 1.1, 1.5 and 1.7), when recovering a state that has already been damaged, when changing a provider's source address, or in a one-off migration where the configuration cannot yet express the change. The declarative form is still the first choice, because it appears in a plan and can be reviewed before it touches anything.

### DoD-05 — A partial apply, the state afterwards, and recovery without editing state

I added two parameters to the configuration, one valid and one deliberately invalid, and applied them together:

```hcl
resource "aws_ssm_parameter" "recovery_ok" {
  name  = "/terraform-basics/m08/recovery-ok"
  type  = "String"
  value = "ok"
}

resource "aws_ssm_parameter" "recovery_bad" {
  name  = "/terraform-basics/m08/recovery-bad"
  type  = "String"
  value = join("", [for i in range(4097) : "x"])
}
```

The apply created the good one and then stopped on the bad one:

```
aws_ssm_parameter.recovery_ok: Creation complete after 1s [id=/terraform-basics/m08/recovery-ok]

╷
│ Error: creating SSM Parameter (/terraform-basics/m08/recovery-bad): ValidationException: 1 validation error detected: Value 'xxxxxxxx...' at 'value' failed to satisfy constraint: Member must have length less than or equal to 4096
│
│   with aws_ssm_parameter.recovery_bad,
│   on main.tf line 42, in resource "aws_ssm_parameter" "recovery_bad":
│   42: resource "aws_ssm_parameter" "recovery_bad" {
╵
```

State afterwards held the resource that succeeded and not the one that failed:

```
terraform state list

aws_ssm_parameter.legacy
aws_ssm_parameter.primary
aws_ssm_parameter.recovery_ok
```

`recovery_bad` is absent because it never got an ID. I fixed the value in configuration, planned the whole configuration, and applied it:

```
terraform plan

  # aws_ssm_parameter.recovery_bad will be created
Plan: 1 to add, 0 to change, 0 to destroy.

terraform apply
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

terraform plan

No changes. Your infrastructure matches the configuration.
```

No state file was edited, and no resource was removed by hand.

**What to do after a failed destroy.** Read the error first and identify which resource failed and why — a dependency still in use, a protected resource, a permissions problem, or eventual consistency. Check the cloud side to see whether the resource actually still exists. Fix the cause in configuration (remove the dependency, adjust the lifecycle setting, wait for the dependency to disappear), then re-run `terraform destroy`. If the resource is already gone but state still believes it exists, reconcile with `terraform apply -refresh-only` rather than deleting the state entry; a `terraform state rm` is a last resort, run under supervision, and only after confirming from the cloud side that the resource is really gone.

### DoD-06 — No billable resource left behind, only the M02 bucket

The four resources Terraform still managed were destroyed:

```
terraform destroy -auto-approve

Destroy complete! Resources: 4 destroyed.
```

The stopped parameter was outside Terraform by then, so I deleted it from the cloud side after capturing the DoD-02 evidence:

```
aws ssm delete-parameter --name /terraform-basics/m08/second --region ap-southeast-1
(no output, exit 0)
```

Confirmed from the cloud side:

```
aws ssm describe-parameters --region ap-southeast-1 --parameter-filters "Key=Name,Option=BeginsWith,Values=/terraform-basics/m08/" --query 'Parameters[].Name'
[]

aws s3api head-bucket --bucket romeo-bucket-089714157758-ap-southeast-1-an
(no output, exit 0 — bucket retained)
```

Only the M02 bucket remains.

### DoD-07 — The guide works from a clean start

I followed the guide in section 2 from a clean checkout (no `.terraform/`, empty local state) through the initial apply, the three refactors, the JSON checks, the partial apply and the clean-up. It produced the same plan summaries, state addresses and recovery shown above.

## 2. How to build it (teach it to the next trainee)

This is the order I would follow if I started again. The reasoning matters more than the commands: each step exists to make the next change verifiable before it touches anything real.

**1. Start small, and make one resource by hand.** Build a configuration with two `aws_ssm_parameter` resources and apply it. Then create a third parameter directly in the console (or with the AWS CLI), so it genuinely exists outside Terraform's management. The adopted resource has to be real and unmanaged beforehand; creating it with Terraform and then "adopting" it proves nothing. I used `/terraform-basics/m08/first`, `/terraform-basics/m08/second` and the hand-made `/terraform-basics/m08/legacy`.

**2. Make the rename a configuration change, not a state edit.** Rename the resource block in `main.tf` and add a `moved` block that records the old and new addresses:

```hcl
moved {
  from = aws_ssm_parameter.first
  to   = aws_ssm_parameter.primary
}
```

Save the plan with `terraform plan -out=rename.tfplan`. The summary must say `0 to add, 0 to change, 0 to destroy`, and the plan should show the old address "has moved to" the new one. The cloud-side `name`, `arn` and `id` stay the same; only the Terraform address changes. If the plan shows a destroy and a create, the `moved` block is wrong or missing — stop and fix it before applying.

**3. Adopt the hand-made resource with an import block.** Add:

```hcl
import {
  to = aws_ssm_parameter.legacy
  id = "/terraform-basics/m08/legacy"
}
```

Then run `terraform plan -generate-config-out=generated.tf`. The generated file is a starting point, not a finished product. Tidy it: keep the required `name`, `type` and `value`; remove redundant defaults such as `overwrite = false` and `tags = {}`; add the missing `description` and the `Name` tag that follows the M05 convention; and merge the block into `main.tf` instead of leaving it in a separate generated file. Save `adopt.tfplan`, apply it, then run a plain `terraform plan` and confirm `No changes. Your infrastructure matches the configuration.`

**4. Stop managing a resource without destroying it.** Remove the resource block and add a `removed` block:

```hcl
removed {
  from = aws_ssm_parameter.second

  lifecycle {
    destroy = false
  }
}
```

Save `remove.tfplan`. The plan should say the resource "will no longer be managed by Terraform, but will not be destroyed" and end with `0 to add, 0 to change, 0 to destroy`. Apply it, then prove from the cloud side that the parameter still exists and that `terraform state list` no longer shows it. "Stops being managed" is not "is gone": record who owns it now, and decide whether it is kept deliberately or deleted after the evidence is captured.

**5. Read each saved plan as JSON, not by eye.** Use `terraform show -json <plan>.tfplan` and `jq` to list the action on every resource. My filters were:

```
terraform show -json rename.tfplan | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.previous_address // "-")] | @tsv'
terraform show -json adopt.tfplan  | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.change.importing.id // "-")] | @tsv'
terraform show -json remove.tfplan | jq -r '.resource_changes[] | [.address, (.change.actions|join(",")), (.action_reason // "-")] | @tsv'
```

The action is the `change.actions` array (`no-op`, `create`, `update`, `delete`, or a delete/create pair for replacement). The rename also carries `previous_address`, the import carries `change.importing.id`, and the stop-managing carries `action_reason = "forget"`. That is the mechanical check: every resource appears, and none carries a destroy or a replacement.

**6. Break an apply on purpose, then recover through configuration.** Add a valid resource and an invalid one in the same apply. I used a 4097-character value for an SSM parameter, which passes Terraform's own validation but fails at the AWS API with a length constraint. The apply creates the valid resource and stops on the invalid one; the failed resource never gets an ID, so it is absent from state. Fix the value in `main.tf`, run a full `terraform plan`, apply, and confirm the next plan is clean. Do not edit state to "clean up" the partial apply.

**7. Write the legacy-command note while the difference is fresh.** For each imperative command (`import`, `state mv`, `state rm`, `state replace-provider`), write what it does, the declarative equivalent, and the situation where you would still meet it. The declarative form is preferred because it appears in a plan; the imperative form changes state without one.

**8. Capture the diffs and the state-command log.** Keep the `git diff` for each refactor. List every command you ran against state, including the inspection-only ones, and say what each did. The log is the evidence that the refactors were configuration changes, not state edits.

**9. Clean up, including the orphan.** `terraform destroy` removes everything still managed. The stopped resource is outside Terraform, so delete it from the cloud side after capturing the evidence. Confirm with `aws ssm describe-parameters` that nothing under your M08 prefix remains, and with `aws s3api head-bucket` that the M02 bucket is still there.

**10. Before calling it done.** Run `terraform fmt -check -recursive` and `terraform validate`, check that `git status` shows no state file and that `.terraform.lock.hcl` is committed, and make sure the write-up contains the three plan summaries, the JSON checks, the identity proof, the diffs, the state log, the partial-apply recovery and the legacy-command note.

## 3. Decisions & Core Concepts

### Key Decisions

**How can you tell before applying that a refactor won't touch real infrastructure, and how do you avoid orphaned cost when you stop managing a resource?**

I tell by reading the saved plan *and* its JSON form before applying. The plan summary must show zero destroys and zero replacements; the JSON check must list every resource with its action, so a destroy cannot hide in a resource I skimmed past. For a rename I also look for `previous_address`, for an import for `change.importing.id`, and for a stop-managing for `action_reason = "forget"`. Those fields tell me the plan is doing the refactor I intended, not a destroy-and-recreate that happens to look similar in the summary. I also confirm the cloud-side identity (the ARN or `id`) before and after the rename, because the plan describes intent and the cloud is the fact.

When a resource stops being managed, responsibility for it does not disappear — it moves from Terraform to a person. The `removed` block with `destroy = false` deliberately leaves it alive, so the cost is still real even though Terraform no longer tracks it. I avoid an accidental orphan by recording the hand-off, deciding up front whether the resource is meant to survive, and giving it an owner. In this lab I kept the stopped parameter only long enough to prove it survived, then deleted it from the cloud side during clean-up. In a real system I would tag it with an owner and a review date, or delete it in the same change if nobody needs it.

**What did the generated configuration get wrong or leave out, and how did you decide what to keep?**

The generated configuration was a useful starting point but not a finished resource block. It got the live values right — `name`, `type` and `value` — but it hard-coded the current value into the configuration, which is acceptable for a plain `String` and wrong for a `SecureString`; for a secret I would move the value to a variable and use `ignore_changes` so the configuration does not become a copy of the secret. It also carried redundant defaults (`overwrite = false`, `tags = {}`) that add noise without changing behaviour, and it left out the `description` and the `Name` tag that follow the M05 convention. I kept the required arguments, removed the defaults that the provider already supplies, added the description and tag, and merged the block into `main.tf` so the adopted resource lives with the rest of the configuration instead of in a generated file. The test I used was simple: every argument I kept had to be either required or a deliberate policy choice; everything else was noise.

**Why prefer changes that appear in a plan over commands that edit state, and when might you still meet those commands?**

A plan is a dry run I can read, review and save. It shows the action on every resource before anything changes, it participates in the state lock, and it leaves a record in the configuration that a reviewer can diff. A state command is imperative and invisible to the plan: it changes Terraform's belief about the world without showing what it will do, without a review step, and without a guarantee that the configuration still describes the resource. That is how a state edit and a real resource drift apart. The declarative blocks — `moved`, `import`, `removed` — are preferred because they turn the refactor into a plan-visible change.

I would still meet the imperative commands in inherited configurations, in older Terraform versions that predate the blocks, when repairing state that is already damaged, when changing a provider's source address, or in a one-off migration where the configuration cannot express the change yet. Even then, I would reach for them deliberately, after checking the cloud side, and not as the normal way to rename, adopt or forget a resource.

### Concepts Applied

**Reading plans as JSON with `jq`.** A saved plan is a file, and `terraform show -json` turns it into structured data. The part that matters for a refactor is `resource_changes[]`: each entry has an `address` and a `change.actions` array, and the array is the action Terraform will take. In my rename the only entry was `aws_ssm_parameter.primary` with `no-op` and `previous_address = aws_ssm_parameter.first`; in the adoption it was `aws_ssm_parameter.legacy` with `importing.id`; in the stop-managing it was `aws_ssm_parameter.second` with `action_reason = forget`. Reading the JSON is what makes "no destroys" a check rather than an impression.

**Recovering from a partial apply or a failed destroy.** A partial apply is not a broken state file; it is a state file that records exactly what succeeded. In my build the valid parameter was created and recorded, and the invalid one was absent because it never got an ID. Recovery is to read the error, check the cloud side and state, fix the configuration, and run a full plan before applying again. The same shape applies to a failed destroy: find the resource that failed and the reason, check whether it still exists, fix the cause in configuration, and re-run. The one thing not to do is edit state by hand to make the error disappear.

**Targeted operations.** `-target` limits a plan or apply to one resource or module. It is useful when recovering from a partial apply or when a full apply is risky, but it is an exception: a targeted apply can leave the rest of the configuration unapplied, and a targeted plan can hide changes elsewhere. After the broken apply I used a targeted plan to confirm that `aws_ssm_parameter.recovery_bad` was the only pending resource, then ran a full plan before applying, because the full plan is what proves nothing else moved. I would not use `-target` as the final step of a normal refactor.

## 4. AI Collaboration Log

- **Tools & Scope:** I used an AI assistant (Opencode) for roughly 10% of the work: comparing the declarative refactoring blocks with the legacy state commands, shaping the `jq` filters, and checking the recovery sequence after a partial apply. The configuration, the three refactors, the saved plans, the state inspection, the partial-apply experiment and the clean-up are mine.
- **Prompt Examples:** "What is the declarative equivalent of `terraform state mv`, `terraform import` and `terraform state rm`?" — "What does a Terraform plan's JSON look like for an import and for a removed block?" — "How do I recover from a partial apply without editing state?"
- **Course Correction:** The assistant's first suggestion was to use `terraform state mv` for the rename and `terraform state rm` for the stop-managing. That would have changed state directly, bypassed the plan, and missed the point of the stage, which is a declarative change verified by a saved plan. I rejected it and used `moved` and `removed` blocks. A second suggestion was to run `terraform import` as the adoption step; that adds the resource to state but writes no configuration, so I used an `import` block with `plan -generate-config-out` instead.
- **Human Intervention:** I wrote the initial configuration and the hand-made parameter setup; I chose the three refactors and their order; I wrote the `moved`, `import` and `removed` blocks; I tidied the generated configuration myself; I ran the saved plans and the `jq` checks; I caused and recovered from the partial apply; and I wrote the legacy-command note and this write-up. I accepted the general shape of the `jq` filters and the recovery checklist after testing them, but I rewrote the approach to state commands entirely.

## 5. Retrospective & Self-Assessment

### Friction Log (What tripped me up)

- **Planning an import before the configuration existed.** My first attempt added the `import` block and ran `terraform plan` without generating a configuration, which failed with:

  ```
  Error: Configuration for import target does not exist

  The configuration for the given import target aws_ssm_parameter.legacy
  does not exist. All target instances must have an associated configuration
  to be imported.
  ```

  Cause: an import block tells Terraform what to adopt, but the target resource still needs a configuration block. Fix: run `terraform plan -generate-config-out=generated.tf` first, tidy the generated file, then plan again.

- **A `jq` filter that forgot the array.** My first JSON check used `.resource_changes.change.actions` and failed with:

  ```
  jq: error (at <stdin>:0): Cannot index array with string "change"
  ```

  Cause: `resource_changes` is an array, so I needed to iterate it before reading `change`. Fix: `.resource_changes[] | [.address, (.change.actions|join(","))] | @tsv`.

- **The deliberate partial apply.** The invalid 4097-character value failed at the AWS API with:

  ```
  Error: creating SSM Parameter (/terraform-basics/m08/recovery-bad): ValidationException: 1 validation error detected: Value 'xxxxxxxx...' at 'value' failed to satisfy constraint: Member must have length less than or equal to 4096
  ```

  Cause: I deliberately exceeded the SSM standard-parameter value limit. The useful part was the state afterwards: `recovery_ok` was recorded and `recovery_bad` was not. Fix: correct the value in configuration, plan the whole configuration, apply, and confirm a clean plan.

- **The stop-managing hand-off took the most thought.** The plan and apply were straightforward; deciding what "no longer managed" means for cost and ownership was not. I had to be explicit that the parameter still existed, that Terraform no longer tracked it, and that I — not Terraform — was now responsible for deleting it. That is why the clean-up includes a separate cloud-side delete after the evidence is captured.

### What I'd do differently

If I started again, I would write the `jq` check once and run it on every saved plan from the first refactor, instead of adding the filters one at a time. I would also decide the adopted resource's tags and description before running `-generate-config-out`, so the generated file needed less tidying and the diff showed only deliberate choices.

### DoD Self-Assessment

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Met | Three saved plans show zero destroys and zero replacements; the rename, adoption and stop-managing are each checked with `terraform show -json` and `jq` on every resource. |
| DoD-02 | Met | The renamed parameter kept the same ARN, `id` and `name`; the adopted parameter is in state, described by configuration, and the post-adoption plan is clean; the stopped parameter still exists in AWS and is no longer in `terraform state list`. |
| DoD-03 | Met | A diff is shown for each refactor, and the state-command log lists every `state` command I ran, all inspection-only. |
| DoD-04 | Met | The legacy-command note gives what each imperative command does, its declarative equivalent and when I would still meet it. |
| DoD-05 | Met | The partial apply is captured with the exact error and the state afterwards; the recovery is through configuration, with a clean plan and no hand-edited state; the failed-destroy procedure is written down. |
| DoD-06 | Met | Terraform destroyed its four remaining resources, the stopped parameter was deleted from the cloud side, the prefix query returns `[]`, and the M02 bucket remains. |
| DoD-07 | Met | I followed the section 2 guide from a clean checkout and reproduced the three refactors, the JSON checks and the recovery. |

**Rubric self-rating:** Deliverable and definition of done — Excellent; configuration quality, security and cost — Satisfactory; design decisions — Excellent; how to build it — Satisfactory; concepts, obstacles and AI log — Satisfactory; understanding — Satisfactory.

### Blind Spots

I would need to re-read the details of `removed` with `destroy = true` and the interaction between `moved` blocks and modules before I could explain those cold. I also want to be more precise about when a targeted apply is safe during recovery, and about the edge cases of `terraform state rm` when a resource is already gone. Those are the next things I would study before the capstone.

**Status:** In review
**Date:** 2026-11-10
