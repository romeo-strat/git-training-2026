# 2026-10-02 — Brief lines that answer their own open questions

A brief hands the trainee a problem on purpose. Its research prompts are for the trainee to resolve alone, from their own build, and no derived artifact may restate them (leak rule, `docs/templates/trainee-task-planner.md:44-56`). But a brief line **elsewhere** — a stack constraint, a lab step, a definition-of-done item, a "Best practices this stage demonstrates" entry — can concede the answer a prompt is there to make the trainee reach. Each such line reaches the trainee as an instruction even though no task states it. The playbook's leak re-read names the class and says to reword the lines it finds before moving on: "These are the briefs that answer their own questions; each one reaches the trainee as an instruction" (`docs/templates/build-to-teach-playbook.md:86`).

## Findings

| # | Finding | Consequence / action |
| --- | --- | --- |
| 1 | **A "Best practices this stage demonstrates" line can name the answer.** M03 lists "`for_each` over `count`" (`brief.md:61`), but its research prompt 3 asks the trainee to weigh the two ways of repeating a resource "and why the course wants one preferred". | The brief's own summary line gives the preference away. Reword the best-practices entry to name the competency (choosing a repetition mechanism and justifying it), not the winner. |
| 2 | **A lab step can name the mechanism a prompt asks for.** M03's lab says to add "one `depends_on` where a reference cannot say what you need" (`brief.md:41`); research prompt 2 asks whether the trainee had to state an ordering explicitly, and why. | The step supplies both the argument and the reason. Reword the step to ask for the ordering without naming `depends_on`. |
| 3 | **A scope line can couple a topic to its conclusion.** M03's "references and the dependency graph" line states the ordering Terraform infers (`brief.md:13`), and the lab's routing step enumerates the public-tier components (`brief.md:40`). | Prompts 1 and 5 are pre-answered. Keep the topic; drop the clause that states the outcome. |
| 4 | **A definition-of-done item can assert what a prompt asks the trainee to prove.** M02's DoD-03 states that a no-change plan after migration proves nothing was recreated, and DoD-05 states that a second operation is refused with a lock error (`brief.md:58`, `brief.md:60`). | Prompts 5 and 6 are conceded. This is a brief-level decision: reword the DoD checks, or have the trainee reach the claim from their own evidence. |
| 5 | **Not every brief line leaks.** In the same M03 brief, research prompt 4 (a resource versus a data source) is **not** pre-answered. | The check is per-prompt, not per-brief: read each prompt against every other line, rather than judging the brief as a whole. |

## How to fix a self-answering brief

Change the brief first, then regenerate — never patch the generated files:

- Reword the offending line in `brief.md` (a constraint, a lab step, a DoD item or a best-practices entry) so it names the deliverable or the competency, not the mechanism, choice or reason a prompt asks for.
- Regenerate `tasks.md` and the write-up template, so both are rebuilt from the reworded brief (`docs/README.md:17`, `docs/templates/build-to-teach-playbook.md:186`).
- Re-run the end-to-end leak re-read: each research prompt against every other line in the brief and in the regenerated artifacts.

## Drafting rule for new briefs

Write the research prompts and the constraint, DoD and best-practices lines together, and check them against each other. A line that names the mechanism, the preferred option, the reason, or the pinned source of truth a prompt sends the trainee to discover is a leak — even when it is a fact the trainee genuinely needs, such as the exact version pinned in `versions.env`, or a `lifecycle` control the stage requires.

## Still open

- Whether the trainer rewords the M03 and M02 briefs and regenerates their `tasks.md` and write-up templates, or withholds the answers in the training material instead.
- Whether the leak re-read should run as a standing step whenever a brief is first drafted, rather than as a fix after the fact.
- The same restatement risk exists in trainer-facing derived assets, not only in the brief — recorded separately in `knowledge/retros/2026-10-14-handover-to-devops-mentor.md` (finding 4).
