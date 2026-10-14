# M03 — DevOps Mentor Coaching Package

> **Trainer/agent material. Not trainee-facing.** Companion to [m03-managing-resources-with-network-provisioning-handover.md](m03-managing-resources-with-network-provisioning-handover.md). Produced from the Curriculum Architect → DevOps Mentor handover. Follows the teaching sequence in `.opencode/agents/devops-mentor.md:14-26`; the mentor does not mark the stage complete and submits evidence for independent review (`devops-mentor.md:105-106`).
>
> **Leak control:** none of the five research prompts in `modules/m03-managing-resources-with-network-provisioning/brief.md:13-17` are answered here. No exercise, hint, troubleshooting row, knowledge-check question or line of prose states, names a mechanism for, implies, or confirms/eliminates any prompt answer. Sensitive items are marked `Sensitive — answer belongs in the write-up (research prompt N)`. Hints narrow *where to look, what to compare and what to record* — never the conclusion. The learner resolves every prompt alone, in the write-up's "Why it's built this way" section.

## 0. Prerequisite gate (BLOCKING — resolve before any build)

| Gate | Status at handover | Action |
|---|---|---|
| **M01 accepted** (`tasks.md:11`, handover §6) | **NOT met.** `modules/m01-getting-started-with-terraform/` holds only `brief.md`, `tasks.md`, `write-up-template.md` — no `write-up.md` and no learner build or acceptance record. The same absence is noted in the M02 package §0. | Confirm M01 is complete, accepted and its clean-up gate clean **before starting M03**. |
| AWS sandbox via IAM Identity Center, short-lived sign-in only (ADR-005) | Assumed; unverifiable here | Live dependency on the sandbox owner. No static access key ever created or stored (`README.md:86`). |
| **Sandbox can create a VPC, subnets and routing** (`brief.md:66`) | **Unverified — pre-flight** | Before building, confirm the role can create **and** delete a VPC, subnets and routing. If it cannot: **escalate to the trainer — do not work around** (`handover §7`). |
| Terraform ≥ 1.11 | **Met by pin** — `versions.env`: `TF_VERSION=1.16.5`, `AWS_PROVIDER_VERSION=6.68.0` (ADR-010) | Read the pin from `versions.env`; do not hard-code a version. |

**Focused question to the learner (one, per `devops-mentor.md:131`):** has M01 been reviewed and accepted, and is its clean-up gate confirmed clean? If not, stop — M03 does not begin.

## 1. Coaching plan (mapped to scope topics / lab steps / `tasks.md`)

### Coverage matrix

| # | Scope topic (`brief.md:13-17`) | Lab step (`brief.md:38-42`) | `tasks.md` | DoD |
|---|---|---|---|---|
| 1 | Resource references and the dependency graph Terraform builds from them | Lab 1, 4 | B01 | DoD-01, DoD-05 |
| 2 | Implicit versus explicit dependencies | Lab 4 | B02 | DoD-05 |
| 3 | Repeating a resource | Lab 2 | B03 | DoD-02 |
| 4 | Data sources | Lab 1 | B04 | DoD-03 |
| 5 | A VPC, subnets in more than one AZ, and the routing a public tier needs | Lab 2–3 | B05 | DoD-01, DoD-04 |
| — | **Deliverable:** one VPC with public and private subnets across more than one AZ and the routing the public tier needs, with no NAT gateway (`brief.md:28-30`) | Lab 1–3 | B06 | DoD-01…DoD-07 |

### Phases

