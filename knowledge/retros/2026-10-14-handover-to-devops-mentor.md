# 2026-10-14 — Handing `modules/` to the DevOps Mentor

First end-to-end run of the Curriculum Architect → DevOps Mentor handover for one stage, using the Build-to-Teach cycle (`docs/build-to-teach-framework/build-to-teach-framework.md`) and the EPAV agents. M01 was the pilot; the same cycle has since produced M02 and M03. Findings worth keeping for the next stage and the next course.

## Handover shape that worked

- **One brace of artifacts per stage, both trainer-side.** A handover doc and the mentor's coaching package. Neither goes under `modules/`: that tree stays trainee-clean, per the playbook's trainee-view rule (`docs/templates/build-to-teach-playbook.md:33`).
- **The handover carries requirements, not answers.** Competency, deliverable, DoD-01…07, constraints, dependencies, risks and the acceptance gate — the stage brief restated for the mentor, with nothing added.
- **Sensitive items are listed, never resolved.** The five scope research prompts (`brief.md:13-17`) are named as sensitive so the mentor's hints stay process-level (where to look, what to compare, what to record) and never the conclusion. The same leak rule that governs `tasks.md` (`docs/templates/trainee-task-planner.md:44-56`) applies to coaching.
- **The mentor does not self-approve.** It stops short of "complete" and hands the build + write-up + evidence to the Technical Reviewer.

## Findings

| # | Finding | Consequence / action |
| --- | --- | --- |
| 1 | `versions.env` was absent from the repo but **documented as trainer-supplied** (`docs/README.md`, ADR-010). | Not a bug — a known dependency, now supplied at the repo root (`TF_VERSION=1.16.5` and provider pins). Every stage handover should name the trainer-supplied assets it depends on rather than let the mentor treat absence as breakage. |
| 2 | A stage can have **no learner build** at handover time; `modules/m01/` holds only `brief.md`, `tasks.md`, `write-up-template.md`. | The mentor's output is legitimately a coaching package, not a reviewed artifact. Say this explicitly so "no build" is not read as failure. |
| 3 | Without a cloud sandbox the mentor can verify **nothing runtime** (connectivity, apply/destroy, cost, pinned version). | The package must separate "coaching guidance" from "verified facts" and hand the unverifiable set to the reviewer. |
| 4 | **Trainer-facing derived assets leak by restatement too.** When the curator drafted the M03 knowledge assets, the runbook (§4/§5/§6) and the reuse-note restated the answers to research prompts 1, 2 and 5 (and named `for_each` over `count` for prompt 3) — even though the runbook's own header and the reuse-note's own policy both say the prompts "must not be answered… in any derived asset". | The leak rule is not only trainee-facing; a restated answer in a trainer/maintainer asset propagates when the asset is reused and can drift into learner-visible material. Curate trainer assets with the same "method, never the conclusion" discipline: mark prompt answers `[Learner-owned]`, and disclose brief-level pre-answers rather than restating them. Corrected in the M03 drafts; pairing a reviewer pass with curation of derived drafts is worth keeping. |

## Still open

- Is there an interactive learner, and which OS do they own? The OS-coverage method (`brief.md:76`) is unresolved until the trainer answers.
- Whether the handover doc and coaching package should be committed or kept local — no convention yet.
- The M01 trainer-only reference build (`docs/reference-builds/m01/`) was authored as a stand-in model answer but is **unverified without AWS** (only `fmt` captured; `plan`/`apply`/`destroy`, caller identity and cloud-side checks pending). **Deferred: revise and review it later** before it can be scored — it is a reference solution, never a real learner build.
