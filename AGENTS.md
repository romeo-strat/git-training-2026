# AGENTS.md

## Project

Terraform training course (build-to-teach): nine stages in `modules/` (M01–M09) plus a capstone (M10).
Learner-facing content is markdown; `site/` is a static HTML version of the stages. Trainer-only material
lives in `docs/` and `knowledge/`. A "module" here means a training stage, not a Terraform module.

## Layout

| Path | What it is |
| --- | --- |
| `modules/<stage>/` | `brief.md`, `tasks.md`, `tutorial.md`, `write-up-template.md` |
| `site/` | HTML version of M01–M09 — editable (AI-generated, not a build artifact) |
| `tools/` | `build-site.mjs`, `check-site.mjs` (zero-dependency Node) |
| `docs/` | Trainer material: templates, ADRs (`docs/arch-docs/adrs/`), reference builds |
| `knowledge/` | Maintainer library: rules, patterns, prompts, retros |
| `versions.env` | Single source of truth for pinned versions (ADR-010) |

## Hard rules

- Never edit `brief.md` or `write-up-template.md`.
- Never answer a stage's research prompts in learner-facing content; Examples never answer a prompt.
- No solutions in learner-facing files; `docs/reference-builds/` is trainer-only — never surface it to learners.
- Take exact versions from `versions.env`; never invent newer pins.
- No static credentials, committed state files or secrets anywhere (ADR-005).
- Briefs say what to build, never how; keep them that way when editing.
- Design decisions: check `docs/arch-docs/adrs/` first.

## Workflow

Run every task in this repo through the EPAV cycle: `/epav <task>` —
EVALUATE → PLAN → approval gate → APPLY → VALIDATE (`.opencode/commands/epav.md`).
Stop at the gate until the user explicitly approves; one task at a time.

## File roles

- `tutorial.md` is derived from `brief.md` and `tasks.md`: one Part per lab step, one "Your turn" per research prompt, answers left out. Use `docs/templates/tutorial-template.md` as the base structure; no "Keep two things at hand" block, no "Where does my code live?" section.
- `tasks.md` is generated from the brief (`/trainee-task-planner re-plan <stage>`); don't hand-edit.
- `write-up-template.md` copies prompts, scope topics and DoD bullets from the brief word for word.
- Capstone checklist is hand-written from capstone templates, not generated.

## Regenerating the site

When tutorials, checklists or the root README change, rebuild and verify:

    node tools/build-site.mjs
    node tools/check-site.mjs

`check-site.mjs` must exit 0. After a rebuild, diff `site/` — the regenerated output may overwrite hand edits.
