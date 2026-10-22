# 2026-10-22 — M01's write-up shipped with ten TODOs; the only way to close them was to run the stage

`modules/m01-getting-started-with-terraform/write-up.md` was structurally compliant with the revised template but empty of proof: six explicit `TODO` markers, six evidence slots reading "pending paste", and a DoD table where everything was "Partly met" and DoD-07 was "Not met yet". The document was asking for output that did not exist anywhere — so the work was not copy-editing, it was a re-run of the stage on the machine that would be reviewed.

## What the environment actually looked like

| The write-up claimed | Reality on this machine |
| --- | --- |
| Terraform installed through a version manager, switched between two versions | `tfenv` was installed by Homebrew as a *keg-only* formula — on disk, not on `PATH`, never used. `terraform` was the Homebrew binary at 1.16.6, while `versions.env` pins 1.16.5 |
| Sign-in through IAM Identity Center, no access keys on disk | No SSO profile, no SSO cache, and a `default` profile in `~/.aws/credentials` holding a static IAM-user key pair that had been expired since 27 August |
| Evidence pasted from the build | No build folder, no state file and no lock file existed anywhere on the machine — the outputs could only be regenerated, not recovered |

## Findings

| # | Finding | Consequence / action |
| --- | --- | --- |
| 1 | Evidence that was never captured cannot be repaired by editing, and evidence captured on another machine cannot be reconstructed here. The build was re-materialised at `~/tf-m01-build` from `docs/reference-builds/m01/` (byte-identical, so the cited build location and the tested code are the same files). | A write-up's evidence slot is only closable by running the command on the machine that will be reviewed. "Pending paste" in a shipped write-up means the work was not finished. |
| 2 | Three workstation facts in the write-up were false until the machine was fixed: `tfenv` invisible, Terraform off-pin, stale static keys on disk. DoD-01 grades the version manager as part of the deliverable, so workstation setup *is* evidence, not a prerequisite. | Every stage's workstation step now has a captured command and output, and the three real failures became the "What tripped me up" section — with exact error text, cause and fix, which is what the rubric asks for. |
| 3 | `brew unlink terraform` is the fix for a Homebrew binary shadowing the tfenv shim: the formula stays installed, but the shim becomes the only `terraform` on `PATH`. `~/.zshenv` (not `~/.zshrc`) is where the `PATH` export belongs, so scripted shells resolve it too. | Both are now steps in the write-up's own guide. A learner following the old guide on a machine with Homebrew Terraform would silently get the wrong version and never notice. |
| 4 | A static-key scan produces false positives that must be *read*: the only hits in the course repository were the lines of the write-up that name the patterns `AKIA`/`ASIA`/`aws_secret_access_key`. | The scan evidence states the false positive explicitly instead of claiming a clean sweep. "Empty is a result" only holds if the empty output was read. |
| 5 | The constraint `~> 6.0` in `versions.tf` resolved to `hashicorp/aws v6.69.1` — *newer* than the `6.68.0` pin in `versions.env`. A compatible-range constraint resolves to the newest satisfying build, not to the pin. | The lock file is the only thing that reproduces a build, which is exactly what the write-up's second key decision argues. But it also means `versions.env` is a policy the reference build does not enforce. **Open for the trainer:** should the reference build pin `= 6.68.0`, or should `versions.env` be understood as "the version the lock file records"? |
| 6 | The caller-identity query, the plan, the in-place update and the cloud-side destroy proof all sit behind one AWS session. With no sandbox account, a write-up can be complete only up to `terraform validate`. | DoD-01, DoD-05, DoD-06 and the apply/destroy legs of DoD-07 stay "Partly met" with the exact commands attached, instead of a promise dressed as evidence. One login unblocks all four. |
| 7 | A `terraform plan` with no credentials fails twice, and the second message is the credential chain's last stop failing: the provider probes the EC2 instance metadata service, and a laptop is not an EC2 instance, so `169.254.169.254` times out. | Both errors are now in "What tripped me up" — they are better teaching material than a clean run would have been. |
| 8 | The pricing in the rubric ("your estimate is in the write-up") was satisfied by a price-list statement, not a billing console: Standard Parameter Store parameters are free; only Advanced parameters ($0.05 per month) and higher throughput are billed. | The write-up names the source of the estimate, so a reviewer can tell a looked-up number from an asserted one. |

## Rule for the next stage

Capture evidence as each step happens, on the machine that will be reviewed, and treat workstation setup as part of the deliverable. A write-up slot may say "not captured" and name the command and the exact error; it may never say "pending" and leave the reader to imagine the output.

## Machine state changed by this pass

- `tfenv` 3.2.2 at `/opt/homebrew/opt/tfenv/bin`, versions 1.16.5 and 1.16.6 installed, global default 1.16.5 (the pin).
- `~/.zshenv` created with the `tfenv` `PATH` export.
- `brew unlink terraform` — the Homebrew formula (1.16.6) stays installed but is off `PATH`.
- `~/.aws/credentials` deleted; it held one expired static-key profile and nothing else. No SSO profile exists on this machine.
- Build working copy at `~/tf-m01-build` (git repository, two commits: the three `.tf` files plus `.gitignore`, then the committed `.terraform.lock.hcl`).

## Still open

- DoD-01 (caller identity), DoD-05, DoD-06 and the apply/destroy legs of DoD-07 need one IAM Identity Center session against the sandbox account.
- `versions.env` pins `6.68.0`; the reference build's `~> 6.0` constraint installs `6.69.1`. Decide which of the two is authoritative for the stages.
- The Windows half of DoD-07 is still unverified — it stays in the brief's "Still open" list.
- The house-style question from the previous retro (is the revised write-up template the shape for M02–M09 and the capstone?) is unchanged; M02 work was in flight in parallel with this pass.