- **Phase 0 — Setup (Setup 1–3):** read `brief.md` top-to-bottom and `README.md:80-91`; copy `write-up-template.md` → `write-up.md` (leave the template untouched); confirm M01 accepted + tools/access; note the stage constraints — AWS only, **no NAT gateway, no compute instances, security groups or IAM roles** (`brief.md:22`), and **state is local in this stage** (`brief.md:24`); read the pin from `versions.env`; complete the §0 prerequisite gate and the VPC pre-flight before any build.
- **Phase 1 — Dependency graph & references (B01 · Lab 1, 4 · E1–E3 · DoD-01, DoD-05):** `aws_vpc` + `data "aws_availability_zones"` in `main.tf`; `init`; run `terraform graph`; find one dependency between two of your blocks; **read-only inspection only**.
- **Phase 2 — Implicit vs explicit dependencies (B02 · Lab 4 · E4–E5 · DoD-05):** add exactly **one** `depends_on` (Lab 4); capture before/after plan and graph.
- **Phase 3 — Repeating a resource (B03 · Lab 2 · E6–E7 · DoD-02):** repeat one `aws_subnet` block across zones; the learner chooses one of the two mechanisms in scope and records which and why. **Do not reveal which is preferred.**
- **Phase 4 — Data sources (B04 · Lab 1 · E8–E9 · DoD-03):** consume the data source's output where the configuration needs it instead of a literal.
- **Phase 5 — VPC / subnets / routing (B05 · Lab 2–3 · E10–E11 · DoD-01, DoD-04):** `aws_vpc` and public/private subnets across ≥ 2 AZs, then the rest of the network exactly as the brief's lab step 3 lists it. **No NAT gateway anywhere** (`brief.md:22`, ADR-011).
- **Phase 6 — Deliverable assembly (B06 · Lab 3–5 · E12–E13 · DoD-01):** `run` `fmt -check -recursive` + `validate`; `terraform plan -out`; resource addresses taken from the plan output or its JSON form, never from the code; cost pre-check before any apply; `apply`; view the network in the console.
- **Phase 7 — Verify (V01–V07 = DoD-01…07 · E14):** see §3. `destroy`; confirm from the cloud side; capture redacted evidence.
- **Phase 8 — Write-up (W01–W10):** fill sections **as the learner builds**, then set Status → "In review" and tell the trainer. Code lives in the learner's own GitLab repo, linked from the write-up header.

## 2. Focused exercises + escalating hints

> **Explicit leak statement:** the five research-prompt answers are withheld. No exercise names, confirms or eliminates a mechanism, an option or a reason the learner must reach alone. Hints are process-level only — where to look, what to compare, what to record. Answers appear only in the learner's write-up.

**Phase 1 — Dependency graph & references**
- **E1 — Read the graph.** After `init`, run `terraform graph` and capture its output; identify the nodes (your blocks) and the edges (which block points at which). *Hint 1:* send the output to a file and read it line by line rather than trying to hold it on screen. *Hint 2:* if it looks empty, you have not yet written a reference between two blocks — that is the thing to look for. *Escalate* only if the command itself errors.
- **E2 — Find a dependency between two of your blocks.** Point at one edge in the graph and the two blocks it joins, and quote the expression that connects them. *Hint:* if the graph shows no such edge yet, revisit how the values in your arguments are written. Record the pair and the expression; do not conclude *how* ordering is inferred — that is the write-up.
- **E3 — Research prompt 1 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 1).* Process only: list every place in your own configuration where one block's value comes from another block, and record each. Then record where you would rely on that connection without writing anything extra. Do not state the inference rule or confirm which orderings were inferred.

**Phase 2 — Implicit vs explicit dependencies**
- **E4 — Add exactly one `depends_on` (Lab 4).** Add exactly **one** `depends_on` in your configuration and capture the plan and graph before and after. *Hint 1:* the brief asks for *exactly one* — if you are adding several, keep narrowing to the single case that genuinely needs it. *Hint 2:* compare the graph before and after adding it — does it add anything you could not already see? Do not state when an explicit dependency is required — that is prompt 2.
- **E5 — Research prompt 2 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 2).* Process only: record whether you added an explicit ordering at all, where, and what changed in the plan/graph as a result. Do not state which ordering Terraform infers and which you would have to state.

**Phase 3 — Repeating a resource**
- **E6 — Repeat the `aws_subnet` block across zones (Lab 2, DoD-02).** Create the subnets in different zones by repeating **one** `aws_subnet` block with one of the two mechanisms the brief names; record which you used and why. *Hint 1:* the brief names both; pick one and write down your reasoning in the write-up. *Hint 2:* after repeating, look at the addresses the plan reports for the block. **The mentor does not indicate which mechanism is preferred.** Do not state what happens to existing subnets when the set changes — that is prompt 3.
- **E7 — Research prompt 3 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 3).* Process only: record the mechanism you chose and the reasoning behind it, and note how the set you repeat over is defined. Then answer the prompt's trade-off and set-change questions in the write-up. Do not state the trade-offs, the course's preference, or the effect on existing subnets in this package.

