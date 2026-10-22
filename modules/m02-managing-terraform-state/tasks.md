# M02 — Managing Terraform State — Tasks

**Objective:** By the end of this stage, you can explain what Terraform's local state records and why it must be treated as sensitive, and move that state into a protected remote backend that you can show is versioned, encrypted and locked — using your own state, your own bucket and your own lock error as the evidence, not a description from the documentation. The bucket you create here is reused by the later stages that keep state, so build it as something you would trust to hold their state.

> There is no solutions file for this stage. This checklist guides the work — it doesn't contain it. See `brief.md` for the full requirements, the stack constraints and the definition of done, and fill in `write-up.md` — your copy of `write-up-template.md` — as you go, not after.

## Setup

- [ ] Read `brief.md` from top to bottom, including its stack constraints, and the rules for every stage in the [README](../../README.md#rules-for-every-stage). Check its “Still open / ask your trainer” list, and ask the trainer about anything unclear before you build.
- [ ] Copy `write-up-template.md` to `write-up.md` in this folder and fill it in as you go, not after the fact. Leave the template itself untouched.
- [ ] Confirm that each stage named under "Builds on" in the brief (M01) has been accepted, and that you have the access and tools its stack constraints require. Raise anything missing with the trainer before you build.

## Build

- [ ] **TASK-M02-B01** Work on: Understanding and inspecting local state (read-only)
- [ ] **TASK-M02-B02** Work on: Secrets and state
- [ ] **TASK-M02-B03** Work on: Why state moves to a remote backend
- [ ] **TASK-M02-B04** Work on: Bootstrapping and securing the state bucket
- [ ] **TASK-M02-B05** Work on: Configuring the backend and migrating existing local state into it
- [ ] **TASK-M02-B06** Work on: Native state locking
- [ ] **TASK-M02-B07** Have ready: A protected S3 state bucket and a small configuration whose local state you inspected and then migrated into it as its remote backend
- [ ] **TASK-M02-B08** Have ready: locking demonstrated

## Verify

- [ ] **TASK-M02-V01** Confirm DoD-01: Your notes show where your local state lives and what it records for one of your own resources, captured read-only from your own state (output pasted), not described from the documentation. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V02** Confirm DoD-02: Your notes show what state holds for a sensitive value, captured from your own state without exposing a real credential, not a claim taken from the documentation. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V03** Confirm DoD-03: A state object for your configuration exists in the bucket (listing pasted), and a plan after migrating local state shows no changes — nothing was recreated. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V04** Confirm DoD-04: Versioning is enabled on the bucket, encryption at rest is enabled and public access is fully blocked, shown from the cloud side, not from your configuration. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V05** Confirm DoD-05: The backend configuration enables native locking and no DynamoDB table is used or created, and with one operation in progress a second is refused with a lock error (the error output pasted), not described from what locking should do. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V06** Confirm DoD-06: The bucket is retained and everything else is destroyed, confirmed from the cloud side, and no static keys, state files or state file contents are committed to version control, shown by the ignore rule and a clean commit history. Capture the evidence under “Checkpoint evidence”.
- [ ] **TASK-M02-V07** Confirm DoD-07: Your write-up takes a first-time learner from local state to a protected remote backend, with locking demonstrated, unaided — verified by you following it end to end from a clean state. Capture the evidence under “Checkpoint evidence”.

## Write-up

- [ ] **TASK-M02-W01** Under “What I built”: The protected S3 state bucket and the small configuration whose local state you inspected and then migrated into it. Link your repository.
- [ ] **TASK-M02-W02** Under “Why it's built this way (key decisions)”: What can leak a secret into state, and why is a state file sensitive even when the configuration has no secrets? Who and what needs access to the state bucket, how narrow can you make it, and why is the bucket kept when everything else is destroyed? What does locking prevent, and what does it not? Where did you spend the most time, and why? Say what you considered, what you chose, why, and what you gave up.
- [ ] **TASK-M02-W03** Under “AI collaboration log”: If you used AI tools, be specific, not a vague "I used AI to help write some code". If you used none, say so in one line.
- [ ] **TASK-M02-W04** Under “How to build it (teach it to the next engineer)”: Write a guide from local state to a protected remote backend with locking demonstrated, using your own state output to show the reasoning, not just the commands.
- [ ] **TASK-M02-W05** Under “Concepts worth explaining”: Pick 2–3 ideas — what state records and where it lives, why a team needs a remote backend, or migrating local state without recreating anything — and explain each in your own words.
- [ ] **TASK-M02-W06** Under “What tripped me up”: Anything that didn't behave the way you expected the first time. Keep the exact error text.
- [ ] **TASK-M02-W07** Under “Checkpoint evidence”: Paste real output, trimmed to the relevant lines and redacted, or link a screenshot. The definition of done in `brief.md` still applies in full — cover DoD-01 and DoD-02, DoD-03 and DoD-04, and DoD-05, plus the DoD-06 and DoD-07 evidence that sits outside those three slots.
- [ ] **TASK-M02-W08** Under “Definition-of-done self-assessment”: Score yourself honestly against every item in the definition of done in `brief.md` before your trainer reviews it: met, partly met or not met, and why. Then rate yourself against each criterion of the stage rubric in the README. Name any part of your own work you would struggle to explain cold, without re-reading it first.
- [ ] **TASK-M02-W09** Under “What I'd do differently”: If you started this stage over, what would you do differently?
- [ ] **TASK-M02-W10** Final self-review: go back through this list, the brief's definition of done and your write-up. Every item is ticked, or you have written down why not and told the trainer. Then tell the trainer the stage is ready for review.
