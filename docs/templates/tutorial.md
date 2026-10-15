# <Stage ID> — <Stage title>

*A self-guided tour: <from the empty starting point to the finished stage, one line>.*

<!--
TEMPLATE: self-guided stage tutorial. Save alongside the stage as
modules/<stage-folder>/tutorial.md and replace every <placeholder>. Delete these
comments when you are done.

WHAT THIS FILE IS
A learner-facing walkthrough of the stage's lab, written for a trainee working
alone. It is the trainee's companion to brief.md and tasks.md: it shows the MOVES
— tools, files, commands, checkpoints — and nothing more. It is not a solutions
file, and it never answers a research prompt.

HOW TO BUILD ONE FROM A STAGE
1. Read the stage's brief.md. Copy the lab's steps, in order — one Part per lab
   step. Keep the trainee building a real thing, step by step.
2. For every research prompt in the brief's scope (and repeated in
   write-up-template.md), add a "Your turn" box that restates the prompt as an
   activity. Do not answer it.
3. Use the stage's own words for file names, commands, resource names and the
   definition of done. Never invent a trainee's background or infrastructure.
4. Take the write-up section names from write-up-template.md verbatim.
5. Keep the box vocabulary and the two rules below unchanged — they are the format.

HARD RULE (the leak rule)
Nothing in this file may restate a research prompt's answer. Where an Example
would come close, stop short and hand the last step back to the trainee. An
Example must never be usable as the trainee's own evidence.

RENDERING (why it looks plain)
Use plain ``` fences with no language tag, and never nest a fenced block or a
table inside a blockquote — many viewers render those as literal text.
-->

<One short paragraph, in the trainee's voice: what this tour walks them through.>

<One short paragraph: it does not do the thinking for them — the brief's research
prompts are answered in the write-up, and every "Your turn" box is one of them.>

## How to use this tour

Work through the <n> parts in order. Each part has the same simple shape:

| Box | What it means |
| --- | --- |
| **Try it** | A command or action to perform now. |
| **Checkpoint** | What you should see if you got it right. If you don't, stop and fix it before moving on. |
| **Pause and predict** | Think before you act. Write down your guess, then check it against what actually happens. |
| **Example** | A worked illustration of the *shape* of a file, a command's output, or a note's format. Placeholders sit in `<angle brackets>`; yours will differ. |
| **Your turn** | One of your brief's research prompts. Investigate it and record your answer in your write-up. |
| **Watch out** | A common trap. Read it before you hit it. |
| **Explain it** | A nudge to say something in your own words — this is what you'll be asked to teach later. |

You'll see **Example** boxes often. They show you the **shape** of things — a file's structure, what a command's output looks like, how to lay out your notes — so the mechanics are never a surprise. Two rules about them:

- An Example never contains the answer to a research prompt. If it looks like it might, it deliberately stops short: the last step is always yours.
- **Never paste an Example as your own evidence.** Your evidence must be real output from *your* machine. Examples are teaching aids, not proof.

Keep two things at hand the whole way:

- **Your brief** (`brief.md`) — <what it holds for this stage: objective, scope, constraints, deliverable, definition of done>. This tour follows the lab in that brief.
- **Your write-up** (`write-up.md`) — your copy of `write-up-template.md`. Fill it in **as you go**, not at the end. When you fill in the "How to build it" section, write it for someone who will follow it with no trainer to ask.

> **Where does my code live?** <Where the trainee builds and how they link it, e.g. "Not in this repository. Build in a folder of your own, and keep your code in your own Git repository. Link it from the header of your write-up.">

## Where you're headed

By the end of this tour you'll have:

- <deliverable component 1, from the brief's deliverable>;
- <deliverable component 2>;
- <any written artefact the brief asks for>;
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — <name the one or two items that most often block a build>.

---

## Part 1 — <lab step 1 title>

**Goal:** <what this part achieves, in one line.>

<Optional one or two sentences of orientation: why this comes first. Stick to reasons the brief already gives; add no new requirements.>

**Try it**

<Numbered or bulleted actions. Name the exact files, commands and tools the lab names.>

```
<the command(s) to run, as the lab gives them>
```

**Checkpoint**

- <what success looks like, observably>;
- <what appears or prints when it worked>.

**Example — <the shape of the file / command / output this part produces>**

```
<a worked illustration using <placeholders>. Show structure and format only, not
answers. Where a value is a research prompt, leave a <placeholder> and point to
the Your turn box.>
```

<One or two sentences interpreting the example — the mechanics, not the answer.>

**Pause and predict.** <A question the trainee answers before acting, so they compare a guess with reality.>

**Your turn**

- **<Research prompt 1, restated as a question>**
- **<Research prompt 2>**

> **Watch out.** <The trap that costs trainees real time in this part.>

> **Explain it.** In one sentence, say <a concept from this part> as if to a brand-new learner.

---

## Part 2 — <lab step 2 title>

**Goal:** <...>

**Try it**

<...>

**Checkpoint**

<...>

**Example — <...>**

```
<...>
```

**Pause and predict.** <...>

**Your turn**

- **<...>**

> **Watch out.** <...>

> **Explain it.** <...>

---

<!--
Repeat the Part block above once per lab step. Delete this comment in the real file.
Not every part needs every box: drop "Example" where nothing benefits from one,
and drop "Pause and predict" only if there is genuinely nothing to predict.
Never drop "Your turn" — every research prompt must appear exactly once.
-->

## Part <n> — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

### <n>a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted). In particular, make sure you have:

- <DoD evidence item 1, in plain words>;
- <DoD evidence item 2>;
- <...>.

### <n>b. The clean-up gate

Before you call the stage done, confirm <all three / each of these>:

- **No stored credential.** <what that means for this stage>.
- **No committed state or secrets.** <what must stay out of version control>.
- **Nothing left running.** <what must be destroyed and confirmed from the provider's side>.

**Example — a `.gitignore` for <this stage's build>**

```
<ignore rules that keep secrets and state out while keeping the lock file in>
```

<One sentence encoding the rule of thumb, and the check the trainee runs.>

### <n>c. Finish the write-up

Fill the remaining sections of `write-up.md`:

- **<Section name from write-up-template.md>** — <what goes here, in a phrase>.
- **<Section name>** — <...>.
- **Definition-of-done self-assessment** — score yourself honestly against every DoD item (met / partly met / not met, and why), and rate yourself against each stage-rubric criterion in the README. Name anything you'd struggle to explain cold.
- **What I'd do differently.**

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm <the items you'll be asked about at review>.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| `<file>` | <its single job>. |
| `<file>` | <...>. |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `<command>` | <...>. |
| `<command>` | <...>. |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