**Phase 4 — Data sources**
- **E8 — Add the data source (Lab 1, DoD-03).** Add the `data "aws_availability_zones"` data source exactly as the brief names it, and feed its result into your configuration where the zones are needed, instead of a literal. *Hint:* run `fmt -check -recursive` and `validate` right after adding it. Record the value your configuration now reads rather than hard-codes. Do not explain how a data source differs from a resource — that is prompt 4.
- **E9 — Research prompt 4 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 4).* Process only: record which value your configuration now reads instead of hard-coding, where it is consumed, and what you observed about it across plan, state inspection and destroy. Do not state the resource-versus-data-source distinction or what happens to each on destroy.

**Phase 5 — VPC / subnets / routing**
- **E10 — Build the network (Lab 2–3, DoD-01, DoD-04).** Build the `aws_vpc` and the public and private subnets across ≥ 2 AZs (repeated blocks from E6), then the rest of the network exactly as the brief's lab step 3 lists it. *Hint 1:* work from the brief's lab step 3 resource list; `fmt -check -recursive` + `validate` before any apply. *Hint 2:* confirm **no NAT gateway** block exists anywhere in your configuration. Do not explain what a public tier's routing needs — that is prompt 5.
- **E11 — Research prompt 5 → write-up only.** *Sensitive — answer belongs in the write-up (research prompt 5).* Process only: capture the plan and note which routing resources appear and where; record how you would point to the public tier's routing in the plan. Do not state what that routing needs or how it appears.

**Phase 6 — Deliverable assembly**
- **E12 — Read the plan (Lab 4, DoD-01).** Run `terraform plan -out`; capture the resource addresses from the plan output or its JSON form, not from your code. *Hint 1:* check the plan lists the VPC, subnets in ≥ 2 AZs and the routing; confirm no NAT gateway appears. *Hint 2:* before apply, look up what each resource in the plan bills and write your **own** estimate (`README.md:88`; ADR-011). Billing APIs are not used — your estimate is the evidence.
- **E13 — Apply and inspect.** `apply`, then view the VPC, subnets and routing in the AWS console. *Hint:* if the console view does not match what your write-up says you built, one of the two is wrong — reconcile before continuing.

**Phase 7 — Verify**
- **E14 — Destroy and confirm from the cloud side (DoD-06).** `terraform destroy`, then use cloud-side, read-only queries to confirm the VPC, subnets, internet gateway and route table are gone. *Hint 1:* Terraform's "Destroy complete" is not, on its own, cloud-side evidence. *Hint 2:* redact account IDs and ARNs in everything you paste. No NAT gateway is created or left behind.

## 3. Verification instructions and exact evidence (DoD-01…DoD-07)

All AWS queries are **cloud-side and read-only**; all Terraform state inspection is **read-only**. Redact account IDs and ARNs. Paste output trimmed to the relevant lines (`README.md:99`). Everything in this table is **UNVERIFIED** here — there is no sandbox and no learner build (see §6).

