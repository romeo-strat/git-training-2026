# Templates

Reusable templates for building and maintaining a course like this one. A trainer copies the file that matches the artefact they are producing into place and replaces every `<placeholder>`. Keep these files as the blank master copies — leave them untouched, and edit the copy.

| Template | Produces | Notes |
| --- | --- | --- |
| [brief.md](brief.md) | A stage's `brief.md` | The problem for one stage: objective, scope, constraints, deliverable, lab, definition of done. Trainee-facing. |
| [brief-sample.md](brief-sample.md) | A filled-in example brief | Shows what a complete brief looks like. |
| [tasks.md](tasks.md) | A stage's `tasks.md` | The ordered checklist. Generated from the brief with `/trainee-task-planner`. |
| [write-up-template.md](write-up-template.md) | A stage's `write-up-template.md` | The write-up skeleton. Its research prompts, scope topics and DoD bullets are copied from the brief. |
| [tutorial.md](tutorial.md) | A stage's `tutorial.md` | A self-guided, learner-facing walkthrough of the stage's lab: one Part per lab step, one "Your turn" per research prompt. Shows the moves; never answers a research prompt. |
| [capstone-brief.md](capstone-brief.md) | The capstone's `brief.md` | The capstone is standalone and has its own brief, checklist and write-up. |
| [capstone-tasks.md](capstone-tasks.md) | The capstone's `tasks.md` | Written by hand from the capstone templates. |
| [capstone-write-up-template.md](capstone-write-up-template.md) | The capstone's `write-up-template.md` | The capstone write-up. |
| [course-readme.md](course-readme.md) | The repository root `README.md` | The trainee's guide. Keep the linked headings exactly. |
| [trainee-task-planner.md](trainee-task-planner.md) | A copy of the `/trainee-task-planner` command | Kept here because `.claude/commands/` is not tracked in git. |
| [build-to-teach-playbook.md](build-to-teach-playbook.md) | The playbook | How to build and run a course like this one. |

## The leak rule

A brief and a tutorial are both learner-facing, and both describe the problem rather than the solution. Before you change either, check that nothing in it — a scope line, a constraint, a definition-of-done bullet, a tutorial Example — restates the answer to one of its research prompts. A tutorial's "Your turn" boxes restate the prompts; the answers stay in the trainee's write-up.

## Rendering

Write Markdown that renders everywhere: use plain ``` fences with no language tag, and do not nest a fenced code block or a table inside a blockquote — many viewers show those as literal text.
