# M02 — Managing Terraform State

*A self-guided tour: from local state on your machine to a protected S3 backend with locking.*

---

This tour walks you through moving Terraform's state off your machine and into a protected remote backend, one part at a time. It shows you the **moves** — the files to write, the commands to run, the checks to make — and gives you checkpoints so you always know whether you're on track.

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

## How to use this tour

Work through the six parts in order. Each part has the same simple shape:

| Box | What it means |
| --- | --- |
| **Try it** | A command or action to perform now. |
| **Checkpoint** | What you should see if you got it right. If you don't, stop and fix it before moving on. |
| **Pause and predict** | Think before you act. Write down your guess, then check it against what actually happens. |
| **Example** | A worked illustration of the *shape* of a file, a command's output, or a note's format. Placeholders sit in `<angle brackets>`; yours will differ. |
| **Your turn** | One of your brief's research prompts. Investigate it and record your answer in your write-up. |
| **Watch out** | A common trap. Read it before you hit it. |
| **Explain it** | A nudge to say something in your own words — this is what you'll be asked to teach later. |

You'll see **Example** boxes often. They show you the **shape** of things — a file's structure, what a command's output looks like, how to lay out your notes — so the mechanics are never a surprise. Two rules about them:

- An Example never contains the answer to a research prompt. If it looks like it might, it deliberately stops short: the last step is always yours.
- **Never paste an Example as your own evidence.** Your evidence must be real output from *your* machine. Examples are teaching aids, not proof.

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — the objective, the scope, the constraints, the deliverable and the definition of done. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end. When you fill in the "How to build it" section, write it for someone who will follow it with no trainer to ask.

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your code in your own GitLab repository. Link that repository from **What I built** in your write-up. This stage uses **two** folders: one for the small configuration, and one for the state bucket.

## Where you're headed

By the end of this tour you'll have:

- inspected your own local state, read-only, and seen where a sensitive value sits;
- a protected S3 bucket — versioned, encrypted, with public access blocked — that outlives the stage;
- a configuration whose local state you migrated into that bucket as its remote backend, with a plan showing nothing was recreated;
- native locking demonstrated with a real lock error;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially whether your sandbox role can create and delete the lock object (if it can't, that's a sandbox gap to raise, not something to work around).

---

## Part 1 — Local state, seen for the first time

**Goal:** write a small configuration, apply it, and watch a state file appear on your machine.

State is the part of Terraform that most people meet only when it breaks. This stage starts by building a tiny configuration so you have your *own* state to inspect — not a slide.

**Try it**

1. In a new build folder, create a small configuration with one `aws_ssm_parameter`. Give its value a **made-up placeholder password** — never a real secret.
2. Initialise and apply:

```
terraform init
terraform apply
```

3. Look in the folder: a `terraform.tfstate` file appears.

**Checkpoint**

- `apply` succeeds and creates one parameter.
- `terraform.tfstate` now sits in the folder.

**Example — a minimal configuration**

```
resource "aws_ssm_parameter" "placeholder" {
  name  = "/m02/<your-name>"
  type  = "String"
  value = "<a-made-up-placeholder-password>"
}
```

The value is a placeholder on purpose: in the next part you'll inspect it, and the whole point is to do that **without ever handling a real credential**.

**Pause and predict.** Before you apply, guess whether a state file will appear at all, and what it might contain. Then apply and look. Were you right?

**Your turn**

- **What would you check before trusting a state file you did not create — and what goes wrong when state is edited by hand?**

> **Watch out.** Do not put a real password, key or token in the `value`. A made-up placeholder is enough, and keeping real credentials out of state is a rule your definition of done checks (DoD-02).

> **Explain it.** In one sentence, say what the state file is *for*, as if to a teammate who has never used Terraform.

---

## Part 2 — Inspecting state, read-only — and why it's sensitive

**Goal:** look at your own state without changing anything, and see where a sensitive value sits.

You can read state with Terraform's own subcommands, or by opening the file. Both are **read-only** here: in this stage you change nothing about state outside the plan and apply cycle.

**Try it**

1. List what your state is tracking:

```
terraform state list
```

2. Show one resource in detail:

```
terraform state show aws_ssm_parameter.placeholder
```

3. Open `terraform.tfstate` in your editor and find where the placeholder value sits.
4. Add an ignore rule so state never goes into version control:

```
.terraform/
terraform.tfstate*
```

**Checkpoint**

- `state list` names your one resource.
- `state show` prints its attributes.
- You can point to the placeholder value inside `terraform.tfstate`.

**Example — `state list` and `state show` (trimmed)**

```
$ terraform state list
aws_ssm_parameter.placeholder

$ terraform state show aws_ssm_parameter.placeholder
# aws_ssm_parameter.placeholder:
resource "aws_ssm_parameter" "placeholder" {
    arn      = "..."
    id       = "/m02/<your-name>"
    name     = "/m02/<your-name>"
    type     = "String"
    value    = "<your placeholder value>"
    ...
}
```

