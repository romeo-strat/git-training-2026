# <MODULE_ID> — <MODULE_TITLE>

*A self-guided tour: <SHORT_DESCRIPTION>.*

---

<INTRODUCTION>

It does **not** do the thinking for you. Your brief asks you to work out several things yourself (they're called *research prompts*), and your write-up is where your answers go. Every time you see a **Your turn** box, that's one of those prompts. Do the investigating there; don't expect the answer from this page.

## How to use this tour

Work through the parts in order. Each part has the same simple shape:

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

## Where you're headed

By the end of this tour you'll have:

- <OUTCOME_1>
- <OUTCOME_2>
- <OUTCOME_3>
- <OUTCOME_4>
- evidence for every item in your brief's definition of done.

> **Before you start.** Your brief has a **"Still open / ask your trainer"** list. Read it now and clear anything unclear with your trainer *before* you build — especially <SPECIFIC_PRECHECK>.

---

## Part 1 — <PART_1_TITLE>

**Goal:** <PART_1_GOAL>

*First-run estimate: about <TIME> minutes.*

**Try it**

1. <STEP_1>
2. <STEP_2>
3. <STEP_3>

```
<COMMANDS>
```

**Checkpoint**

- <CHECK_1>
- <CHECK_2>

**Example — <EXAMPLE_TITLE>**

```
<EXAMPLE_CONTENT>
```

**Pause and predict.** <PREDICTION_PROMPT>

**Your turn**

- **<RESEARCH_PROMPT_1>**
- **<RESEARCH_PROMPT_2>**

> **Watch out.** <WARNING>

> **Explain it.** <EXPLAIN_PROMPT>

---

## Part 2 — <PART_2_TITLE>

...
---

## Part 6 — Wrap up

**Goal:** land the landing. Prove it's all done, clean up, then write it up.

*First-run estimate: about 20 minutes (evidence, clean-up and write-up).*

### 6a. Self-check against your definition of done

Open your brief's **Definition of done** and walk it line by line. For each item, make sure your write-up's "Checkpoint evidence" section shows **real pasted output** (trimmed to the relevant lines, and redacted).

### 6b. The clean-up gate

Before you call the stage done, confirm:

- **No stored credential.** Nothing long-lived anywhere.
- **State stays local and out of version control.** No state file committed.
- **Nothing left running.** Every resource is destroyed, confirmed from the cloud side.

**Example — a `.gitignore` for a local-state stage**

```
.terraform/
*.tfstate
*.tfstate.*
crash.log
```

### 6c. Finish the write-up

Fill the remaining sections of `write-up.md`:

| Section | What goes in it |
| --- | --- |
| **What I built** | <DESCRIPTION> |
| **Why it's built this way (key decisions)** | <DESCRIPTION> |
| **AI collaboration log** | Specific, or one line saying you used none. |
| **How to build it (teach it to the next engineer)** | A guide someone could follow from a clean start. Follow it yourself end to end before you call it done. |
| **Concepts worth explaining** | Two or three ideas from this stage, in your own words, each with an example from *your* build. |
| **What tripped me up** | The real obstacles, with the exact error text. |
| **Checkpoint evidence** | Pasted output, trimmed and redacted, or a screenshot. |
| **Definition-of-done self-assessment** | Met / partly met / not met for every DoD item and why, your rating against each stage-rubric criterion in the README, and anything you'd struggle to explain cold. |
| **What I'd do differently.** | If you started this stage over, what would you do differently? |

Then set **Status** in `write-up.md` to **"In review"** and tell your trainer the stage is ready.

> **Last thing.** Before you move on, check the "Still open / ask your trainer" list one more time, and confirm the item you'll be asked about at review: <REVIEW_CHECK>.

---

## Quick reference

| Stage file | Purpose |
| --- | --- |
| <FILE_1> | <PURPOSE_1> |
| <FILE_2> | <PURPOSE_2> |
| `write-up.md` | Your evidence and your teaching guide. Fill it in as you build. |

| Command | What it does |
| --- | --- |
| `terraform fmt` | Tidies formatting. |
| `terraform validate` | Checks the configuration for errors. |
| `terraform plan` | Shows what would change — **read it every time.** |
| `terraform apply` | Makes the changes. |
| `terraform destroy` | Removes what you created. **Confirm cloud-side afterwards.** |

Remember: this tour showed you the moves. The **answers** to the research prompts are yours — that's the work, and it's exactly what your write-up is for.
