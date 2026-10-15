# M06 — Advanced Terraform Configuration

*A self-guided tour: describe infrastructure from data, and see exactly what each change does to the real resources.*

---

This tour walks you through building a data-driven configuration, one part at a time. It shows you the **moves** — the blocks to write, the commands to run, the checkpoints to hit — and gives you a way to confirm each step before you move on.

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

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — the objective, the scope, the constraints, the deliverable and the definition of done. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end.

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your code in your own GitLab repository. Link it from the header of your write-up.

> **Builds on M02, M03 and M04.** You need the state bucket from M02, your network from M03, and your typed, validated variables from M04. If any isn't accepted yet, sort that out before you start.

## Where you're headed

By the end of this tour you'll have:

- a **data-driven** configuration: resources and nested blocks generated from a structured input instead of repeated by hand;
- derived values defined once, a conditional shown both ways, and a data-source lookup;
- explicit dependency and lifecycle controls, each justified and each with its effect shown from a plan;
- a check on the configuration's own assumptions, deliberately triggered;
- the map changed three ways (added, removed, key changed), with a plan captured for each and notes on what each would do to the real infrastructure;
- everything destroyed (the bucket kept), and evidence for every item in your brief's definition of done.

> **Before you start.** Your brief's "Still open / ask your trainer" list here is short — the one item is how much detail your notes need. Confirm that with your trainer before you invest significant time.

---

## Part 1 — One structured input

**Goal:** describe what you'll create from **data**, not by repetition.

**Try it**

1. In `variables.tf`, define one structured input: a **map of rules**, each with a port and a description.
2. Give it a type and a description.
3. Decide which values this input supplies and which your configuration will derive from it.

**Checkpoint**

- One structured input, typed and described.
- You can say, for each value you'll use, whether it comes from the caller or is derived.

**Example — the shape of the structured input**

```
variable "ingress_rules" {
  description = "<what this collection describes>"
  type = map(object({
    port        = number
    description = string
  }))
  default = {
    "<rule-key>" = { port = <a port number>, description = "<what it is for>" }
  }
}
```

The map's shape is shown here. **Which values should be derived inside the configuration and which the caller should supply** is your research prompt.

**Pause and predict.** Before you build anything, predict how many resources and how many nested blocks this one input will end up producing.

**Your turn**

- **Which values should be derived inside the configuration, and which should the caller supply?**

> **Watch out.** The whole stage rests on this input being data, not a handful of separate variables. If you catch yourself adding a new `variable` for each rule, step back.

---

## Part 2 — Generating nested blocks from data

**Goal:** create the VPC and security group, with ingress rules generated from the map.

**Try it**

1. Create an `aws_vpc` and an `aws_security_group`.
2. Generate the ingress rules with a `dynamic "ingress"` block over your map.
3. Build the names with a `locals` block and built-in functions.

**Checkpoint**

- The security group has one ingress rule per map entry.
- The names are derived, not repeated.

**Example — the shape of a dynamic block and derived names**

```
locals {
  name_prefix = "<derived from your inputs with a built-in function>"
}

resource "aws_security_group" "this" {
  name = "${local.name_prefix}-<suffix>"

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "<protocol>"
      description = ingress.value.description
      cidr_blocks = ["<a cidr>"]
    }
  }
}
```

**When a dynamic block makes a configuration clearer — and when it makes it harder to review than the repetition it replaced** — is your research prompt.

**Pause and predict.** Before you plan, predict how many `ingress` blocks will appear. Then check the plan against your guess.

**Your turn**

- **When does a dynamic block make a configuration clearer, and when does it make it harder to review than the repetition it replaced?**

> **Explain it.** In one sentence, say what changed about your configuration when you swapped repeated blocks for one dynamic block.

---

## Part 3 — Repeating resources and reshaping data

**Goal:** create one parameter per map entry, and turn the map into a different shape.

**Try it**

