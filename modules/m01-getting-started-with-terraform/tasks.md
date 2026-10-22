# M01 — Getting Started with Terraform — Tasks

**Objective:** By the end of this stage, you can set up your own workstation, sign in to AWS without static keys, and take one simple resource through the whole Terraform lifecycle — initialise, plan, apply, update and destroy — using your own terminal output and plans as the evidence, not a diagram from a slide. You can explain what Terraform is, what a provider is and why versions are pinned, and predict from a plan whether a change updates a resource in place or replaces it.

> There is no solutions file for this stage. This checklist guides the work — it doesn't contain it. See `brief.md` for the full requirements, the stack constraints and the definition of done, and fill in `write-up.md` — your copy of `write-up-template.md` — as you go, not after.

## Setup

- [ ] Read `brief.md` from top to bottom, including its stack constraints, and the rules for every stage in the [README](../../README.md#rules-for-every-stage). Check its “Still open / ask your trainer” list, and ask the trainer about anything unclear before you build.
- [ ] Copy `write-up-template.md` to `write-up.md` in this folder and fill it in as you go, not after the fact. Leave the template itself untouched.
- [ ] Confirm that you have the access and tools the brief's stack constraints require. Raise anything missing with the trainer before you build.

## Build

- [ ] **TASK-M01-B01** Work on: Step 1 — The workstation (zero code)
- [ ] **TASK-M01-B02** Work on: Step 2 — Dependencies: the `versions.tf` file
- [ ] **TASK-M01-B03** Work on: Step 3 — Configuration: the `providers.tf` file
- [ ] **TASK-M01-B04** Work on: Step 4 — Resources and planning: the `main.tf` file
- [ ] **TASK-M01-B05** Work on: Step 5 — Apply and destroy
- [ ] **TASK-M01-B06** Have ready: A configuration made of `versions.tf`, `providers.tf` and `main.tf` that manages one simple AWS resource, taken through create, in-place update and destroy from a workstation you set up yourself
- [ ] **TASK-M01-B07** Have ready: a written plan-review note

## Verify

- [ ] **TASK-M01-V01** Confirm DoD-01: Your notes show the actual Terraform version, installed through a version manager and switched between two versions (output pasted), and a caller-identity query from your own signed-in session (output pasted, account details redacted as the trainer directs), not the version or the identity you assumed you had. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V02** Confirm DoD-02: Your notes show the scan you ran for static access keys on disk and in your repository, and what it looked for, not a statement that there are none. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V03** Confirm DoD-03: `terraform init` created the `.terraform` folder and the `.terraform.lock.hcl` file from your own `versions.tf`, the lock file is committed (it appears in your commit), and your notes say in your own words what it recorded, not what the documentation says. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V04** Confirm DoD-04: Formatting and validation pass with no errors on your `providers.tf` and `main.tf`, shown as pasted output, not described from memory. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V05** Confirm DoD-05: Your plan output is pasted and read: it shows the default tags on your resource, and your plan-review note classifies every change you made as create, in-place update or replacement, and your trainer confirms each classification on review. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V06** Confirm DoD-06: The plan before your one-attribute change shows an in-place update (output pasted), and after destroy nothing exists in the sandbox, confirmed from the cloud side, not only from Terraform's output. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M01-V07** Confirm DoD-07: Your write-up takes a first-time learner on either operating system from an empty folder to a destroyed resource unaided — verified by you following it end to end from a clean state. Capture the evidence under “Checkpoint evidence”.

## Write-up

- [ ] **TASK-M01-W01** Under “What I built”: The workstation you set up, the `versions.tf`, `providers.tf` and `main.tf` files that manage one AWS resource, and your plan-review note. Link your repository.
- [ ] **TASK-M01-W02** Under “Why it's built this way (key decisions)”: Why use Terraform instead of a script or the console, and how do you prove you are connected to AWS without static keys? What does the lock file record that your version constraint does not, and how loose or tight should a provider constraint be? Which changes update a resource in place and which force replacement, and how do you confirm from the cloud side that everything is gone? Where did you spend the most time, and why? Say what you considered, what you chose, why, and what you gave up.
- [ ] **TASK-M01-W03** Under “AI collaboration log”: If you used AI tools, be specific, not a vague "I used AI to help write some code". If you used none, say so in one line.
- [ ] **TASK-M01-W04** Under “How to build it (teach it to the next engineer)”: Write a guide that takes a learner on macOS or Windows from an empty folder to a destroyed resource, using your own output to show the reasoning, not just the commands.
- [ ] **TASK-M01-W05** Under “Concepts worth explaining”: Pick 2–3 ideas — what a provider is, default tags, or the anatomy of a resource — and explain each in your own words.
- [ ] **TASK-M01-W06** Under “What tripped me up”: Anything that didn't behave the way you expected the first time. Keep the exact error text.
- [ ] **TASK-M01-W07** Under “Checkpoint evidence”: Paste real output, trimmed to the relevant lines and redacted, or link a screenshot. The definition of done in `brief.md` still applies in full — cover DoD-01 and DoD-02, DoD-05 and DoD-06, and the DoD-06 cloud-side query, plus the DoD-03 and DoD-04 evidence that sits outside those three slots.
- [ ] **TASK-M01-W08** Under “Definition-of-done self-assessment”: Score yourself honestly against every item in the definition of done in `brief.md` before your trainer reviews it: met, partly met or not met, and why. Then rate yourself against each criterion of the stage rubric in the README. Name any part of your own work you would struggle to explain cold, without re-reading it first.
- [ ] **TASK-M01-W09** Under “What I'd do differently”: If you started this stage over, what would you do differently?
- [ ] **TASK-M01-W10** Final self-review: go back through this list, the brief's definition of done and your write-up. Every item is ticked, or you have written down why not and told the trainer. Then tell the trainer the stage is ready for review.
