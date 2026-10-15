# M03 — Managing Resources with Network Provisioning

*A self-guided tour: build a small AWS network and watch Terraform work out what depends on what.*

---

This tour walks you through building a small AWS network, one part at a time. It shows you the **moves** — the resources to add, the commands to run, the checks to make — and gives you checkpoints so you always know whether you're on track.

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

> **Where does my code live?** Not in this repository. Build in a folder of your own, and keep your code in your own GitLab repository. Link it from the header of your write-up.

## Where you're headed

By the end of this tour you'll have:

- one VPC with public and private subnets across more than one availability zone, built by repeating one block rather than writing each out;
- the routing a public tier needs — and no NAT gateway anywhere;
- a plan and a dependency graph you can read, with the implicit dependencies in your own configuration named;
- everything destroyed, confirmed from the cloud side;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially whether your sandbox lets you create a VPC, subnets and routing.

---

## Part 1 — The VPC, and reading what already exists

**Goal:** create the VPC and read the region's availability zones instead of hard-coding them.

**Try it**

1. Start `main.tf` with an `aws_vpc` resource.
2. Add a `data "aws_availability_zones"` data source to read the zones available to you.
3. Confirm the configuration is sound:

```
terraform fmt
terraform validate
```

**Checkpoint**

- `validate` reports no errors.
- Your configuration has one `resource` (the VPC) and one `data` block (the zones).

**Example — the VPC and a data source**

```
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block = "<a /16 CIDR block>"
}
```

Notice the two keywords: `resource` and `data`. What each one means for what Terraform *manages*, and what happens to each when you destroy, is one of your research prompts.

**Pause and predict.** Before you plan, guess whether reading the zones with a data source creates anything in AWS. Then check the plan.

**Your turn**

- **What is the difference between a resource and a data source in what Terraform manages, and what happens to each when you destroy?**

> **Watch out.** Don't hard-code an availability zone like `"<region>a"`. Reading the zones is a rule your definition of done checks (DoD-03): at least one value your configuration needs about the account or region must come from a data source.

---

## Part 2 — Repeating the subnet block across zones

**Goal:** create several similar subnets by repeating one block, not by writing each one out.

**Try it**

1. Add **one** `aws_subnet` block and repeat it over the zones you read.
2. The brief's deliverable is a VPC with **public and private** subnets across more than one zone — so repeat for each tier, using the same mechanism.
3. Write down **which repetition mechanism you used and why**.

**Checkpoint**

- A plan shows subnets in more than one availability zone.
- Your configuration has **one** subnet block, not one block per subnet (DoD-02).

**Example — repeating one subnet block over the zones**

```
resource "aws_subnet" "public" {
  for_each = <the zones you read>

  vpc_id            = aws_vpc.main.id
  cidr_block        = "<a CIDR block per zone>"
  availability_zone = each.key
}
```

The brief's best-practices list prefers `for_each` over `count`, so that is the default shown here — but the **trade-offs between the two**, and what happens to your existing subnets when you later add or remove a zone from the set, are exactly what you must work out.

**Pause and predict.** Before you plan, guess how many subnet resources your one block will produce. Then run the plan and count.

**Your turn**

- **What are the trade-offs between the two ways of repeating a resource, and why does the course want one preferred?**
- **What happens to your existing subnets if you later add or remove one from the set you are repeating over?**

> **Watch out.** Whichever mechanism you pick, say so in your notes — the brief requires it, and a reviewer will read your configuration to check you repeated a single block rather than copied it.

---

## Part 3 — Internet gateway, route table, and associations

**Goal:** give the public tier the routing it needs, and attach it to the subnets.

**Try it**

1. Add an `aws_internet_gateway` for your VPC.
2. Add an `aws_route_table` with a **default route** to that gateway.
3. Associate the route table with your public subnets.
4. Check your work and plan:

```
terraform fmt
terraform validate
terraform plan
```

**Checkpoint**

- The plan includes the gateway, the route table and the associations.
- The public subnets are tied to the route table that has the default route.

**Example — gateway, route table, association (shape only)**

```
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
```

The lab names these three pieces; what the routing for a public tier actually *needs*, and how you would pick it out of a plan, is your research prompt.

**Pause and predict.** Before you plan, guess whether the association resource will say it is replacing or updating anything. Then read the plan.

**Your turn**

- **What does the routing for a public tier need, and how would you see it in the plan?**

> **Watch out.** No NAT gateway, anywhere, in any part of this stage. DoD-04 checks the plan *and* state for one — the absence in your code is not evidence enough.

---

## Part 4 — Reading the graph, and naming your dependencies

**Goal:** see the dependencies Terraform inferred, and add one explicit ordering where a reference cannot express what you need.

**Try it**

1. Ask Terraform what depends on what:

```
terraform graph
```