1. Create one `aws_ssm_parameter` **per map entry** with `for_each`.
2. Use a `for` expression to turn the map into an output **list**.
3. Plan, and watch how the collection changes shape.

**Checkpoint**

- One parameter per map entry, repeated from the map — not copy-pasted.
- An output that is a list derived from the map (DoD-02).

**Example — repeating a resource and reshaping a collection**

```
resource "aws_ssm_parameter" "rule" {
  for_each = var.ingress_rules
  name     = "/<prefix>/${each.key}"
  type     = "String"
  value    = "<something derived from each entry>"
}

output "rule_ports" {
  value = [for k, v in var.ingress_rules : v.port]
}
```

The syntax is shown here. **How a collection looks before and after you reshape it**, and **what the keys of a repeated resource should be and what happens to the real infrastructure when a key changes**, are your research prompts.

**Pause and predict.** Before you apply, predict what Terraform will do to existing parameters if you later **change a key** in the map. Write it down; you'll test it in Part 6.

**Your turn**

- **How does a collection look before and after you reshape it?**
- **What should the keys of a repeated resource be — and what happens to the real infrastructure when a key changes?**

> **Watch out.** A resource repeated with `for_each` is keyed by the map. That choice of key is not cosmetic: it decides what Terraform does to real resources later. Investigate it now rather than discovering it by accident.

---

## Part 4 — Making configuration conditional

**Goal:** create something only when a flag says so, and see both outcomes.

**Try it**

1. Add a conditional so the parameters are created only when a flag is true.
2. Plan with the flag **on**:

```
terraform plan -var <flag>=true
```

3. Plan with the flag **off**:

```
terraform plan -var <flag>=false
```

**Checkpoint**

- Two plans captured — one per outcome (DoD-03), not just the outcome you expected.

**Example — the shape of a conditional (one way)**

```
resource "aws_ssm_parameter" "rule" {
  for_each = var.<flag> ? var.ingress_rules : {}
  ...
}
```

One way to make the configuration conditional is shown here. **When a condition in the configuration is the wrong tool** is your research prompt.

**Pause and predict.** Before the flag-off plan, predict whether Terraform will show **destroys** for the parameters. Then run it.

**Your turn**

- **When is a condition in the configuration the wrong tool?**

> **Watch out.** DoD-03 wants the plan for **both** outcomes. Capture them separately, even if one is the "boring" outcome.

---

## Part 5 — Looking things up, and controlling lifecycle

**Goal:** read what already exists, then take control of ordering and lifecycle.

**Try it**

1. Look up your account with a `data "aws_caller_identity"` data source and use it in a name.
2. Add one `depends_on`.
3. Add one `lifecycle` setting.
4. Read what each does in the plan.

**Checkpoint**

- A value the configuration uses comes from a data source, with no equivalent hard-coded (DoD-03).
- Every dependency and lifecycle setting you added is justified, with its effect shown from a plan (DoD-04).

**Example — a data source, a dependency and a lifecycle block**

```
data "aws_caller_identity" "current" {}

resource "..." "..." {
  name = "<derived using data.aws_caller_identity.current...>"

  depends_on = [<the resource this must follow>]

  lifecycle {
    <one setting> = <its value>
  }
}
```

The syntax is shown here. **What a data source supplies that you would otherwise hard-code**, and **which resources should be protected from replacement or destruction, which changes Terraform should ignore, and what each costs the next person who has to change them**, are your research prompts.

**Pause and predict.** Before you add the lifecycle setting, predict what it will change in the plan. Then compare — do **not** trust the setting's name to tell you what it does.

**Your turn**

- **What does a data source supply that you would otherwise hard-code?**
- **Where did you have to state a dependency explicitly, and how did you decide that was needed?**
- **Which resources should be protected from replacement or destruction, which changes should Terraform ignore, and what does each cost the next person who has to change them?**

> **Watch out.** DoD-04 says the effect of each lifecycle setting must be **shown**, not assumed from its name. A setting you added but never saw take effect is not evidence.

---

## Part 6 — Checking your own assumptions, and changing the data

