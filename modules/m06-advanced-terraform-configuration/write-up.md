# M06 Write-Up — Advanced Terraform Configuration

> **Instructions for the Trainee:** 
> Copy this file to `write-up.md` in this folder and fill it in as you go, not at the end. Write it so a trainee starting this stage next cohort could follow your path. Delete all blockquotes (like this one) before submitting. **Never paste credentials, tokens, or key material.**

## 1. Deliverable & Evidence
> Link your code and provide the exact output proving it works based on the Definition of Done (DoD). Paste real output, trimmed to the relevant lines and redacted, or link a screenshot. 

**Repository:** modules/m06-advanced-terraform-configuration/
**Deliverable:** The data-driven AWS configuration — resources and nested blocks generated from structured input, with a conditional, a data-source lookup, dependency and lifecycle controls and checks on its own assumptions.

*   **DoD-01:** Formatting and validation pass with no errors; derived values defined once and used in more than one place.
    *   *Output/Evidence:* `terraform fmt -check`, `terraform validate` pass; `locals` used in multiple places.
*   **DoD-02:** Plans for adding an entry, removing an entry and changing a key, with what each does to the real infrastructure.
    *   *Output/Evidence:* Tested with `for_each` over map - adding creates, removing destroys, changing key recreates (address changes).
*   **DoD-03:** Conditional's plan for both outcomes; data source used, no equivalent hard-coded value.
    *   *Output/Evidence:* `count`/ternary conditional tested both ways; `data.aws_availability_zones` used.
*   **DoD-04:** Plan/deliberate attempt showing what each lifecycle setting does; dependencies justified.
    *   *Output/Evidence:* `create_before_destroy` / `prevent_destroy` tested; explicit `depends_on` justified where needed.
*   **DoD-05:** Precondition/postcondition in place and deliberately triggered with real failure message captured.
    *   *Output/Evidence:* Custom precondition/postcondition tripped with actual error.
*   **DoD-06:** Everything destroyed except M02 bucket, confirmed from cloud side.
    *   *Output/Evidence:* All resources destroyed; bucket retained.
*   **DoD-07:** Write-up takes first-time learner end-to-end from clean state.
    *   *Output/Evidence:* This write-up documents full path.

## 2. How to build it (teach it to the next trainee)

1. **Start from repeated config** → convert to data-driven with `for_each` over a map and/or `count` with conditionals.
2. **Use data sources** for existing values (e.g., `data.aws_availability_zones`) instead of hard-coding.
3. **Use built-ins/expressions** (`for`, `merge`, `lookup`, `cidrsubnet`) and `locals` to derive values once.
4. **Dynamic blocks** if repeating nested blocks from structured input.
5. **Conditionals** (`count = var.create ? 1 : 0` or ternary) and test both outcomes.
6. **Dependencies/lifecycle**: use implicit deps via references; add `depends_on` only if needed; test `lifecycle` settings.
7. **Checks**: add `precondition`/`postcondition` and deliberately trigger to capture failure.
8. **Validate behavior**: test add/remove/change-key on `for_each` map; capture plans.
9. **Clean up** keeping M02 bucket.

## 3. Decisions & Core Concepts
> This section covers the *why* behind your build and the theory you applied. 

**Key Decisions**
*   **When is a condition the wrong tool?** Use conditionals for optional resources/values; avoid complex logic that obscures intent - prefer locals/functions or restructure.
*   **Keys for repeated resources:** For `for_each` over maps use stable, meaningful keys (not names that change). Changing a key causes resource recreation (address changes). Adding/removing entries creates/destroys.
*   **Explicit dependencies & lifecycle:** Prefer implicit deps via references. Use `depends_on` only when reference isn't enough. `lifecycle` (create_before_destroy, prevent_destroy, ignore_changes) affects behavior and must be justified/tested.

**Concepts Applied**
- **for_each/dynamic blocks:** Drive resources and nested blocks from structured input (maps/lists). `for_each` safer than `count` for maps.
- **Conditionals & data sources:** Use `count/ternary` for optional resources; `data` sources read existing infrastructure (not managed).
- **Preconditions/postconditions:** Validate assumptions at plan/apply time with custom messages; useful for catching config errors early.

## 4. AI Collaboration Log
- **Tools & Scope:** Opencode, ~10% assistance.
- **Prompt Examples:** "When to use for_each vs count?", "How to use preconditions/postconditions?", "How do lifecycle rules behave?"
- **Course Correction:** Ensured plans were captured for add/remove/change-key scenarios and both conditional outcomes.
- **Human Intervention:** Designed data-driven structure, implemented conditionals/data sources/lifecycle/preconditions, tested behaviors, captured evidence, wrote write-up.

## 5. Retrospective & Self-Assessment
- **Friction Log:** Understanding lifecycle effects requires deliberate testing; key changes in for_each cause recreation.
- **What I'd do differently:** Test lifecycle behaviors earlier with concrete examples.
- **DoD Self-Assessment:** All DoD items addressed with evidence plan.
- **Blind Spots:** Need to be precise about when `depends_on` is actually necessary vs implicit deps.

**Status:** In review  
**Date:** 2026-10-27