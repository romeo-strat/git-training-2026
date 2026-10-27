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

## Where you're headed

By the end of this tour you'll have:

- one VPC with public and private subnets across more than one availability zone, built by repeating **one** block rather than writing each out;
- the routing a public tier needs — and **no NAT gateway** anywhere;
- a plan and a dependency graph you can read, with the implicit dependencies in your own configuration named and exactly one explicit ordering stated where a reference cannot express it;
- everything destroyed, confirmed from the **cloud side**;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially whether your sandbox lets you create a VPC, subnets and routing.

---

## Part 1 — The VPC, and reading what already exists

**Goal:** create the VPC and read the region's availability zones instead of hard-coding them.

*First-run estimate: about 10 minutes.*

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

**Goal:** create several similar subnets by repeating **one** block, not by writing each one out.

*First-run estimate: about 10–15 minutes.*

**Try it**

1. Add **one** `aws_subnet` block and repeat it over the zones you read.
2. The brief's deliverable is a VPC with **public and private** subnets across **more than one** zone — repeat for each tier using the **same** mechanism.
3. Write down **which repetition mechanism you used and why**.

**Checkpoint**

- A plan shows subnets in more than one availability zone.
- Your configuration has **one** subnet block per tier (or one block that is repeated), not one block per subnet (DoD-02).

**Example — repeating one subnet block over the zones**

```
resource "aws_subnet" "public" {
  for_each = data.aws_availability_zones.available.names

  vpc_id            = aws_vpc.main.id
  cidr_block        = "<a CIDR block per zone>"
  availability_zone = each.key
}
```

The brief's best-practices list prefers `for_each` over `count`, so that is the default shown here — but the **trade-offs between the two**, and what happens to your existing subnets when you later add or remove a zone from the set, are exactly what you must work out.

**Pause and predict.** Before you plan, guess how many subnet resources your one block will produce. Then run the plan and count.

**Your turn**

- **What are the trade-offs between `count` and `for_each` when repeating resources, and why does the course prefer one of them?**
- **What happens to your existing subnets if you later add or remove one from the set you are repeating over?**

> **Watch out.** Whichever mechanism you pick, say so in your notes — the brief requires it, and a reviewer will read your configuration to check you repeated a single block rather than copied it.

---

## Part 3 — Internet gateway, route table, and associations

**Goal:** give the public tier the routing it needs, and attach it to the subnets.

*First-run estimate: about 10–15 minutes.*

**Try it**

1. Add an `aws_internet_gateway` for your VPC.
2. Add an `aws_route_table` with a **default route** to that gateway.
3. Associate the route table with your **public** subnets.
4. Check your work and plan:

```
terraform fmt
terraform validate
terraform plan
```

**Checkpoint**

- The plan includes the gateway, the route table and the associations.
- The public subnets are tied to the route table that has the default route to the internet gateway.
- Your plan still shows **no NAT gateway** anywhere.

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

> **Watch out.** **No NAT gateway, anywhere, in any part of this stage.** DoD-04 checks the plan *and* state for one — the absence in your code is not evidence enough on its own. Be explicit in your write-up about how you proved it.

---

## Part 4 — Reading the graph, and naming your dependencies

**Goal:** see the dependencies Terraform inferred, and add **exactly one** `depends_on` where a reference cannot express what you need.

*First-run estimate: about 10 minutes.*

**Try it**

1. Ask Terraform what depends on what:

```
terraform graph
```

2. Render the graph if you want a picture (the output is Graphviz `dot` text; piping it through `dot -Tsvg` gives you an image).
3. Find **one** dependency Terraform worked out from a reference in your configuration (e.g. `vpc_id = aws_vpc.main.id`).
4. Add **exactly one** `depends_on` where a reference cannot say what you need.
5. Write down where in your configuration you relied on Terraform to infer ordering, and where you had to state it.

**Checkpoint**

- The graph shows edges between your resources.
- Your note names at least one inferred dependency and the **one** place you stated ordering yourself, with a reason why a reference was not enough.

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

- **Where in your configuration did you rely on Terraform to infer ordering (implicit dependencies)? Give one concrete example from your build.**
- **Was there anywhere you had to state an ordering explicitly with `depends_on`? If yes, why could a reference not express it?**

> **Watch out.** `depends_on` is for ordering that a reference genuinely cannot express. Reaching for it everywhere hides the real dependencies and is not what the brief asks for — add **exactly one**, and be able to say why.

**Explain it.** In one sentence, say the difference between an *implicit* dependency and an *explicit* dependency in Terraform.

---

## Part 5 — Apply, look, destroy

**Goal:** create the network, see it in the cloud, then tear it all down and prove it's gone.

