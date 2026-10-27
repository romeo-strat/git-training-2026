# M05 Write-Up — Terraform for Multi-Environment Deployments

> **Instructions for the Trainee:** 
> Copy this file to `write-up.md` in this folder and fill it in as you go, not at the end. Write it so a trainee starting this stage next cohort could follow your path. Delete all blockquotes (like this one) before submitting. **Never paste credentials, tokens, or key material.**

## 1. Deliverable & Evidence
> Link your code and provide the exact output proving it works based on the Definition of Done (DoD). Paste real output, trimmed to the relevant lines and redacted, or link a screenshot. 

**Repository:** modules/m05-terraform-for-multi-environment-deployments/build/
**Deliverable:** One configuration deployed as both dev and prod with separate state, and your note comparing three ways to separate environments.

*   **DoD-01 and DoD-02:** The listing showing two state objects under different keys, and a clean plan for each environment. 
    *   *Output/Evidence:*
```bash
aws s3api list-objects-v2 --bucket romeo-bucket-089714157758-ap-southeast-1-an --query 'Contents[?contains(Key, `m05`)].Key'
# ["m05/dev/terraform.tfstate", "m05/prod/terraform.tfstate"]

# dev: terraform plan -var-file=dev.tfvars (after init with dev.s3.tfbackend)
# No changes. Your infrastructure matches the configuration.

# prod: terraform plan -var-file=prod.tfvars (after init with prod.s3.tfbackend)
# No changes. Your infrastructure matches the configuration.
```
*   **DoD-04:** A plan, state listing or cloud-side output showing the naming convention and required tags on your resources.
    *   *Output/Evidence:* Resources named `<app>-<env>-<resource>` (e.g., `/m05app-dev/config`, `/m05app-prod/config`), provider `default_tags` include `Environment`, `ManagedBy`, `Project`, `Stage`.
*   **DoD-05:** Your note comparing a directory per environment, workspaces and per-environment files, and when each fits.
    *   *Output/Evidence:* See section 3.

## 2. How to build it (teach it to the next trainee)

1. Create one configuration with variables (`environment`, `app_name`, etc.) and use them in resource names/tags.
2. Add provider `default_tags` including `Environment`.
3. Create `dev.s3.tfbackend` and `prod.s3.tfbackend` pointing to same bucket with different keys (`m05/dev/terraform.tfstate`, `m05/prod/terraform.tfstate`), enable `use_lockfile = true`.
4. Create `dev.tfvars`, `prod.tfvars` with different values.
5. For each env: `terraform init -backend-config=<env>.s3.tfbackend -reconfigure`, `terraform apply -var-file=<env>.tfvars`.
6. Verify two state objects in bucket, clean plans for both.
7. Destroy both, keep bucket.

## 3. Decisions & Core Concepts
> This section covers the *why* behind your build and the theory you applied. 

**Key Decisions**
*   **Separate state:** Protects blast radius (changes to dev won't affect prod state); does not protect against same-account misconfig or shared resources.
*   **Tags:** Beyond `Environment`, need `Project`, `ManagedBy`, `Stage` (and often `Owner`, `CostCenter`) for cost allocation/cleanup.
*   **Isolation methods:** Chose per-environment backend config + tfvars files here; workspaces/dirs explained below.

**Concepts Applied**
- **One config, many envs:** Shared logic, different inputs/backend keys.
- **Per-env values/backend:** `tfvars` and `.tfbackend` files keep env-specific values separate.
- **Safe switching:** Always re-init with correct backend config and apply with correct tfvars; verify state key.

## 4. Comparison Note (DoD-05)

| Approach | When it fits | What you give up | Notes |
| :--------- | :------------ | :---------------- | :------ |
| **Directory per environment** (e.g., `envs/dev/`, `envs/prod/`) | Strong isolation, different backends/modules per env, larger teams | More duplication or need for modules; more directories to manage | Clear separation of code/state; easy to lock down permissions per env. |
| **Terraform Workspaces** (`terraform workspace select dev/prod`) | Quick env switching with same code, simple cases | Easy to misapply to wrong workspace; state separation exists but code paths less obvious; all envs share same backend config structure | Convenient but can be error-prone if not disciplined. |
| **Per-environment files (this approach)** (`dev.tfvars`/`prod.tfvars`, `dev.s3.tfbackend`/`prod.s3.tfbackend`) | One config, explicit env selection via flags, shared backend bucket with different keys | Must remember to init with correct backend and apply with correct tfvars; both envs in same account here | Explicit and reviewable; used in this stage. Both envs in same account is not real practice — real teams separate accounts. |

## 5. AI Collaboration Log
- **Tools & Scope:** Opencode, ~10% assistance.
- **Prompt Examples:** "How to structure multi-env with separate state keys in S3 backend?", "When to use workspaces vs directories?", "How to use backend config files?"
- **Course Correction:** Ensured backend keys differ per env and used `-reconfigure` on init when switching backends.
- **Human Intervention:** Designed structure, wrote configs, tested both environments, captured evidence, destroyed both, wrote write-up.

## 6. Retrospective & Self-Assessment
- **Friction Log:** Needed to re-init with `-reconfigure` when switching between backend configs.
- **What I'd do differently:** Be more careful about init/reconfigure when switching envs.
- **DoD Self-Assessment:** All DoD items met (two state objects, clean plans for both, naming/tags, comparison note, both destroyed bucket retained).
- **Blind Spots:** None critical.

**Status:** In review  
**Date:** 2026-10-27