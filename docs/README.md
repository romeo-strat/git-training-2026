# Trainer and maintainer notes

Material for the people who run and maintain the course. Trainees do not need it: their guide is the [root README](../README.md).

| Path | What it holds |
| --- | --- |
| [templates/](templates/README.md) | Reusable templates for a stage brief, a capstone brief, the write-ups, the checklists and the course README, a copy of the planner command, and the [playbook](templates/build-to-teach-playbook.md) for building a course like this one |
| `arch-docs/` | The design documents behind the course (trainers only) |
| `handovers/` | Per-stage Curriculum Architect → DevOps Mentor handovers and the mentor's coaching packages (trainers only) |
| `reference-builds/` | Trainer-only model answers standing in for learner builds (e.g. `m01/`). **Reference solutions — never trainee-facing, never a real learner build** |
| `build-to-teach-framework/` | The framework this course follows. It calls the trainer the EM |
| [../knowledge/](../knowledge/README.md) | The learning-content library: `proposed/` drafts, `approved/` verified content (promotion gate in [approved/README.md](../knowledge/approved/README.md)), plus `retros/`, `patterns/`, `rules/` and `prompts/` |
| `../.claude/commands/` | Project commands, including `/trainee-task-planner`. This folder is not tracked in git, so the planner is also kept as [a copy in `templates/`](templates/trainee-task-planner.md) |

## Keeping the stage files in step

- A stage's `tasks.md` is generated from its brief. After a brief changes, regenerate it with `/trainee-task-planner re-plan <stage>`. The capstone's checklist is written by hand, from the capstone templates.
- A stage's `write-up-template.md` is generated from its brief too: its research prompts, scope topics and definition-of-done bullets are copied word for word.
- The briefs say nothing about how to build a stage. Before you change one, check that no scope description, constraint or definition-of-done bullet answers one of its research prompts.
- The capstone's `data/` folder (the application in three versions, a starter catalogue, a starter theme and images, an optional `probe.sh`, and `check.sh`) is supplied by the trainer and is not in this repository yet.
- `versions.env` at the repository root is the single source of truth for pinned tool and provider versions — exact pins, from which activity `required_providers` constraints are derived (ADR-010); commit it and read pins from it.
