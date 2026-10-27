# M08 — Change with Confidence: Safe Terraform Refactoring

*A self-guided tour: rename, adopt and stop managing resources without destroying anything.*

---

This tour walks you through three refactors, one part at a time. It shows you the **moves** — the blocks to write, the commands to run, the checkpoints to hit — and gives you a way to confirm each change before you move on.

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

## How to use this tour

Work through the seven parts in order. Each part has the same simple shape:

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

## Where you're headed

By the end of this tour you'll have:

- three refactors applied to a small configuration — a **rename**, an **adoption** and a **stop-managing**;
- each one verified by a saved plan showing **zero destroys and zero replacements**;
- at least one check that reads a saved plan's **JSON** form with `jq` and reports the action on every resource;
- an apply deliberately stopped part-way, the error captured, and the configuration brought back to a clean plan **without editing state by hand**;
- a short note on legacy imperative commands;
- nothing billable left behind, and evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list has **two** items here: which existing resource you will adopt and where it comes from, and how much detail your notes need. Confirm both with your trainer before you build.

---

## Part 1 — A small configuration, and one resource you didn't make

**Goal:** get a small configuration deployed, with one parameter created by hand.

**Try it**

1. Apply a small configuration with two `aws_ssm_parameter` resources.
2. Create a **third** parameter by hand in the console.
3. Confirm the third one is genuinely outside Terraform's management.

**Checkpoint**

- Two parameters are managed by Terraform; the third exists but Terraform doesn't know about it.

**Example — the shape of the managed parameters**

```
resource "aws_ssm_parameter" "first" {
  name  = "/<prefix>/first"
  type  = "String"
  value = "<a value>"
}

resource "aws_ssm_parameter" "second" {
  name  = "<...>"
  type  = "<type>"
  value = "<a value>"
}
```

**Pause and predict.** Before you adopt anything, predict what Terraform would say if you simply added a resource block for the hand-made parameter **without** an import. Then keep that prediction for Part 3.

> **Watch out.** The adopted resource must genuinely exist outside Terraform's management **beforehand** (a stack constraint). Don't create it with Terraform and then "adopt" it — that proves nothing.

---

## Part 2 — The rename: changing configuration, not state

**Goal:** rename a resource so nothing real is destroyed or replaced.

**Try it**

1. Rename one parameter in the configuration.
2. Add a `moved` block that records the rename.
3. Save a plan and read it carefully:

```
terraform plan -out=rename.tfplan
```

**Checkpoint**

- The saved plan shows **no destroys and no replacements** (DoD-01).
- The resource keeps its real-world identity — its cloud-side identifier is unchanged (DoD-02).

**Example — the shape of a `moved` block**

```
moved {
  from = aws_ssm_parameter.<old name>
  to   = aws_ssm_parameter.<new name>
}
```

The block is shown here. **How you can tell, before applying, that a refactor will not touch real infrastructure** is one of your research prompts.

**Pause and predict.** Before you run the plan, predict what the rename would have done **without** the `moved` block. Then look at your plan summary and count the destroys.

**Your turn**

- **How can you tell, before applying, that a refactor will not touch real infrastructure?**

> **Watch out.** The whole point is that no state file is edited. If a step tempts you to run a state command that *changes* something, stop — this stage does it declaratively.

---

## Part 3 — The adoption: bringing an existing resource under management

**Goal:** adopt the hand-made parameter, tidying the generated configuration.

**Try it**

1. Add an `import` block for the parameter you made by hand.
2. Generate a starting configuration:

```
terraform plan -generate-config-out=generated.tf
```

3. **Tidy** the generated file — it will need manual work.
4. Confirm the next plan shows no changes:

```
terraform plan
```

**Checkpoint**

- The adopted resource is in state and described by configuration.
- A plan after adoption shows **no changes** — `No changes. Your infrastructure matches the configuration.`
- The diff of your configuration change is in your evidence (DoD-03).

**Example — the shape of an `import` block**

```
import {
  to = aws_ssm_parameter.<name>
  id = "<the existing resource's identifier>"
}
```

The block is shown here. **What the generated configuration got wrong or left out, and how you decided what to keep**, is your research prompt.

**Pause and predict.** Return to your Part 1 prediction. Did the generated configuration match the real resource exactly, or did it need fixes? Note what needed changing.

**Your turn**

- **What did the generated configuration get wrong or leave out, and how did you decide what to keep?**

> **Watch out.** The generated file is a starting point, not a finished product. Tidying it is part of the work (a stack constraint) — don't just accept it.

---

## Part 4 — The stop-managing: letting go without deleting

**Goal:** stop managing a resource while leaving it alive in AWS.

**Try it**

1. Add a `removed` block for one parameter.
2. Apply, then check the resource **from the cloud side** — it should still exist.

**Checkpoint**

- The parameter still exists in AWS afterwards.
- Terraform no longer tracks it.
- No billable resource is orphaned by accident without your knowledge (DoD-06).

**Example — the shape of a `removed` block**

