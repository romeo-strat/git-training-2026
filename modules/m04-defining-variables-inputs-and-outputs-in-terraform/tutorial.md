# M04 — Defining Variables, Inputs and Outputs in Terraform

*A self-guided tour: turn a hard-wired configuration into a parameterised one, and find out by experiment which value wins.*

---

This tour walks you through parameterising a configuration, one part at a time. It shows you the **moves** — the blocks to write, the commands to run, the experiments to set up — and gives you checkpoints so you always know whether you're on track.

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

## Where you're headed

By the end of this tour you'll have:

- a parameterised configuration in which the region, the network address ranges and the name prefix are all inputs;
- a validation rule that rejects a bad address range at plan time;
- a record of your precedence experiments, one source at a time, then combined;
- a sensitive input and a sensitive output, with notes on what the marking does and does not hide;
- two different sets of values that both plan cleanly, and everything destroyed;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list here is short — the one item is how much detail your notes need. Confirm that with your trainer before you invest significant time.

---

## Part 1 — Turning hard-wired values into inputs

**Goal:** replace the hard-coded region, address range and name prefix with `variable` blocks.

**Try it**

1. Take your M03 network (or rebuild it) and find the hard-coded region, address ranges and name prefix.
2. Replace each with a `variable` block that has a **type** and a **description**.
3. Decide, for each input, whether to give it a **default** — or leave it required.
4. Confirm the configuration is sound:

```
terraform fmt
terraform validate
```

**Checkpoint**

- Every variable has `type` and `description` (DoD-02).
- No region, address range or name prefix is left hard-coded in the main file (DoD-03).

**Example — the shape of a `variable` block**

```
variable "vpc_cidr" {
  type        = string
  description = "<what this input is for>"
  default     = "<a default value, or omit this line to make it required>"
}
```

The block's fields are shown here; **which** inputs deserve a default and which should be required — and the risk of each choice — is one of your research prompts.

**Pause and predict.** Before you plan, guess what Terraform will use for a variable that has a default and no value supplied. Then run it and check.

**Your turn**

- **Which inputs should have defaults and which should be required — and what is the risk of each?**

> **Watch out.** Don't leave a stray hard-coded region or CIDR behind. DoD-03 has a reviewer read the configuration and confirm the main file contains none of them.

---

## Part 2 — Rejecting bad values at plan time

**Goal:** add a validation rule that stops a bad address range before anything is planned.

**Try it**

1. Add a `validation` block to the address-range variable.
2. Trip it on purpose:

```
terraform plan -var vpc_cidr=10.0.0.0/33
```

3. Confirm the message you get is **your** `error_message`, and that nothing is planned for creation.

**Checkpoint**

- The bad value is rejected at plan time.
- The error carries your validation message, and the plan creates nothing (DoD-02).

**Example — the shape of a `validation` block**

```
variable "vpc_cidr" {
  type = string

  validation {
    condition     = <a condition that must be true for the value to be allowed>
    error_message = "<your message, shown when the condition is false>"
  }
}
```

The syntax is shown here. **Which** rules deserve plan-time validation, which are better left for AWS to reject at apply time, and **where a typed variable stops being enough**, are your research prompts — so the condition itself is left for you to work out.

**Pause and predict.** Before you run the command, predict: will the bad value be rejected, or will it reach AWS? Then run it.

**Your turn**

- **Which rules deserve plan-time validation, and which are better left for AWS to reject at apply time?**
- **Where does a typed variable stop being enough?**

> **Watch out.** A validation rule you wrote but never triggered is not evidence. DoD-02 wants the real rejection output, so trip it and keep the result.

---

## Part 3 — Deriving a value once with a local

**Goal:** name a value you use in more than one place, and use it everywhere from one definition.

**Try it**

1. Find a value your configuration builds from other values and uses in more than one place.
2. Define it once in a `locals` block.
3. Replace the repeats with a reference to the local.
4. Check:

```
terraform fmt
terraform validate
```

**Checkpoint**

- At least one value is derived once and used in more than one place (DoD-03).

**Example — the shape of a `locals` block**

```
locals {
  name_prefix = "<a value derived from your inputs, used in more than one place>"
}
```

**Your turn**

- **When is a local value clearer than repeating an expression — and when does it hide too much?**

> **Explain it.** In one sentence, say why deriving a value once is easier to maintain than repeating it, as if to a teammate.

---

## Part 4 — The precedence experiments

**Goal:** find out, by experiment, which source of a value wins — one source at a time, then combined.

This is the heart of the stage. Set it up carefully, because the results only mean something if each experiment isolates exactly one source.

**Try it**

1. Supply **one** variable from **one** source at a time:
   - its default;
   - `terraform.tfvars`;
   - a `*.auto.tfvars` file;
   - `-var`;
   - `-var-file`;
   - a `TF_VAR_` environment variable.
2. Run `terraform plan` for each and record the value Terraform used.
3. Keep each experiment **mutually exclusive**: exactly one source supplies the variable, so every result can be attributed to it.
4. **Only after** every source has been tried alone, combine sources deliberately and see which wins.

**Checkpoint**

- One plan per source, each showing the single source that supplied the value.
- A combined run that shows the winner, with your record stating the order in which sources win — backed by your own evidence, not the docs (DoD-04).

**Example — a `.tfvars` file**

```
region      = "<region>"
vpc_cidr    = "<cidr>"
name_prefix = "<prefix>"
```