*First-run estimate: about 15 minutes.*

**Try it**

1. Look up what each resource in the plan bills — some networking resources bill by the hour. Be aware of that before applying in a shared sandbox.
2. Apply:

```
terraform apply
```

3. Look at the network in the AWS console (VPC, subnets across more than one zone, the public route table).
4. Destroy everything:

```
terraform destroy
```

**Checkpoint**

- `apply` creates the network; the console shows your subnets in more than one zone.
- `destroy` succeeds, but **do not stop there** — confirm from the **cloud side** that the VPC and subnets are gone (DoD-06).

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

- **Confirm from the cloud side that everything is gone after `destroy`.** Capture the command/output you used (and what you looked for) as evidence (DoD-06).

> **Watch out.** "Destroy complete" from Terraform is not, by itself, proof. Confirm from the **cloud side** that your resources no longer exist.

**Add to your notes.** Record, from the real plan output or its JSON form, the resource addresses for the VPC, the subnets and the routing (DoD-01).

---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

*First-run estimate: about 20 minutes (evidence, clean-up and write-up).*

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. The evidence goes in your write-up's **Checkpoint evidence** section. Make sure you have **real pasted output**, trimmed to the relevant lines and redacted:

- **DoD-01** — a plan (or its JSON) showing resource addresses for the VPC, subnets and routing.
- **DoD-02** — proof that more than one subnet is created by **repeating one block** (show the single block + the plan/count).
- **DoD-03** — at least one region/account value read with a **data source** (`aws_availability_zones`), not hard-coded.
- **DoD-04** — proof from the plan (or state) that **no NAT gateway** exists.
- **DoD-05** — your note naming the **implicit dependencies** in your configuration and where each comes from, plus the **exactly one** `depends_on` (and why).
- **DoD-06** — everything destroyed, **confirmed from the cloud side**.
- **DoD-07** — your write-up follows the template end to end and you say so.

Also include passing `terraform fmt` and `terraform validate` output.

### 6b. The clean-up gate

Before you call the stage done, confirm all three:

- **No stored credential.** Nothing long-lived anywhere.
- **State stays local and out of version control.** `terraform.tfstate` and friends are local in this stage and never committed.
- **Nothing left running.** Every resource is destroyed, confirmed from the cloud side.

**Example — a `.gitignore` for a local-state stage**

```
.terraform/
*.tfstate
*.tfstate.*
crash.log
```

The rule of thumb: **keep state out, keep the lock file in.** After adding/updating `.gitignore`, run `git status` and confirm `terraform.tfstate` does **not** appear — if you've already staged it, unstage it before you commit.

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`. Use the template's section names as they are, and answer each one in your own words:

| Section | What goes in it |
| --- | --- |
| **What I built** | The VPC, public/private subnets across more than one AZ, internet gateway, route table and associations. How you repeated the block, and what you chose for CIDRs/AZs. Link your repository. |
| **Why it's built this way (key decisions)** | Cover: (1) resource vs data source and what happens on destroy; (2) `count` vs `for_each` and why you preferred one; (3) public routing needs and why no NAT; (4) implicit vs explicit dependencies and your single `depends_on`. Say what you considered, chose, and gave up. |
| **AI collaboration log** | Specific: which tools, two or three concrete asks, one suggestion that was wrong and what you did instead, and what you wrote yourself. Or one line saying you used none. |
| **How to build it (teach it to the next engineer)** | A guide that takes someone from an empty folder to a destroyed network, showing the reasoning (why a data source, why single-block repetition, why public-only routing) using your own output, not just commands. Follow it yourself end to end before you call it done. |
| **Concepts worth explaining** | Two or three ideas from this stage (resource vs data source, `for_each` vs `count`, implicit vs explicit dependencies, public vs private routing) in your own words, each with an example from *your* build. |
| **What tripped me up** | Anything that didn't behave as expected, with the exact error text. (These become the course's common-errors list.) |
| **Checkpoint evidence** | The evidence slots from 6a: pasted output, trimmed and redacted, or a screenshot. Include plan addresses, proof of single-block repetition, data source usage, no-NAT proof, graph/dependency note, and cloud-side destroy confirmation. |
| **Definition-of-done self-assessment** | Met / partly met / not met for every DoD item and why, your rating against each stage-rubric criterion in the README, and anything you'd struggle to explain cold. |
| **What I'd do differently** | If you started this stage over, what would you do differently? |

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready for review.

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
| `terraform plan` | Shows what would change — **read it every time.** |
| `terraform graph` | Prints the dependency graph as Graphviz `dot` text. |
| `terraform apply` | Makes the changes. |
| `terraform destroy` | Removes what you created. **Confirm cloud-side afterwards.** |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
