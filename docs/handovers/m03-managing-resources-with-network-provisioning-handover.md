# Handover — M03 Managing Resources with Network Provisioning

> **Trainer/agent material. Not trainee-facing.** Do not copy this file into `modules/`, a write-up or any learner-visible artifact.

| | |
| --- | --- |
| Module | `modules/m03-managing-resources-with-network-provisioning` |
| Stage | 3 of 9 |
| Builds on | M01 |
| Feeds into | M04, M06 |
| Status | Coaching package delivered — awaiting learner build |
| From | Curriculum Architect (EM) |
| To | DevOps Mentor |
| Next reviewer | Technical Reviewer |
| Mentor output | [m03-devops-mentor-coaching-package.md](m03-devops-mentor-coaching-package.md) |

## 1. Handover intent

The DevOps Mentor is asked to coach the learner through M03. Do **not** implement the stage on the learner's behalf. Follow the mentor teaching sequence (`.opencode/agents/devops-mentor.md:14-26`): explain the problem, connect the concept, state the outcome and constraints, give a focused task, give escalating hints, help implement and troubleshoot, verify with real evidence, explain trade-offs, help document.

The mentor must **not** mark the stage complete. Submit the work and its evidence for independent review (`.opencode/agents/devops-mentor.md:105-106`).

## 2. Target competency and learning objectives

Source: `modules/m03-managing-resources-with-network-provisioning/brief.md:5-7` (Objective).

By the end of this stage the learner can explain how Terraform works out what depends on what, create several similar resources without writing each one out by hand, and read information that already exists instead of hard-coding it — using the small AWS network they built as the evidence, not a diagram.

## 3. Deliverable and definition of done

**Deliverable** (`brief.md:28-30`): a small AWS network configuration — one VPC with public and private subnets across more than one availability zone and the routing the public tier needs — with no NAT gateway.

**Definition of done** (`brief.md:48-56`), which the mentor must have the learner evidence, never assume:

- **DoD-01** — formatting and validation pass with no errors, and the plan contains the VPC, subnets in at least two AZs and the public-tier routing, with resource addresses taken from the plan output (or its JSON form), not from the code.
- **DoD-02** — subnets across more than one AZ are created by repeating one resource block, not by writing each one out (a reviewer reads the configuration).
- **DoD-03** — at least one value the configuration needs about the account or region is read with a data source, not hard-coded (a reviewer reads the configuration).
- **DoD-04** — no NAT gateway appears in the plan or in state, shown from real output, not from the absence of one in the code.
- **DoD-05** — the note names the **implicit** dependencies in the learner's own configuration and where each comes from, not a general definition.
- **DoD-06** — everything is destroyed, confirmed **from the cloud side**, not only from Terraform's output.
- **DoD-07** — the write-up takes a first-time learner to the same small AWS network unaided, verified end to end from a clean state.

## 4. Stage constraints and boundaries

Source: `brief.md:19-26` plus the course-wide rules (`README.md:80-91`).