2. Render the graph if you want a picture (the output is Graphviz `dot` text; piping it through `dot -Tsvg` gives you an image).
3. Find **one** dependency Terraform worked out from a reference in your configuration.
4. Add **one** `depends_on` where a reference cannot say what you need.
5. Write down where in your configuration you relied on Terraform to infer ordering, and where you had to state it.

**Checkpoint**

- The graph shows edges between your resources.
- Your note names at least one inferred dependency and the one place you stated ordering yourself.

**Example — reading the graph (trimmed)**

```
$ terraform graph
digraph {
        compound = "true"
        newrank = "true"
        subgraph "root" {
                "[root] aws_subnet.public[...] (expand)" -> "[root] aws_vpc.main (expand)"
                "[root] aws_internet_gateway.main (expand)" -> "[root] aws_vpc.main (expand)"
                ...
        }
}
```

**Example — stating an ordering explicitly (shape only)**

```
resource "<your-resource>" "<name>" {
  # ... your arguments ...

  depends_on = [<the resource a reference cannot express>]
}
```

**Pause and predict.** Before you add `depends_on`, predict whether Terraform already knew the ordering without it. If it did, why did you still need it?

**Your turn**

- **Where in your configuration did you rely on Terraform to infer ordering?**
- **Was there anywhere you had to state an ordering explicitly — and why?**

> **Watch out.** `depends_on` is for ordering that a reference genuinely cannot express. Reaching for it everywhere hides the real dependencies and is not what the brief asks for — add exactly one, and be able to say why.

---

## Part 5 — Apply, look, destroy

**Goal:** create the network, see it in the cloud, then tear it all down.

**Try it**

1. Look up what each resource in the plan bills — some networking resources bill by the hour.
2. Apply:

```
terraform apply
```

3. Look at the network in the AWS console (VPC, subnets across two zones, the public route table).
4. Destroy everything:

```
terraform destroy
```

**Checkpoint**

- `apply` creates the network; the console shows your subnets in more than one zone.
- `destroy` removes everything — confirmed from the **cloud side**, not only from Terraform's message (DoD-06).

**Example — apply and destroy report a tally**

```
$ terraform apply
...
Apply complete! Resources: 6 added, 0 changed, 0 destroyed.

$ terraform destroy
...
Destroy complete! Resources: 6 destroyed.
```

**Pause and predict.** Before you destroy, guess how many resources it will remove. Then compare with the real number.

**Your turn**

- **Everything is destroyed, confirmed from the cloud side** — capture that check as your evidence (DoD-06).

> **Watch out.** Confirm from the cloud that the VPC and subnets are gone. "Destroy complete" from Terraform is not, by itself, the proof the brief wants.

**Add to your notes.** Record, from the real plan output or its JSON form, the resource addresses for the VPC, the subnets and the routing (DoD-01).

---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- passing `fmt`/`validate`, and a plan containing the VPC, subnets in at least two zones, and the public routing, with addresses taken from the plan or its JSON;
- configuration proof that more than one zone is created by **repeating one block**;
- at least one region/account value read with a **data source**, not hard-coded;
- proof from the plan (or state) that **no NAT gateway** exists;
- your note naming the **implicit dependencies** in your own configuration and where each comes from;
- everything destroyed, confirmed from the cloud side.

### 6b. The clean-up gate

Before you call the stage done, confirm:

- **No stored credential.** Nothing long-lived anywhere.
- **State stays local and out of version control.** No state file committed.
- **Nothing left running.** Every resource is destroyed, confirmed from the cloud side.

**Example — the ignore rule that keeps state out**

```
.terraform/
terraform.tfstate*
```

The rule of thumb: **keep state out, keep the lock file in.** Confirm with `git status` that no `terraform.tfstate` appears, and that `.terraform.lock.hcl` stays committed.

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **What I built** — the network and how it is laid out. A diagram is welcome.
- **Why it's built this way** — one entry per research prompt, plus one for where you spent the most time. Say what you considered, chose, gave up.
- **AI collaboration log** — specific, or one line saying you used none.
- **How to build it** — a guide someone could follow from a clean start. Follow it yourself end to end before you call it done.
- **Concepts worth explaining** — two or three ideas from this stage, in your own words, each with an example from *your* build.
- **What tripped me up** — the real obstacles, with the exact error text. (These become the course's common-errors list.)
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm the item you'll be asked about at review: whether your sandbox lets you create a VPC, subnets and routing.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `main.tf` | The VPC, the subnets, the gateway, the route table and the associations. |
| `.gitignore` | Keeps state and downloaded providers out of version control; keeps the lock file in. |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `terraform fmt` | Tidies formatting. |
| `terraform validate` | Checks the configuration for errors. |
| `terraform plan` | Shows what would change — read it every time. |
| `terraform graph` | Prints the dependency graph as Graphviz `dot` text. |
| `terraform apply` | Makes the changes. |
| `terraform destroy` | Removes what you created. Confirm cloud-side afterwards. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
