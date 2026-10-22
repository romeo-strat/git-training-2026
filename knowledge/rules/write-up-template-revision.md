# Rule — revising a stage's write-up template

Distilled from `knowledge/retros/2026-10-22-m01-write-up-template-revision.md` and
`knowledge/retros/2026-10-22-m02-write-up-template-revision.md`. Applies whenever a stage's
`write-up-template.md` changes shape.

## The order

The template is the source of truth and must not be edited, so the work runs **backwards**
from it:

1. **Template first.** The trainer revises `write-up-template.md`. Nothing else moves until
   it is settled.
2. **Filled write-up.** Rewrite (or write) `write-up.md` against the new template. It is the
   only real instance of the template in the repo, so it is where a shape change is proved to
   work end to end.
3. **Checklist.** Sync the write-up items in `tasks.md` to the new sections — the key
   decisions, the concept candidates, the evidence slots.
4. **Tutorial.** Route the tutorial's "finish the write-up" part to the new sections, and
   give **every research prompt in the brief a named home** (a key decision, a concept, or
   the how-to-build guide). The tutorial never answers a prompt; it only routes them.
5. **Site.** `node tools/build-site.mjs` then `node tools/check-site.mjs`.

## What the template change breaks

| The old template had | What breaks | Where it hides |
| --- | --- | --- |
| A header table (`Trainee` / `Status` / `Build location` / `Hours spent`) | "fill in the header table", "link it from the header of your write-up" | `tasks.md` Setup, `tutorial.md`'s "Where does my code live?" callout, `README.md`, the generator templates in `docs/templates/` |
| A `Status` field to flip to "In review" | "set Status in `write-up.md` to 'In review'" | `tasks.md`'s final self-review item, `tutorial.md`'s closing line |
| One write-up entry per research prompt | The rubric still grades "every research prompt in the brief has a reasoned answer" (`README.md:104`) | Needs an explicit prompt-to-section mapping, and the mapping can only live in the tutorial — `tasks.md` has no way to express it |

## Two invariants

- **Prompt count stays stable.** `tools/check-site.mjs` hard-fails when the tutorial's
  "Your turn" bullet count, the site's answer-box count and the checklist's box count
  disagree. A template change that touches prompt counts breaks the site build.
- **A filled write-up carries no invented output.** Every evidence slot names the exact
  command to run and stays "pending paste". Facts that only the learner's own run can
  supply (where the time went, which obstacles actually happened) are marked as the
  learner's to fill in — never written as if they had happened.

## Syncing a checklist to a revised template

`tasks.md` has one task per `##` section of the write-up template (`docs/templates/tasks.md:37`).
When the template changes shape, each write-up row is rewritten as the template's own
guidance for that section, lifted verbatim — no paraphrase, no invented detail:

| Template section | The row becomes |
| --- | --- |
| What I built | The template's description of the deliverable, with its "(link your repository)" parenthetical rendered as "Link your repository." (M01 and M02 both do this) |
| Why it's built this way (key decisions) | The template's key decisions, flattened in template order, followed by one sentence: "Say what you considered, what you chose, why, and what you gave up." |
| AI collaboration log | The template's opening paragraph — "be specific, not a vague 'I used AI to help write some code' … if you used none, say so in one line" — and nothing more |
| How to build it / Concepts worth explaining / What tripped me up / Definition-of-done self-assessment / What I'd do differently | The template's guidance for that section, verbatim |
| Checkpoint evidence | The template's opening paragraph, then " — cover \<the three slots\>, plus the \<DoD items\>" that sit outside those three slots |

Two things are **not** verbatim, and both are deliberate:

- The rubric sentence in the key-decisions row. The revised stage template no longer holds
  it, but it survives in the generic template (`docs/templates/write-up-template.md:28`) and
  `README.md:104` still grades "says what you considered, what you chose and what you gave
  up" — dropping it would quietly remove a rubric criterion from the checklist.
- The " — cover …" tail on the checkpoint-evidence row, which routes the DoD items that
  sit outside the template's three slots.

What must not move: the row count, the row order, the section headings the rows quote, and
the task IDs — the IDs are the `data-task` keys the site stores a learner's progress under,
so changing one silently resets that task for anyone who has already ticked it.

## Where the filled write-up may and may not live

`modules/<stage>/write-up.md` is the learner's own document and is where the answers to the
research prompts belong. `docs/reference-builds/<stage>/` is the trainer-only model answer
and must never reach a trainee. `tools/build-site.mjs` renders the **template**, never a
filled write-up, so adding one cannot break the site build.