- All rules for every stage apply (no exception in this stage).
- AWS only; **no NAT gateway anywhere in this stage**, and no compute instances, security groups or IAM roles.
- Some networking resources bill by the hour — look up what each resource in the plan bills before applying, and destroy everything at the end.
- State is **local** in this stage (remote state is M02's theme, not repeated here).
- Anything repeated across AZs is repeated by **one of the mechanisms in scope**, and the notes say which.
- Native locking, remote backends, `.tfvars`, dynamic blocks and modules are all out of scope here.
- **Out of scope:** variables and validation (M04), advanced repetition, dynamic blocks and in-depth data sources (M06), and reusable modules (M07).

## 5. Research prompts the learner must resolve alone

Source: `brief.md:13-17`. Each is **sensitive**: the mentor must never state the answer, name the mechanism, or confirm the choice. They belong in the write-up's "Why it's built this way" section (leak rule, `docs/templates/trainee-task-planner.md:44-56`).

- **Resource references / dependency graph:** where in the learner's configuration they relied on Terraform to infer ordering.
- **Implicit vs explicit dependencies:** whether there was anywhere they had to state an ordering explicitly, and why.
- **Repeating a resource:** the trade-offs between the two ways of repeating a resource and why the course wants one preferred; and what happens to existing subnets if one is later added to or removed from the set being repeated over.
- **Data sources:** the difference between a resource and a data source in what Terraform manages, and what happens to each when you destroy.
- **A VPC, subnets across AZs, and public-tier routing:** what the routing for a public tier needs, and how the learner would see it in the plan.

## 6. Dependencies and prerequisites

- **M01 must be accepted first** (`tasks.md:11`). At handover time M01 has no learner build or acceptance record, so this is an open prerequisite — confirm M01 is complete and accepted before starting M03.
- Pre-made, short-lived AWS sandbox access via IAM Identity Center (ADR-005) — an ongoing hard dependency on the sandbox owner.
- **Sandbox capability:** the learner must be able to create a VPC, subnets and routing (`brief.md:66`). If not, raise it with the trainer **before** starting.
- `versions.env` at the repo root pins Terraform to `1.16.5` and the providers (ADR-010).
- Toolchain as M01: Terraform via a version manager, AWS CLI, Git, `jq`, VS Code + HashiCorp extension.

## 7. Risks, failure modes and still-open items

From `brief.md:64-67` plus stage boundaries and ADRs:

- **Sandbox VPC permission** — if the role cannot create a VPC/subnets/routing, the stage cannot be built; escalate, do not work around.
- **Cost** — check what each networking resource bills before applying; NAT is excluded here for cost reasons (ADR-011), so its absence is load-bearing, not incidental.
- **`count` vs `for_each` re-indexing** — the choice affects what happens when the set being repeated over changes (a research prompt; keep the mechanism out of hints).
- **Brief-level leak (trainer decision)** — the brief pre-empts parts of research prompts 1, 2, 3 and 5: `brief.md:13` couples "references" with inferred ordering (prompt 1); `brief.md:41` names where an explicit dependency is needed (prompt 2); `brief.md:61` ("Best practices this stage demonstrates") names `for_each` over `count` (prompt 3); `brief.md:40` enumerates the public-tier routing components (prompt 5). Prompt 4 is not pre-answered. Trainer to decide whether to reword the brief and regenerate `tasks.md`/`write-up-template.md`, then run a fresh end-to-end leak re-read. The coaching package withholds the answers regardless (package §6).
- **Hard-coded account/region values** — DoD-03 requires a data source; watch for a literal that should have been read.
- **Local state hygiene** — no `terraform.tfstate*` committed (rules for every stage).
- How much detail the notes need — confirm expected length/depth with the trainer.

## 8. Evidence and acceptance gate

Evidence to capture (`brief.md:44`): the plan showing the VPC, subnets and public routing (addresses from the plan/JSON); where the dependencies come from; the data source in use; and the destroy confirmed from the cloud side.

Acceptance follows the stage rubric (`README.md:97-114`): total ≥ 70/100, deliverable works, every DoD item met and evidenced, and no stored credential, no committed state file and nothing left running that the brief says to destroy. A stage scoring ≥ 90 is a candidate for the content library.

**Acceptance gate for this handover:** the mentor hands the learner's build + write-up + evidence to the **Technical Reviewer**; the mentor does not self-approve.

## 9. Source references

- `modules/m03-managing-resources-with-network-provisioning/brief.md` — objective, scope/research prompts, constraints, deliverable, lab, DoD.
- `modules/m03-managing-resources-with-network-provisioning/tasks.md` — generated checklist.
- `modules/m03-managing-resources-with-network-provisioning/write-up-template.md` — write-up sections.
- `README.md:80-91` — rules for every stage; `README.md:93-116` — review rubric.
- `docs/arch-docs/adrs/ADR-002-terraform-cli-with-opentofu-sidebar.md`, `ADR-003-aws-primary-gcp-azure-setup-only.md`, `ADR-005-sandbox-accounts-and-short-lived-credentials.md`, `ADR-009-local-check-scripts.md`, `ADR-010-content-ci-and-version-pinning.md`, `ADR-011-cost-and-destroy-controls.md`, `ADR-015-sandbox-compatible-tooling-only.md`.
- `docs/handovers/m01-getting-started-with-terraform-handover.md` — the stage this builds on.
- `.opencode/agents/devops-mentor.md`, `.opencode/agents/curriculum-architect.md`.
- `docs/build-to-teach-framework/build-to-teach-framework.md`.