Look at the attributes Terraform is holding for a resource you wrote one line for. What your state file records — and who can read it — is exactly what this stage is about.

**Pause and predict.** Before you open the file, guess whether your placeholder value will appear in `terraform.tfstate` just as you typed it. Then look.

**Your turn**

- **What can leak a secret into state, and how would you demonstrate that safely without a real credential?**
- **Why does the course treat a state file as sensitive even when the configuration contains no secrets?**

> **Watch out.** Treat every state file as if it already contains a secret. Do the inspection read-only, redact before you paste anything into your write-up, and never commit the file (DoD-06 checks the ignore rule and a clean history).

---

## Part 3 — Building and protecting the state bucket

**Goal:** create the S3 bucket that will hold your state — versioned, encrypted, private — in its own folder, with its own local state.

**This bucket is kept when everything else is destroyed.** Later stages keep their state in it too, so build it as something you would trust to hold their state.

**Try it**

1. In a **separate folder**, write a configuration with an `aws_s3_bucket`.
2. Add versioning, encryption at rest, and a public access block.
3. Look up what the bucket bills **before** you create it (it bills for as long as it exists). Then:

```
terraform init
terraform apply
```

4. Confirm from the **cloud side** — not from your configuration — that versioning is on, encryption is on, and public access is fully blocked.

**Checkpoint**

- The bucket exists.
- Every protection is visible from the cloud side (the console or the CLI), not only in your `.tf` files.

**Example — the shape of the bucket configuration**

```
resource "aws_s3_bucket" "state" {
  bucket = "<your-bucket-name>"
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

The lab names these four protections, so the shape is given here — but the exact fields each block needs are yours to confirm in the provider docs, and **how narrow you can make access without breaking Terraform is one of your research prompts**.

**Pause and predict.** Before you apply, guess whether Terraform will make your bucket private or leave it public. Then check from the cloud side.

**Your turn**

- **How did you solve the problem of creating the thing that stores your state — and what would you do differently on a team?**
- **Who and what needs access to the bucket, and how narrow can you make that without breaking Terraform?**
- **Why is the bucket kept when everything else is destroyed — and what risk does that carry?**

> **Watch out.** Do not skip the cloud-side check. "It's in my configuration" is not evidence that it is *actually* encrypted or private; DoD-04 wants it confirmed from the cloud.

---

## Part 4 — Moving state into the backend, and proving nothing changed

**Goal:** point the first configuration at the bucket and migrate its local state into it — without recreating anything.

**Try it**

1. Back in your **first** configuration, add a `backend "s3"` block that points at the bucket, with native locking turned on.
2. Migrate the existing local state into it:

```
terraform init -migrate-state
```

3. When Terraform offers to copy your existing state to the new backend, accept.
4. Check that nothing was recreated:

```
terraform plan
```

**Checkpoint**

- `init -migrate-state` completes and says it configured the new backend.
- `plan` reports **no changes** — nothing was recreated.

**Example — the backend block**

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

**Example — the plan after migrating**

```
No changes. Your infrastructure matches the configuration.
```

That "no changes" is the whole point of migrating rather than starting over: Terraform moved its record of your resource into the bucket, so the resource itself was left alone.

**Pause and predict.** Before you run `plan`, predict: will Terraform want to recreate your parameter, or leave it alone? Then run it and compare.

**Your turn**

- **What does a remote backend give a team that local state cannot?**
- **How do you know that nothing was recreated?**

> **Watch out.** If `plan` shows anything to add, change or destroy, the migration did not line up — investigate before you do anything else, and never edit state by hand. And once the state lives remotely, the old local `terraform.tfstate` is stale: don't treat it as the source of truth.

> **Explain it.** In one sentence, say what changed for your configuration when the state moved into the bucket.

---

## Part 5 — Locking: one operation holds, a second waits

**Goal:** watch native locking refuse a second operation while one is in progress.

**Try it**

1. In one terminal, start an operation and leave it **at the approval prompt** (do not confirm):

```
terraform apply
```

2. In a **second** terminal, run:

```
terraform plan
```

3. Read the lock error. Capture it — it is required evidence.

**Checkpoint**

- The second command is **refused** with a lock error, naming the operation that holds the lock.

**Example — the lock error (trimmed)**

```
Error: Error acquiring the state lock

Error message: <the message recorded with the lock>
Lock Info:
  ID:        <...>
  Path:      <...>
  Operation: <...>
  Who:       <...>
  Version:   <...>
  Created:   <...>