| DoD | Run (read-only where cloud-side) | Paste / capture | Acceptance | Caveat |
|---|---|---|---|---|
| **DoD-01** | `terraform fmt -check -recursive`; `terraform validate`; `terraform plan -out=tfplan`; `terraform show -json tfplan` | fmt/validate output (no errors); resource addresses from the plan output or its JSON form | Passes with no errors; plan lists the VPC, subnets in ≥ 2 AZs and the public-tier routing | Addresses from the **plan**, not from the code. Only the learner can produce this. |
| **DoD-02** | Read the configuration; `terraform state list` filtered to `aws_subnet` | The **one** repeated `aws_subnet` block, plus the multiple subnet addresses it produced | One block, repeated by the chosen mechanism — not each subnet written out | Reviewer reads the config; `state list` is corroboration, not the deciding evidence |
| **DoD-03** | Read the configuration; `terraform show tfplan` / plan output | The `data "aws_availability_zones"` block and where its output is consumed instead of a literal | At least one account/region value read with a data source, not hard-coded | Reviewer reads the config. Do not explain resource-vs-data-source here (prompt 4) |
| **DoD-04** | `terraform show -json tfplan` searched for NAT resource addresses; `terraform state list` (`brief.md:53`) | Plan/JSON (and, after apply, `state list`) showing **no** NAT gateway address anywhere | No NAT gateway in the plan **or** in state, from real output | Absence of a NAT block in the code is **not** the evidence — the plan/state output is |
| **DoD-05** | `terraform graph`; read the learner's write-up note | The note naming each **implicit** dependency in their own configuration and where each comes from, cross-checked against the graph | Names the specific dependencies in their config, not a general definition | Reviewer checks the note refers to the learner's own blocks |
| **DoD-06** | After `destroy`: `aws ec2 describe-vpcs`, `describe-subnets`, `describe-internet-gateways`, `describe-route-tables` (read-only) | Empty results for the learner's VPC/subnets/IGW/route table; redacted | Cloud side proves nothing remains | Terraform's own output alone is insufficient. No NAT created |
| **DoD-07** | Follow the learner's own "How to build it" end-to-end from a **clean state** | Dated run-through notes + corrections | A first-time learner reaches the same small AWS network unaided | Only the learner can produce this |

**Stage clean-up gate (`README.md:111`; ADR-011):** `destroy` **everything**; **no NAT gateway** is created at any point; no static credential stored; no `terraform.tfstate*` committed; nothing left running. Confirm cloud-side, not just from Terraform output.

## 4. Troubleshooting map

Process-level diagnostics only. Where a cause touches a research prompt it is marked and never stated.

| Symptom | Process-level diagnostic | Smallest fix / where to look |
|---|---|---|
| `ExpiredToken` / SSO session expired (ADR-005) | `aws sts get-caller-identity` fails the same way | Re-login (`aws sso login`); re-check identity before continuing |
| `No valid credential sources found` | `aws sts get-caller-identity`; check `AWS_PROFILE` / region | Point at the correct profile; **never** create a static key |
| Region / AZ mismatch (a zone or region is not what you expected) | Compare the data source's output with the provider region in use; check `AWS_REGION`/profile | Align provider region and the zones your configuration consumes; re-run `plan` |
| CIDR overlap (apply rejected) | Compare each subnet CIDR against the VPC CIDR and against each other | Give each subnet a distinct, in-range CIDR; re-run `validate` then `plan` |
| **Plan proposes changes you did not expect after the repeated set changes** | Capture the plan; list which addresses changed and compare against what you expected; record it | **Sensitive — answer belongs in the write-up (research prompt 3).** Stop; do not apply; capture the exact plan and reconcile before acting |
| **Data source returns unexpected values** | Capture the data source's outputs; compare against the console for the region you configured | **Sensitive — answer belongs in the write-up (research prompt 4).** Do not state what a data source manages; record observed vs expected in the write-up |
| **`depends_on` masking a missing reference** | Re-read the graph; check whether the ordering you stated hides a connection you meant to write as a reference | **Sensitive — answer belongs in the write-up (research prompt 2).** Reduce to the single explicit dependency the brief asks for |
| **Route / association ordering** | Capture plan and graph; identify which blocks reference which | **Sensitive — answer belongs in the write-up (research prompt 5).** Do not state what the routing needs; confirm the association references the route table and the subnets |
| `terraform graph` output unreadable | Write it to a file; read node and edge lines one at a time; or view it in a graph renderer | Read the file rather than the screen; do not conclude anything about inference from readability |
| **A NAT gateway appears in the plan** | Search the plan output/JSON for the NAT resource address; find which block declared it | **Constraint violation** (`brief.md:22`): remove that block; NAT is out of scope for this stage. Re-run `plan` and confirm it is gone |
| `AccessDenied` creating a VPC/subnet/route | Error names the denied action/ARN | **Escalate to the trainer (sandbox VPC gap, `brief.md:66`); do not work around** |
| Resource still present after `destroy` | Cloud-side query vs Terraform output | Re-run `destroy` in the **same directory/config**; confirm cloud-side empty |
| **`terraform.tfstate*` appears staged / in `git status`** | Check `.gitignore` and staging | Add/confirm the ignore rule; `git rm --cached` if staged; re-check `git status` |