```
removed {
  from = aws_ssm_parameter.<name>

  lifecycle {
    destroy = false
  }
}
```

The block is shown here. **What is responsible for a resource that stops being managed, and how you avoid orphaning cost**, is your research prompt.

**Pause and predict.** Before you apply, predict what the plan will show for a monument that is being removed from management rather than destroyed. Then check.

**Your turn**

- **What is responsible for a resource that stops being managed — and how do you avoid orphaning cost?**

> **Watch out.** "Stops being managed" is not "is gone". Confirm from the cloud side that the resource survived, and be clear about who now looks after it.

---

## Part 5 — Verifying with a saved plan's JSON

**Goal:** check every resource's action mechanically, not by eye.

**Try it**

1. Save a plan for each of the three refactors.
2. For each saved plan, read its JSON form and list the action on **every** resource:

```
terraform show -json <plan>.tfplan | jq '<your filter>'
```

**Checkpoint**

- At least one of the three checks reads the saved plan's JSON and reports the action on every resource (DoD-01) — not a plan read by eye.

**Example — the shape of the command**

```
terraform show -json <plan>.tfplan | jq '<the expression that lists each resource's action>'
```

The command shape is shown here; **what the action on every resource looks like in a saved plan's JSON form**, and the `jq` expression that surfaces it, are your research prompt.

**Pause and predict.** Before you run it, predict how many resources you'll list for the rename, and what action you expect each to carry.

**Your turn**

- **What does the action on every resource look like in a saved plan's JSON form?**

> **Watch out.** DoD-01 wants the output **pasted**. Reading a plan by eye is exactly what this step exists to replace.

---

## Part 6 — When a change stops part-way

**Goal:** cause a failure on purpose, see what state holds, and recover without editing state.

**Try it**

1. Break an apply on purpose — for example, with an invalid value.
2. Read the error, and check what state holds afterwards.
3. Fix the configuration and re-run until you reach a clean plan **without editing state by hand**.
4. Write your short note on legacy imperative commands.

**Checkpoint**

- The error is captured, and what state holds afterwards is recorded (DoD-05).
- The configuration is back to a clean plan, with no hand-editing of state.
- A note saying when you'd meet legacy imperative commands, and the declarative equivalent (DoD-04).

**Example — the shape of your state-command log (DoD-03)**

| Command I ran against state | What it did |
| --- | --- |
| `<command>` | `<inspection only, or what it changed>` |

List **every** state command you ran — including the ones that changed nothing.

**Pause and predict.** Before you run the broken apply, predict whether the failure will leave the already-created resources running. Then check from the cloud side.

**Your turn**

- **How do you recover when an apply stops part-way, and what do you check before running it again?**
- **Why does the course prefer changes that appear in a plan over commands that edit state — and when might you still see those commands?**
- **What should you do after a failed destroy?**

> **Watch out.** DoD-05 forbids editing state by hand to fix the mess. Recover through configuration. And keep the **exact** error text — it's evidence.

> **Explain it.** In one sentence, say why "change the configuration and read the plan" is safer than "edit the state", as if to a teammate who's about to reach for a state command.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- three plan summaries, each showing **zero destroys and zero replacements**;
- a JSON check (with `jq`) reporting the action on every resource;
- the renamed resource's unchanged cloud-side identifier;
- a post-adoption plan showing no changes, and the tidied generated configuration;
- proof the stop-managed resource still exists, and that Terraform no longer tracks it;
- the configuration diff for each refactor, and your state-command log;
- the captured error and state afterwards, plus the recovery to a clean plan;
- your note on legacy imperative commands;
- no billable resource left behind, only the M02 bucket.

### 7b. The clean-up gate

Before you call the stage done, confirm:

- **No billable resource is left behind.** Only the M02 bucket remains.
- **The stop-managed resource is accounted for.** If it still exists, you know that, and you've said who looks after it.
- **Nothing is left running.** Confirm from the cloud side.
- **No state file is committed.** State lives in the bucket under its own key.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

Confirm with `git status` that no state file appears and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the three refactors and the configuration they apply to. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas from this stage, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time — here it has two items, including which resource you adopted.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `main.tf` | The configuration you refactor — the parameters and the three refactoring blocks. |
| `generated.tf` | The starting configuration generated when you adopt; you tidy it by hand. |
| `rename.tfplan` (and the others) | The saved plans you verify — and read as JSON. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your state-command log and your teaching guide. |

| Command | What it does |
| --- | --- |
| `terraform plan -out=<file>` | Saves a plan you can inspect and read as JSON. |
| `terraform plan -generate-config-out=generated.tf` | Generates a starting configuration for adoption. |
| `terraform show -json <file>` | Prints a saved plan's JSON form. Pipe to `jq`. |
| `terraform apply` | Applies a refactor. Read the plan first. |
| `terraform state list` | Inspection only — it doesn't change anything. |

| Refactoring block | In one line |
| --- | --- |
| `moved` | Records a rename so the resource isn't destroyed. |
| `import` | Brings an existing resource under Terraform's management. |
| `removed` | Stops managing a resource without destroying it. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