```

The real error continues with a short paragraph explaining what locking is for. Read that paragraph yourself — deciding **what locking prevents, and what it does not**, is one of your research prompts, so it isn't spelled out here.

**Pause and predict.** Before the second command runs, predict whether it will queue politely and wait, or stop with an error. Then run it.

**Your turn**

- **What does locking prevent — and what does it not?**

> **Watch out.** If your sandbox role cannot create and delete the lock object, you'll see a permissions error instead. That is a gap in your sandbox access: tell your trainer rather than working around it.

---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. The definition of done applies in full — but your write-up's **Checkpoint evidence** section collects the evidence into three slots:

- **DoD-01 and DoD-02** — your read-only local state output for one of your own resources, including what it holds for the placeholder value.
- **DoD-03 and DoD-04** — the bucket listing showing your migrated state, and the bucket's versioning, encryption and public-access settings from the cloud side.
- **DoD-05** — the lock error you got when a second operation ran while the first was in progress.

Every slot wants **real pasted output**, trimmed to the relevant lines and redacted — not a description from memory. Redact the account ID and ARN as your trainer directs, and never paste a real value where a placeholder stood in for one.

Two more items from the brief's definition of done sit outside those three slots, and still need evidence in your write-up: the bucket retained and everything else destroyed, confirmed from the cloud side, with a clean history and no state committed (DoD-06). DoD-07 is answered by the write-up itself — follow it end to end from a clean state and say so.

### 6b. The clean-up gate

This stage has one exception to the usual rule: **you keep the bucket.** Before you call the stage done, confirm:

- **No stored credential.** Nothing long-lived anywhere.
- **No state in version control.** `terraform.tfstate*` is ignored and never committed — check a clean commit history.
- **Everything else destroyed, bucket kept.** Destroy the small configuration's resources and any other resources you created, confirmed from the cloud side, but **leave the bucket in place** for the later stages that reuse it.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

The rule of thumb: **keep state out, keep the lock file in.** Confirm with `git status` that no `terraform.tfstate` appears, and that `.terraform.lock.hcl` stays committed.

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`. It is a short document with nine sections, in this order — use the template's section names as they are, and answer each one in your own words:

| Section | What goes in it |
| --- | --- |
| **What I built** | The protected S3 state bucket and the small configuration whose local state you inspected and then migrated into it. Link your repository. |
| **Why it's built this way (key decisions)** | The four key decisions below — what you considered, what you chose, why, and what you gave up. |
| **AI collaboration log** | Specific: which tools, two or three concrete asks, one suggestion that was wrong and what you did instead, and what you wrote yourself. Or one line saying you used none. |
| **How to build it (teach it to the next engineer)** | A guide from local state to a protected remote backend with locking demonstrated, using your own state output to show the reasoning, not just the commands. Follow it yourself end to end before you call it done. |
| **Concepts worth explaining** | Two or three ideas — what state records and where it lives, why a team needs a remote backend, or migrating local state without recreating anything — in your own words, each with an example from *your* build. |
| **What tripped me up** | Anything that didn't behave the way you expected the first time, with the exact error text. (These become the course's common-errors list.) |
| **Checkpoint evidence** | The three evidence slots from 6a: pasted output, trimmed and redacted, or a screenshot. |
| **Definition-of-done self-assessment** | Met / partly met / not met for every DoD item and why, your rating against each stage-rubric criterion in the README, and anything you'd struggle to explain cold. |
| **What I'd do differently** | If you started this stage over, what would you do differently? |

The four key decisions, in the template's words:

1. What can leak a secret into state, and why is a state file sensitive even when the configuration has no secrets?
2. Who and what needs access to the state bucket, how narrow can you make it, and why is the bucket kept when everything else is destroyed?
3. What does locking prevent, and what does it not?
4. Where did you spend the most time, and why?

Each decision gathers answers from the research prompts you investigated on the way, so every prompt you answered still has a home:

| Key decision | Where the answers come from |
| --- | --- |
| 1 — what can leak a secret into state, and why a state file is sensitive even with no secrets in it | Part 1 — its prompt about a state file you did not create and about hand-editing state — and Part 2 — both of its prompts |
| 2 — who and what needs access to the bucket, how narrow it can be, and why the bucket is kept | Part 3 — all three of its prompts |
| 3 — what locking prevents, and what it does not | Part 5 — its prompt — and the Part 4 prompts about what a remote backend gives a team and how you know nothing was recreated |
| 4 — where the time went | Your own answer. The Part 4 prompts also feed your **Concepts worth explaining**, which the template names for exactly those two ideas. |

Then tell your trainer the stage is ready for review.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm the item you'll be asked about at review: whether your sandbox role can create and delete the lock object.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `<first config>.tf` | The small configuration whose local state you inspected and then migrated. |
| `<bucket config>.tf` | The state bucket and its versioning, encryption and public-access settings. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `terraform state list` | Lists the resources your state is tracking (read-only). |
| `terraform state show <addr>` | Prints one resource's stored attributes (read-only). |
| `terraform init -migrate-state` | Moves existing local state into the configured backend. |
| `terraform plan` | Shows what would change. After migration, expect **no changes**. |
| `terraform apply` | Makes the changes; here it also creates the bucket. |
| `terraform destroy` | Removes what you created — but **not** the state bucket. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