Order per `.opencode/agents/devops-mentor.md:108-119`. Exact error text goes into the write-up's **"What tripped me up"** (`tasks.md:39`; `write-up-template.md:50`).

## 5. Knowledge check (learner-answerable; mentor supplies no answers)

1. Where did you run `terraform graph`, and how did you get from its output to a named dependency in your own configuration? *(Which orderings were inferred → write-up, research prompt 1.)*
2. Did your configuration need any ordering stated explicitly, and if so where? *(Answer → write-up, research prompt 2.)*
3. Which mechanism did you use to repeat the `aws_subnet` block, and what did you record as the reason? *(Trade-offs, the preferred choice and the set-change effect → write-up, research prompt 3.)*
4. Which account/region value did you read with a data source rather than hard-code, and where is it consumed?
5. Which resources did your public tier's routing require, and how did you point to it in the plan? *(Answer → write-up, research prompt 5.)*
6. Which command shows the resource addresses from the plan rather than from your code, and why does the plan matter for DoD-01?
7. After `destroy`, what **cloud-side** query proves the VPC, subnets, internet gateway and route table are gone — and why is Terraform's own output not enough?
8. What is the pre-flight check for your sandbox before you build, and what is the correct response if it fails?
9. What did you check about what each resource bills **before** you applied, and what is your own estimate?

## 6. What could NOT be verified (no sandbox, no learner build) + handoff to the Technical Reviewer

### Unverified — nothing was invented
There is **no AWS sandbox and no learner build**. `modules/m03-.../` holds only `brief.md`, `tasks.md`, `write-up-template.md`; `modules/m01-.../` has no `write-up.md`. Nothing in this package is a claimed test result, metric or output. Unverified: SSO sign-in and caller identity; **sandbox VPC/subnet/routing permission (the §0 pre-flight)**; `init`/`fmt -check -recursive`/`validate` outcomes; the dependency graph and any inferred or explicit ordering; the repeated-subnet mechanism and its plan addresses; the data source reading; VPC/subnet/IGW/route-table/association creation; absence of NAT; the plan's resource addresses; real cost; cloud-side absence after `destroy`; and the DoD-07 run-through. Not verifiable here because no sandbox access and no learner artifact exist.

### Open trainer decisions (`brief.md:64-67`)
- Whether the sandbox lets the learner create a VPC, subnets and routing — the learner must confirm **before** starting (§0 pre-flight).
- How much detail the notes need — expected length and depth to be confirmed before the learner invests significant time.
- **Brief overlap to confirm:** the brief pre-empts parts of research prompts 1, 2, 3 and 5 — `brief.md:13` couples "references" with inferred ordering (prompt 1); `brief.md:41` names where an explicit dependency is needed (prompt 2); `brief.md:61` ("Best practices this stage demonstrates") names `for_each` over `count` (prompt 3); `brief.md:40` enumerates the public-tier routing components (prompt 5). Trainer to confirm whether to reword the brief and regenerate `tasks.md`/`write-up-template.md`; the mentor does not name the mechanism either way. (Prompt 4 is not pre-answered by the brief.)

### Handoff package to the Technical Reviewer (mentor does **not** self-approve)
1. Learner `write-up.md` (Status = "In review") + GitLab repo/branch link.
2. The network configuration (VPC, public/private subnets across ≥ 2 AZs, internet gateway, route table with default route, association) and the pinned files (`versions.env` pin, committed lock file).
3. DoD-01…DoD-07 evidence, redacted: fmt/validate output, plan addresses from the plan/JSON, the one repeated subnet block, the data source in use, plan/state showing **no** NAT, and cloud-side confirmation of destroy.
4. Clean-up-gate confirmation: nothing left running, no NAT, no stored credential, no committed `terraform.tfstate*`.
5. Trainer confirmations for the sandbox VPC capability (pre-flight) and the expected notes depth.

**Review against `README.md:97-114`:** accept at **≥ 70 total**, the deliverable works, every DoD item met and evidenced, and the clean-up gate clean (no stored credential, no committed state file, nothing left running that the brief says to destroy). A stage ≥ 90 is a content-library candidate.

**Focused question back to the trainer:** confirming M01 acceptance — and the sandbox's VPC capability — are the two blocking inputs before this package can proceed; which do you want resolved first?
