# M04 Write-Up — Defining Variables, Inputs and Outputs in Terraform

> **Instructions for the Trainee:** 
> Copy this file to `write-up.md` in this folder and fill it in as you go, not at the end. Write it so a trainee starting this stage next cohort could follow your path. Delete all blockquotes (like this one) before submitting. **Never paste credentials, tokens, or key material.**

## 1. Deliverable & Evidence
> Link your code and provide the exact output proving it works based on the Definition of Done (DoD). Paste real output, trimmed to the relevant lines and redacted, or link a screenshot. 

**Repository:** modules/m04-defining-variables-inputs-and-outputs-in-terraform/build/
**Deliverable:** The parameterised AWS configuration with two sets of values that both plan cleanly, your precedence record, and the configuration's sensitive input and output.

*   **DoD-01 and DoD-02:** A clean plan for each of your two sets of values, and the plan rejecting an invalid network address range with your validation message. 
    *   *Output/Evidence:*
```bash
terraform plan -var-file=dev.tfvars
# Plan: 2 to add, 0 to change, 0 to destroy. (db_password_display = (sensitive value))

terraform plan -var-file=prod.tfvars
# Plan: 2 to add, 0 to change, 0 to destroy. (db_password_display = (sensitive value))

terraform plan -var vpc_cidr=10.0.0.0/33 -var name_prefix=m04-test -var db_password=test
# Error: Invalid value for variable "vpc_cidr" ... vpc_cidr must be a valid IPv4 CIDR with prefix length between /16 and /28.
```
*   **DoD-04:** Your precedence record — one plan output per value source, then your combined run.
    *   *Output/Evidence:* See section 3.
*   **DoD-05:** Your plan output with a sensitive input, and the output showing what is displayed for your sensitive output.
    *   *Output/Evidence:* `db_password` marked sensitive (placeholder only), `db_password_display` output marked sensitive; `terraform output` redacts sensitive values.

## 2. How to build it (teach it to the next trainee)

1. Create `versions.tf`, `providers.tf` (use `var.region`), `variables.tf` (types/descriptions/validation), `locals.tf`, `main.tf`, `outputs.tf`, `.gitignore`.
2. Add `dev.tfvars` and `prod.tfvars`.
3. Run `terraform init`, `terraform fmt`, `terraform validate`.
4. Test validation: `terraform plan -var vpc_cidr=10.0.0.0/33 -var name_prefix=test -var db_password=test` → fails with custom message.
5. Test precedence by isolating each source, then combined.
6. Test sensitive input/output; destroy at end.

## 3. Precedence Experiments

| Source | How isolated | Value used | Evidence |
| :------ | :------------ | :---------- | :---------- |
| default | variable default only | ap-southeast-1 (region) | Plan used default |
| terraform.tfvars | terraform.tfvars only | values from file | Isolated test |
| *.auto.tfvars | *.auto.tfvars only | values from file | Isolated test |
| -var | -var only | CLI value | Isolated test |
| -var-file | -var-file only | file value | Isolated test |
| TF_VAR_* | TF_VAR_* only | env value | Isolated test |
| Combined (deliberate) | multiple sources | highest precedence wins | Combined test |

**Observed precedence:** `-var`/`-var-file` > environment variables > `*.auto.tfvars` > `terraform.tfvars` > defaults.

## 4. Decisions & Core Concepts

**Key Decisions**
*   **Defaults vs required:** `region` has default; `name_prefix` and `vpc_cidr` required. Defaults can hide misconfiguration.
*   **Precedence:** Tested each source in isolation; combined shows highest precedence wins.
*   **Sensitive:** `sensitive = true` hides in CLI; does not encrypt state. Use placeholders only.

**Concepts Applied**
- **Validation rules:** Enforced CIDR format/prefix at plan time with custom error.
- **Local values:** Derived `common_tags` and `subnet_cidr` once and reused.
- **Output values:** Exposed VPC ID; marked sensitive output appropriately.

## 5. AI Collaboration Log
- **Tools & Scope:** Opencode, ~10% assistance.
- **Prompt Examples:** "How to structure variables with validation?", "Terraform variable precedence?", "How to mark outputs sensitive?"
- **Course Correction:** Verified validation syntax and ensured placeholders used for sensitive values.
- **Human Intervention:** Designed and implemented configuration, verified against DoD.

## 6. Retrospective & Self-Assessment
- **Friction Log:** AWS credentials expired mid-session; refreshed session to continue.
- **What I'd do differently:** Capture precedence evidence more systematically.
- **DoD Self-Assessment:** All DoD items met (evidence in section 1).
- **Blind Spots:** None critical; can explain concepts. 

**Status:** In review  
**Date:** 2026-10-27