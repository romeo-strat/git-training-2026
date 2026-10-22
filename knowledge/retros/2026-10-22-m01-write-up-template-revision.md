# 2026-10-22 — The M01 write-up template was revised, and everything else had to follow

The trainer revised `modules/m01-getting-started-with-terraform/write-up-template.md` by hand: the header table (`Trainee` / `Status` / `Build location` / `Hours spent`) is gone, the seventeen research prompts copied from the brief collapsed into four curated key decisions, the concept candidates are named ("what a provider is, default tags, or the anatomy of a resource"), and the definition-of-done bullets are grouped into three evidence slots instead of listed one by one. The template is the source of truth and must not be edited, so the compliance work ran the other way: M01's tutorial, filled write-up and checklist were brought to the template. Findings worth keeping for the other eight stages, the capstone and the next course.

## What changed in the template

| Before | After |
| --- | --- |
| Header table with `Status: Draft → In review → Revising → Accepted` | No header; the filled copy carries the status in its self-assessment instead |
| "One entry per research prompt in the brief's scope" (17 entries) | Four key decisions in the trainer's words |
| Concept candidates = the brief's five scope topic titles | Three named candidates, pick 2–3 |
| One checkpoint-evidence bullet per DoD-01…DoD-07 | Three grouped slots: DoD-01+02, DoD-05+06, DoD-06 |

## Findings

| # | Finding | Consequence / action |
| --- | --- | --- |
| 1 | The revision breaks a standing rule: `AGENTS.md` says `write-up-template.md` "copies prompts, scope topics and DoD bullets from the brief word for word", and `docs/templates/README.md` and `docs/templates/write-up-template.md` say the same. The revised template is **curated, not copied**. | Either the rule changes or M01's template regresses. If the new shape is house style, `AGENTS.md`, `docs/templates/README.md` and `docs/templates/write-up-template.md` need the same revision. Left open — it is a policy call, not a copy-editing one. |
| 2 | Dropping the header table broke three instructions that still assume it: `docs/templates/tasks.md:23` ("fill in the header table"), `docs/templates/tasks.md:38` ("set Status in `write-up.md` to 'In review'"), `docs/templates/tutorial.md:197` (same) and `README.md:23` / `README.md:38`. M02–M09 and the capstone still ship the old template shape, so their checklists are still correct — M01's were not. | M01's `tasks.md` was hand-synced and its tutorial's Part 6c stopped telling the learner to set a Status field. If the new shape spreads, the generator templates and the README must be updated **before** the other stages are re-planned, or those stages will regress. |
| 3 | The four key decisions do not cover every research prompt in the brief: the install-method, Windows-versus-macOS and version-manager prompts (Part 1a) and the provider-tags prompt (Part 3) have no key decision of their own. But the rubric grades "Every research prompt in the brief has a reasoned answer" (`README.md:104`). | The tutorial now carries an explicit mapping — every prompt has a named home: a key decision, "How to build it", or "Concepts worth explaining". That keeps the brief's scope alive without contradicting the template. Any stage whose template is revised the same way needs the same mapping. |
| 4 | `tasks.md` cannot express where a prompt's answer goes — it has one task per `##` section of the template (`docs/templates/tasks.md:37`). The mapping between research prompts and write-up sections can only live in the tutorial. | The tutorial is the only learner-facing place that can route 20 research prompts into 9 write-up sections. Treat the tutorial's Part 6c as a required section whenever a write-up template changes shape. |
| 5 | `tasks.md` is "generated from the brief; don't hand-edit" (`AGENTS.md`), but its write-up checklist is derived from the **write-up template**, and `/trainee-task-planner` is not installed in this repo (only a copy at `docs/templates/trainee-task-planner.md`). | M01's `tasks.md` was hand-synced to what a re-plan would produce, with the checkbox count unchanged (27) so `tools/check-site.mjs` still matches. Re-plan M01 when the planner is available, and change `docs/templates/tasks.md:23` and `:38` first, or the re-plan will put the header-table wording back. |
| 6 | `tools/check-site.mjs` hard-fails when the tutorial's "Your turn" bullet count, the site's answer-box count and the checklist's box count disagree — so a template change that touches prompt counts breaks the site build. | Keep prompt counts stable when a template is revised. The compliance pass changed wording only: 20 research prompts → 20 "Your turn" boxes → 20 answer boxes. |
| 7 | The filled write-up (`write-up.md`) is the only real instance of the template in the repo — the site renders the template, never a filled copy (`tools/build-site.mjs:514`). | It is the only place a template change can be proven to work end to end. Restructure it with the template, not after it; a filled write-up on the old shape is the fastest way to find the guidance that no longer has a home. |

## Rule for the next template revision

Change the template first, then work backwards: rewrite the filled write-up (the only proof the shape works), sync the checklist's write-up items to the new section guidance, route the tutorial's Part 6c to the new sections and map every research prompt to a home, then rebuild the site. Keep the prompt count stable so `check-site.mjs` keeps passing.

## Still open

- Is the revised template the house style for M02–M09, the capstone and `docs/templates/write-up-template.md`? If yes, `AGENTS.md`'s "word for word" rule, the generator templates and `README.md` all need one more pass.
- The rubric still grades "every research prompt in the brief" (`README.md:104`) while the template asks for four questions. Either the rubric line changes, or the mapping in the tutorial stays the thing that reconciles them.
- "Status" is gone from the template, so a learner no longer has a field to flip. The M01 write-up signals "Draft — not ready for review" inside the self-assessment; if the shape spreads, decide whether a status line returns in some other form.
