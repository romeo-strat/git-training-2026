# M07 — Designing Reusable Terraform Modules

*A self-guided tour: package part of a configuration as a reusable module, call it twice, and read a module you didn't write.*

---

This tour walks you through building a reusable module, one part at a time. It shows you the **moves** — the files to create, the commands to run, the checkpoints to hit — and gives you a way to confirm each step before you move on.

It does **not** do the thinking for you. Your brief asks you to work out a lot here (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

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

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — the objective, the scope, the constraints, the deliverable and the definition of done. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end.

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your code in your own GitLab repository. Link it from the header of your write-up.

> **Builds on M02, M04, M05 and M06.** You need the M02 state bucket, typed inputs from M04, the M05 environment arrangement, and the data-driven habits from M06. If any isn't accepted yet, sort that out before you start.

## Where you're headed

By the end of this tour you'll have:

- a reusable AWS module with a **standard file structure** and a documented, commented interface;
- a root configuration that calls it **at least twice** with different inputs;
- clean plans for both calls, and a state listing showing distinct module paths;
- names and tags that still follow M05's convention through the module;
- a review of one **published** module you did not write;
- a decision note on what you put in the module and what you left out;
- everything destroyed (the bucket kept), and evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list here is short — the one item is how much detail your notes need. Confirm that with your trainer before you invest significant time.

---

## Part 1 — Moving something into a module

**Goal:** take part of an earlier configuration and package it as a module.

**Try it**

1. Move part of an earlier configuration — the network from M03 — into a module with a standard layout.
2. Use the four standard files so a newcomer can find things by name.

**Checkpoint**

- The module is a folder with the standard files, and the root configuration no longer holds those resources directly.

**Example — a standard module layout**

```
modules/network/
  main.tf         # the resources
  variables.tf    # the inputs
  outputs.tf      # what the module exposes
  versions.tf     # the version requirements
```

**Example — the shape of a module's version requirements**

```
terraform {
  required_version = "<pinned from versions.env>"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "<pinned from versions.env>"
    }
  }
}
```

The files and the requirement block are shown here. **What belongs inside a module and what should stay in the root, and how you drew that line**, and **what a module call hands to the module and what it gets back**, are your research prompts.

**Pause and predict.** Before you move anything, predict which values the module will still need as **inputs** once the resources are inside it.

**Your turn**

- **What belongs inside a module, and what should stay in the root? How did you draw that line?**
- **What does a module call hand to the module, and what does it get back?**
- **How should a module's files be laid out so a newcomer finds inputs, outputs and resources without being told?**

> **Watch out.** A module is only reusable if its boundary is deliberate. If you move everything in, or leave everything out, you haven't made a decision yet — revisit it.

---

## Part 2 — A documented, commented interface

**Goal:** give the module a deliberate interface: typed inputs, described outputs, validation, and comments that explain **why**.

**Try it**

1. Give **every** input a type and a description.
2. Give **every** output a description.
3. Add one `validation` that rejects a bad value.
4. Add comments that explain **why**, not what.
5. Pick one naming convention and follow it for inputs, outputs and internal resources.

**Checkpoint**

- Every input has a type and description; every output has a description (DoD-02).
- Inputs that can take a bad value are validated.
- Names follow one convention, which you can state (DoD-03).
- Comments explain why, not what.

**Example — the shape of a documented, validated input**

```
variable "<name>" {
  type        = <type>
  description = "<what this input is for>"

  validation {
    condition     = <a condition that must hold>
    error_message = "<your message>"
  }
}
```

The block is shown here. **Which inputs you exposed and which you fixed, what each extra input costs the next person, and what a caller needs to be told by a module's outputs**, **which naming convention you chose and why**, and **what deserves a comment versus what the code should make obvious**, are your research prompts.

**Pause and predict.** Before you write the descriptions, predict: how many inputs does a newcomer need to read the module to understand? Then count how many you actually exposed.

**Your turn**

- **Which inputs did you expose and which did you fix? What does each extra input cost the next person, and what does a caller need to be told by a module's outputs?**
- **Which naming convention did you choose, and why?**
- **What deserves a comment in a module, and what should the code make obvious without one?**

> **Explain it.** In one sentence, say why a module's outputs are part of its contract, not just a convenience.

> **Watch out.** Don't comment the obvious (`# set the name`) and leave the surprising un-commented. The comment belongs where a reader would otherwise ask "why?".

---

## Part 3 — Calling the module twice

**Goal:** use the same module twice, with different inputs.

**Try it**

1. In the root configuration, call the module twice — as `module "dev"` and `module "prod"`.
2. Point both calls at the same local module, and give each its own inputs:

```
module "dev" {
  source = "./modules/network"
  <the inputs, set for dev>
}

module "prod" {
  source = "./modules/network"
  <the inputs, set for prod>
}
```

**Checkpoint**

- Two calls of the same module, with different inputs.
- Not two copies of the module — one module, called twice.

**Example — see above**

The call shape is shown here. **What stays shared between the calls and what each call owns** is your research prompt.

**Pause and predict.** Before you plan, predict how many sets of resources the two calls will produce, and whether the two calls can see each other's resources.

**Your turn**

- **What stays shared between the calls, and what does each call own?**

> **Watch out.** DoD-01 is explicit: two calls with **different** inputs, not one call pasted twice. If the two calls are identical, you haven't shown reuse.

---

## Part 4 — Seeing the module paths

**Goal:** deploy both calls and look at how the module shows up in the addresses.

**Try it**

1. Run the full sequence:

```
terraform init
terraform plan
terraform apply
```

2. Then list the resources and look at their addresses:

```
terraform state list
```

3. Notice the **module paths** in the addresses, and how the two calls differ.

**Checkpoint**

- Both calls produce clean plans, captured separately (DoD-01).
- The state listing shows **distinct** module paths for the two calls (DoD-01).
- You can say where the module's region, account and environment name come from (DoD-04).

**Pause and predict.** Before you look, predict what will mark a resource as belonging to the `dev` call rather than the `prod` call. Then check the listing.

**Your turn**

- **How do resource addresses change when something moves into a module — and what would that mean for a configuration that is already deployed?**
- **What does a module assume about provider configuration, and where does it take its region, account and environment name from?**

> **Watch out.** DoD-04 says the provider assumption must be stated honestly — not that it "just works". Find where the module's region and account actually come from and write that down.

---

## Part 5 — Reading a module you didn't write

**Goal:** review a published module before you would trust it.

**Try it**

1. Find a published module on the Terraform Registry.
2. Read its source.
3. Write down:
   - its **pinned version**;
   - its **inputs** and **outputs**;
   - **what you checked** before deciding to trust it.

**Checkpoint**

- A written review: source, pinned version, inputs, outputs, and what you checked (DoD-05).

**Example — the shape of a module review note**

| Field | Your note |
| --- | --- |
| Source | `<where it lives>` |
| Pinned version | `<exact version>` |
| Inputs | `<what a caller must supply>` |
| Outputs | `<what it exposes>` |
| What I checked before trusting it | `<...>` |

The table is the format; the review is yours.

**Pause and predict.** Before you read the source, predict how much of what it does you'll be able to work out from its inputs and outputs alone.

**Your turn**

- **What does pinning protect you from, for each kind of module source?**
- **How much do you trust a module you did not write — and what do you check before using it?**

> **Watch out.** A module from the Registry is still code. DoD-05 wants the version pinned to an exact value, and your own account of what you checked — not a description of the module's README.

---

## Part 6 — Convention, and the decision note

**Goal:** confirm the names and tags still hold through the module, and say when a module is the wrong answer.

**Try it**

1. Check that the names and tags of what the module creates still follow **M05's** convention.
2. Write your **decision note**: what you put in the module, what you left out, and a case where you would **not** write a module.
3. Then destroy:

```
terraform destroy
```

**Checkpoint**

- Names and tags follow M05's convention, shown from the plan, state or cloud side (DoD-04).
- A decision note with what's in, what's out, and when not to write a module (DoD-05).
- Everything destroyed, and the bucket retained (DoD-06).

**Example — the shape of the decision note**

| Question | Your answer |
| --- | --- |
| What I put in the module | `<...>` |
| What I left out, and why | `<...>` |
| A case where I would **not** write a module | `<...>` |

**Pause and predict.** Before you destroy, predict whether the names and tags changed when the resources moved into the module. Then check against what you saw.

**Your turn**

- **When is a module the wrong answer?**

> **Watch out.** It is easy to assume "more modules" is better. DoD-05 asks you to name a case where you would **not** write one — take that seriously.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- passing `fmt`/`validate` for **both** the module and the root configuration;
- two calls with different inputs, each with its own clean plan, captured separately;
- a state listing showing **distinct** module paths;
- a documented interface: typed, described inputs, validated where needed, described outputs;
- one naming convention stated, and your comment choices explained;
- the provider assumption stated, and names/tags shown from the plan, state or cloud side;
- your review of one published module, plus the decision note;
- everything destroyed except the M02 bucket, confirmed from the cloud side.

### 7b. The clean-up gate

Before you call the stage done, confirm:

- **Everything is destroyed except the M02 bucket.** Keep the bucket and its lock configuration.
- **Nothing is left running.** Confirm from the cloud side, not just from Terraform's output.
- **No state file is committed.** State lives in the bucket, keyed per environment as in M05.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

Confirm with `git status` that no state file appears and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the module and the root configuration that calls it, and how it is laid out. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up. (There are a lot of prompts here; be brief but real on each.)
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas from this stage, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time — here it is just the note about how much detail your notes need.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `modules/network/main.tf` | The resources the module owns. |
| `modules/network/variables.tf` | The module's inputs, typed, described and validated. |
| `modules/network/outputs.tf` | The module's outputs, each described. |
| `modules/network/versions.tf` | The module's version requirements, pinned. |
| `main.tf` (root) | The two module calls, `dev` and `prod`. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your module review and your decision note. |

| Command | What it does |
| --- | --- |
| `terraform init` | Initialises the root configuration and its module. |
| `terraform plan` | Shows each call's resources. Capture both calls separately. |
| `terraform apply` | Creates both calls' resources. |
| `terraform state list` | Shows the addresses, including the module paths. |
| `terraform destroy` | Removes both calls' resources. Keep the bucket. |

| Idea | In one line |
| --- | --- |
| Root module | The configuration you run commands in. |
| Child module | A reusable package a root calls. |
| Module call | `module "<name>" { source = ... }` — hands inputs in, gets outputs back. |
| Module path | The part of a resource address that marks which call it belongs to. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