**Goal:** make the configuration check a real assumption, then watch what changing the data does.

**Try it**

1. Add a `precondition` or `postcondition` that checks an assumption about real infrastructure.
2. Trigger it on purpose and keep the failure message.
3. Then change the data three ways, planning each time:
   - **add** an entry to the map;
   - **remove** an entry;
   - **change** a key.
4. Capture a plan for each and write down what each would do to the real infrastructure.

**Checkpoint**

- A deliberately triggered check, with the **real** failure message (DoD-05).
- Three captured plans, and your notes say what each would do to the real infrastructure — not what you expect (DoD-02).

**Example — the shape of a precondition (inside a resource lifecycle / an output)**

```
lifecycle {
  precondition {
    condition     = <an assumption about real infrastructure that must hold>
    error_message = "<what to say when it does not>"
  }
}
```

The syntax is shown here. **What assumption about real infrastructure is worth checking, where the check belongs, and what should happen when it fails** are your research prompts.

**Example — recording the three changes (format)**

| Change | What the plan showed | What it would do to the real infrastructure |
| --- | --- | --- |
| add an entry | `<...>` | `<...>` |
| remove an entry | `<...>` | `<...>` |
| change a key | `<...>` | `<...>` |

The table is the format; what you observed and concluded is yours.

**Pause and predict.** Before you change a key, predict whether Terraform will update the resource in place or replace it. Then look closely at the plan.

**Your turn**

- **What assumption about real infrastructure is worth checking in your configuration, where does the check belong, and what should happen when it fails?**

> **Watch out.** Don't trigger the check by guessing — make it fail on purpose, so you can keep the exact message. A check that never fired proves nothing.

> **Watch out.** The key-change plan is the one to read slowly. Don't describe it from memory; describe exactly what it says.

---

## Part 7 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 7a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- passing `fmt`/`validate`, derived values used more than once, no duplicated expression;
- a resource repeated from structured input, with your key justification, and the expected count shown in the plan;
- the three change-plans (add / remove / key change), with what each would do;
- a conditional shown for **both** outcomes, and a data source supplying a value with no hard-coded equivalent;
- each dependency and lifecycle setting justified and its effect shown;
- a deliberately triggered precondition or postcondition, with the real message;
- everything destroyed except the M02 bucket, confirmed from the cloud side.

### 7b. The clean-up gate

Before you call the stage done, confirm:

- **Everything is destroyed except the M02 bucket.** Keep the bucket and its lock configuration.
- **Nothing is left running.** Confirm from the cloud side, not just from Terraform's output.
- **No state file is committed.** State lives in the bucket under its own key.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

Confirm with `git status` that no state file appears and that `.terraform.lock.hcl` stays committed.

### 7c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the data-driven configuration, and how it is laid out. A diagram is welcome.
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
| `variables.tf` | The structured input — a map of rules. |
| `locals.tf` | Names and values derived once with built-in functions. |
| `main.tf` | The VPC, the security group with dynamic ingress, and the repeated parameters. |
| `outputs.tf` | Values reshaped from the input, and any postcondition. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence, your change-plans and your teaching guide. |

| Command | What it does |
| --- | --- |
| `terraform plan` | Shows what each data change and each conditional outcome does. Your main evidence. |
| `terraform plan -var <flag>=true` | Shows the conditional outcome when the flag is on. |
| `terraform plan -var <flag>=false` | Shows the conditional outcome when the flag is off. |
| `terraform destroy` | Removes your resources. Keep the bucket. |

| Idea | In one line |
| --- | --- |
| Built-in functions | Derive a value instead of repeating it. |
| `for_each` | Repeat a resource from a map or set of meaningful keys. |
| Dynamic block | Generate repeated nested blocks from data. |
| Data source | Read what already exists, instead of hard-coding it. |
| `depends_on` / lifecycle | Order and protect resources beyond what a reference expresses. |
| Precondition / postcondition | Check an assumption about real infrastructure. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