**Example — recording the experiments (format)**

| # | Source supplying the variable | Value Terraform used | Plan evidence |
| --- | --- | --- | --- |
| 1 | default | `<...>` | `<...>` |
| 2 | `terraform.tfvars` | `<...>` | `<...>` |
| 3 | `*.auto.tfvars` | `<...>` | `<...>` |
| 4 | `-var` | `<...>` | `<...>` |
| 5 | `-var-file` | `<...>` | `<...>` |
| 6 | `TF_VAR_` environment variable | `<...>` | `<...>` |
| 7 | combined sources | `<...>` | `<...>` |

The table is the format; the values and your conclusion are yours.

**Pause and predict.** Before you combine sources, write down your guess at the order in which they win. Then run the combined experiment and compare.

**Your turn**

- **How does each way of supplying a value show up in a plan?**
- **Why might a team still allow only one source per variable — and how would you enforce that?**

> **Watch out.** The brief makes this a hard constraint: keep the experiments mutually exclusive, and don't combine sources until every source has been tried alone. Mix them early and no result can be attributed.

> **Watch out.** A `.tfvars` file is committed by default. Never put a real secret in one — that is exactly the leak this stage later guards against.

---

## Part 5 — Sensitive inputs and outputs

**Goal:** mark a value sensitive and observe what the marking hides — using throwaway placeholders only.

**Try it**

1. Add a variable marked `sensitive = true`, with a **throwaway placeholder** value.
2. Make sure the value reaches Terraform without appearing in any committed file.
3. Add an output marked sensitive.
4. Watch what is displayed:

```
terraform plan
terraform output
```

**Checkpoint**

- The plan does not display the sensitive input.
- `terraform output` does not display the sensitive output.
- No committed file contains the value.

**Example — a sensitive variable and output**

```
variable "placeholder_secret" {
  type      = string
  sensitive = true
}

output "placeholder_secret" {
  value     = var.placeholder_secret
  sensitive = true
}
```

**Example — how a sensitive value is displayed (trimmed)**

```
# in a plan
  + placeholder_secret = (sensitive value)

# from terraform output
placeholder_secret = <sensitive>
```

Observe what is shown — and notice that the value still exists. **Where** it can still be seen, and what the marking does and does not protect, is your research prompt.

**Pause and predict.** Before you plan, predict whether the sensitive value will appear in the plan output. Then run it and look.

**Your turn**

- **How should a sensitive value reach Terraform, and what are the risks of each way you tried?**
- **Which outputs are worth exposing at all, and who is the audience for each?**
- **What does marking a value sensitive hide — and where can it still be seen?**

> **Watch out.** Use throwaway placeholders for every sensitive input, and never a real credential. Then find out for yourself where a "hidden" value can still appear — don't take the marking for granted.

---

## Part 6 — Two sets of values, then destroy

**Goal:** prove the configuration plans cleanly for two different sets of values, then clean up.

**Try it**

1. Create two different `.tfvars` files — two different sets of values.
2. Plan with each and confirm both plan cleanly:

```
terraform plan -var-file=<set-one>.tfvars
terraform plan -var-file=<set-two>.tfvars
```

3. Look up what each resource bills, apply if you need to, then destroy everything:

```
terraform destroy
```

**Checkpoint**

- Two clean, error-free plans, captured separately (DoD-01).
- Everything destroyed, confirmed from the cloud side (DoD-06).

**Pause and predict.** Before you plan with the second set, guess whether anything will want to be **replaced** rather than created. Then look.

**Your turn**

- **Which values differ between environments, and where do they live?**

> **Watch out.** DoD-01 wants output for **each** set of values, not one run described as covering both. Paste each plan's result separately.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- passing `fmt`/`validate`, and a clean plan for **each** set of values;
- every variable with a type and description, and the bad-range rejection with **your** message and nothing planned;
- confirmation the main file holds no hard-coded region, CIDR or prefix, and one local value used more than once;
- one isolated experiment per source, then your combined run, and the order you concluded;
- a sensitive input and a sensitive output, with what is displayed for each, and what the marking protects;
- everything destroyed, confirmed from the cloud side.

### 7b. The clean-up gate

Before you call the stage done, confirm:

- **No stored credential, and no real secret in any file.** Every sensitive example uses a placeholder.
- **No `.tfvars` with a real secret committed**, and no state file committed — state stays local.
- **Nothing left running.** Every resource is destroyed, confirmed from the cloud side.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

The rule of thumb: **keep state out, keep the lock file in.** Confirm with `git status` that no `terraform.tfstate` appears, and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the parameterised configuration and how it is laid out. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
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
| `variables.tf` | Your `variable` blocks, with types, descriptions and validation. |
| `locals.tf` | Values derived once and reused. |
| `outputs.tf` | The outputs you expose, including any sensitive ones. |
| `<set-one>.tfvars`, `<set-two>.tfvars` | Two sets of values that both plan cleanly. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your precedence record and your teaching guide. |

| Command | What it does |
| --- | --- |
| `terraform validate` | Checks the configuration for errors. |
| `terraform plan` | Shows what would change — an input to every experiment. |
| `terraform plan -var vpc_cidr=10.0.0.0/33` | Trips your validation rule. |
| `terraform plan -var-file=<file>` | Supplies values from a specific variable file. |
| `terraform output` | Shows your outputs, redacting the sensitive ones. |
| `terraform destroy` | Removes what you created. Confirm cloud-side afterwards. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
