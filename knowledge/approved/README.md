# knowledge/approved — Verified learning content

Content here has passed the promotion gate below. It is expected to be reproducible and its technical claims verifiable. This is the "final" destination for curated learning material.

**Nothing is here yet.** As of 2026-10-14 the only curated content is in [`../proposed/`](../proposed/), marked draft because no learner build or sandbox evidence exists for M01 yet.

## Promotion gate

A file moves from `../proposed/` to here only when all of these are true. This mirrors the Knowledge Curator's source-of-truth rules (`.opencode/agents/knowledge-curator.md`) and the stage review rubric (`README.md:93-116`).

- [ ] The underlying implementation has **passed the required review** (stage accepted, or a Technical-Reviewer report exists).
- [ ] **Technical claims match a real implementation** and its evidence — not expected behaviour presented as observed.
- [ ] Every command and example is **supported by evidence**, or explicitly labelled unverified.
- [ ] Runtime claims (deploy, cost, teardown) are backed by pasted output or a linked artifact, not a claim.
- [ ] **Security guidance is sound** and contains no secrets, keys or private infrastructure details.
- [ ] **A future learner can reproduce** the important steps from a clean start.
- [ ] The content is **sufficiently generic** for reuse (generalises beyond one learner's run).
- [ ] **Source is recorded**: the stage ID and the artifact references it was curated from.
- [ ] It **does not duplicate** existing approved content (improve the existing asset instead).
- [ ] The **promotion is recorded** below with date and reviewer.

## How to promote

1. Confirm every gate item above with evidence.
2. Move the file from `../proposed/` to `approved/`.
3. Update `../proposed/README.md` (remove the row) and this file's promotion log.
4. Record: file, source stage, review evidence (report or PR), promoter, date.

## Promotion log

| Date | File | Source stage | Review evidence | Promoted by |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Known blockers for M01

The M01 drafts in `../proposed/` cannot be promoted until:

- A real learner build exists and passes Technical Review.
- Runtime claims (AWS connectivity, `init`/`plan`/`apply`/`destroy`, cost, cloud-side absence) are re-verified against that build.
- The trainer confirms the open decisions in `modules/m01-getting-started-with-terraform/brief.md:74-79`.
