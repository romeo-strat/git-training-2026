# M07 Write-Up — Designing Reusable Terraform Modules

My filled copy of `write-up-template.md`, written as I built the stage. It is meant to be followable by a trainee starting this stage next cohort. No credentials, tokens or key material appear here.

## 1. Deliverable & Evidence

**Repository:** `modules/m07-designing-reusable-terraform-modules/build/`
**Deliverable:** A reusable AWS network module with a documented interface, a root configuration that calls it twice with different inputs (`module "dev"` and `module "prod"`), the resulting plans and state addresses, and my review and decision notes.

The layout is:

```
build/
├── .gitignore
├── .terraform.lock.hcl
├── main.tf                 # module "dev" and module "prod"
├── providers.tf            # region + shared default_tags
├── versions.tf             # pins + backend "s3" {}
└── modules/
    └── network/
        ├── main.tf         # VPC, IGW, public route table, subnets, associations
        ├── variables.tf    # typed, described, validated inputs
        ├── outputs.tf      # described outputs
        └── versions.tf     # module's own version requirements
```

### DoD-01 — Clean plans for both calls, and distinct module paths

Formatting and validation pass for the module and the root configuration:

```
terraform fmt -check -recursive
(no output, exit 0)

terraform validate
Success! The configuration is valid.
```

The two calls were planned separately so each plan is its own evidence:

```
terraform plan -target=module.dev

  # module.dev.aws_vpc.main will be created
  # module.dev.aws_internet_gateway.igw will be created
  # module.dev.aws_route_table.public will be created
  # module.dev.aws_subnet.public[0] will be created
  # module.dev.aws_subnet.public[1] will be created
  # module.dev.aws_route_table_association.public[0] will be created
  # module.dev.aws_route_table_association.public[1] will be created

Plan: 7 to add, 0 to change, 0 to destroy.
```

```
terraform plan -target=module.prod

  # module.prod.aws_vpc.main will be created
  # module.prod.aws_internet_gateway.igw will be created
  # module.prod.aws_route_table.public will be created
  # module.prod.aws_subnet.public[0] will be created
  # module.prod.aws_subnet.public[1] will be created
  # module.prod.aws_route_table_association.public[0] will be created
  # module.prod.aws_route_table_association.public[1] will be created

Plan: 7 to add, 0 to change, 0 to destroy.
```

`terraform state list` shows the two calls as different module paths, not the same call pasted twice:

```
terraform state list

module.dev.aws_internet_gateway.igw
module.dev.aws_route_table.public
module.dev.aws_route_table_association.public[0]
module.dev.aws_route_table_association.public[1]
module.dev.aws_subnet.public[0]
module.dev.aws_subnet.public[1]
module.dev.aws_vpc.main
module.prod.aws_internet_gateway.igw
module.prod.aws_route_table.public
module.prod.aws_route_table_association.public[0]
module.prod.aws_route_table_association.public[1]
module.prod.aws_subnet.public[0]
module.prod.aws_subnet.public[1]
module.prod.aws_vpc.main
```

The inputs differ per call: `dev` uses `10.70.0.0/16` and `environment = "dev"`; `prod` uses `10.80.0.0/16` and `environment = "prod"`.

The root keeps its state in the M02 bucket under the key `m07/terraform.tfstate` (backend block in `versions.tf`, configured with the same bucket and lock settings as M05). Both calls live in that one state, which is why both module paths appear in the same `state list`.

### DoD-02 — Documented interface and standard layout

The module uses the four standard files, so a reviewer can find the resources, inputs, outputs and version requirements from the file names alone.

`variables.tf`:

```hcl
variable "app_name" {
  type        = string
  description = "Application name used as the first part of every resource name and tag."

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.app_name))
    error_message = "app_name must be lowercase letters, digits or hyphens, start with a letter, and be 2-21 characters."
  }
}

variable "environment" {
  type        = string
  description = "Environment this network belongs to (dev or prod). Used in names and the Environment tag."

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be either dev or prod."
  }
}

variable "vpc_cidr" {
  type        = string
  description = "IPv4 CIDR block for the VPC. Must be a /16 to /20 so there is room to carve /24 to /28 public subnets."

  validation {
    condition = try(
      can(cidrhost(var.vpc_cidr, 0)) &&
      tonumber(split("/", var.vpc_cidr)[1]) >= 16 &&
      tonumber(split("/", var.vpc_cidr)[1]) <= 20,
      false
    )
    error_message = "vpc_cidr must be a valid IPv4 CIDR with a prefix length between /16 and /20."
  }
}

variable "subnet_count" {
  type        = number
  description = "Number of public subnets to create, one per availability zone. Kept small for cost and simplicity."
  default     = 2

  validation {
    condition     = var.subnet_count >= 1 && var.subnet_count <= 3
    error_message = "subnet_count must be between 1 and 3."
  }
}
```

`outputs.tf`:

```hcl
output "vpc_id" {
  description = "ID of the VPC created by this module; use it to attach security groups, peering or other resources."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets, in the same order as the availability zones selected."
  value       = aws_subnet.public[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table, so a caller can add routes or associations without re-creating it."
  value       = aws_route_table.public.id
}
```

The validation is real, not decorative. Planning with `vpc_cidr = "10.70.0.0/33"` fails before any AWS call:

```
Error: Invalid value for input variable

  on modules/network/variables.tf line 21, in variable "vpc_cidr":
  21: variable "vpc_cidr" {

Invalid value for variable "vpc_cidr": vpc_cidr must be a valid IPv4 CIDR with a prefix length between /16 and /20.
```

### DoD-03 — One naming convention, and comments that explain why

| Kind | Convention | Examples |
| --- | --- | --- |
| Inputs | `snake_case`, noun or noun phrase | `app_name`, `environment`, `vpc_cidr`, `subnet_count` |
| Outputs | `snake_case`, identity or plural of what is returned | `vpc_id`, `public_subnet_ids`, `public_route_table_id` |
| Resource `Name` tags | `<app>-<env>-<resource>` from M05 | `m07app-dev-vpc`, `m07app-prod-public-1` |
| Terraform block labels | `snake_case`, descriptive | `aws_vpc.main`, `aws_subnet.public` |

I used `#` comments for the non-obvious *why*, and left the obvious to the code:

```hcl
locals {
  # The caller supplies app_name and environment separately; building the
  # prefix once keeps every Name tag on the M05 <app>-<env>-<resource> pattern.
  name_prefix = "${var.app_name}-${var.environment}"
}

resource "aws_subnet" "public" {
  count = var.subnet_count

  # /8 gives /24 subnets from a /16 VPC, which is enough for this lab and
  # avoids hand-writing a CIDR per subnet.
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
}
```

I did not comment lines like `# create the VPC`; the resource type already says that. I chose `#` over `//` and `/* */` because it is the most common Terraform style and reads cleanly in diffs. The interface is documented with `description` on every input and output, and the user-facing failure text lives in `error_message`.

### DoD-04 — Provider assumption, names and tags

The module deliberately has **no** `provider "aws"` block and **no** `backend` block. It declares only `required_providers` in `modules/network/versions.tf`. That means:

- **Region** comes from the root provider block: `region = "ap-southeast-1"`.
- **Account** comes from the caller's credential chain — the short-lived IAM Identity Center session — not from the module and not from code.
- **Environment name** comes from the `environment` input set by each call, not from the provider.
- **Shared tags** (`ManagedBy`, `Project`, `Stage`) come from the root provider's `default_tags`.
- **Per-call tags** (`Name`, `Environment`) are set by the module on each resource, because two calls share one provider and the `Environment` value must differ between them.

The plan shows the merged result on the dev VPC:

```
  # module.dev.aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + cidr_block = "10.70.0.0/16"
      + tags_all   = {
          + "Environment" = "dev"
          + "ManagedBy"   = "terraform"
          + "Name"        = "m07app-dev-vpc"
          + "Project"     = "terraform-basics-training"
          + "Stage"       = "M07"
        }
    }
```

and on the prod VPC:

```
  # module.prod.aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + cidr_block = "10.80.0.0/16"
      + tags_all   = {
          + "Environment" = "prod"
          + "ManagedBy"   = "terraform"
          + "Name"        = "m07app-prod-vpc"
          + "Project"     = "terraform-basics-training"
          + "Stage"       = "M07"
        }
    }
```

So the module does not "just work" by magic: it assumes the caller has configured the AWS provider and credentials, and it takes its region and account from that caller while taking its environment name from its own input.

### DoD-05 — Published-module review and decision note

**Review of a published module**

| Field | Note |
| --- | --- |
| Source | Terraform Registry: `terraform-aws-modules/vpc/aws` (source on GitHub: `terraform-aws-modules/terraform-aws-vpc`) |
| Pinned version | `6.0.0` — exact, not a range |
| Inputs | `name`, `cidr`, `azs`, `public_subnets`, `private_subnets`, `enable_nat_gateway`, `enable_dns_hostnames`, `tags` |
| Outputs | `vpc_id`, `vpc_cidr_block`, `public_subnets`, `private_subnets`, `public_route_table_ids`, `private_route_table_ids` |
| What I checked before trusting it | I read the README, `variables.tf`, `outputs.tf` and `main.tf`; confirmed the provider constraint is compatible with the pinned AWS provider `6.68.0`; confirmed `enable_nat_gateway` defaults to `false` (so it does not silently add a billable NAT gateway); checked that it creates only VPC/network resources and no IAM users, keys or credential material; checked the license, the release history and the examples; and read the resource list so I knew exactly what a plan would add. I also checked that the module source is the official `terraform-aws-modules` organisation and that I would pin the exact version in a `module` block, not track `latest`. |

I would still read the plan after adding it, because the module is third-party code and the plan is the only place that shows what it will actually create in my account.

**Decision note**

| Question | My answer |
| --- | --- |
| What I put in the module | The VPC, internet gateway, public route table and its default route, the public subnets, and the route-table associations. These are the pieces that only make sense together and have the same shape in every environment. |
| What I left out, and why | The provider block, backend configuration and credentials — those belong to the caller. The NAT gateway — out of scope and a cost the lab does not need. Private subnets — the lab only needs a public tier. Application resources — different lifecycle and not part of a network module. Tags beyond `Environment` — those are account/project defaults supplied by the root provider. |
| A case where I would **not** write a module | A one-off configuration used once, where the module boundary would add indirection without reuse. Also a module that only wraps a single resource with no added policy, validation or naming rule — for example a module whose entire body is one `aws_s3_bucket` and one input. And I would not write a module when the abstraction would force callers to pass through a long list of provider-specific inputs without making the caller's job simpler. |

### DoD-06 — Everything destroyed except the M02 bucket

```
terraform destroy -auto-approve

Destroy complete! Resources: 14 destroyed.
```

Confirmed from the cloud side, not just from Terraform's message:

```
aws ec2 describe-vpcs --region ap-southeast-1 --filters "Name=tag:Project,Values=terraform-basics-training" "Name=tag:Stage,Values=M07" --query 'Vpcs[].VpcId'
[]

aws ec2 describe-subnets --region ap-southeast-1 --filters "Name=tag:Project,Values=terraform-basics-training" "Name=tag:Stage,Values=M07" --query 'Subnets[].SubnetId'
[]

aws s3api head-bucket --bucket romeo-bucket-089714157758-ap-southeast-1-an
(no output, exit 0 — bucket retained)
```

Both module calls were destroyed; the state bucket and its lock configuration remain.

### DoD-07 — The guide works from a clean start

I followed the guide in section 2 from a clean checkout (no `.terraform/`, empty local state) through `init`, both plans, `apply`, `state list` and `destroy`. It produced the same two plans and the same 14 addresses shown above.

## 2. How to build it (teach it to the next trainee)

This is the order I would follow if I started again. The reasoning matters more than the commands: each step exists to make the next mistake cheap to catch.

**1. Decide the boundary before you move a line of code.** Open the M03 network configuration and mark what you are moving. I moved the VPC, internet gateway, public route table, public subnets and associations. I left the provider block, the backend and the environment values behind. The test I used: *does this resource only make sense with the rest of the network, and is it identical in shape in both environments?* If yes, it belongs in the module. If it describes the caller's account or a single environment's value, it stays in the root.

**2. Create the standard module folder and four files.** A newcomer should find the resources, inputs, outputs and version requirements from the file names alone:

```
modules/network/
  main.tf         # resources
  variables.tf    # inputs
  outputs.tf      # outputs
  versions.tf     # required_version + required_providers
```

In `versions.tf` I pinned `required_version = "1.16.5"` and `aws = "6.68.0"`, both read from `versions.env`. I did **not** add a provider block or a backend block. The module is a package, not a deployment: the caller owns the account, region, credentials and state.

**3. Write the interface before the resources.** I wrote `variables.tf` and `outputs.tf` first, because the interface is the contract the caller will see. I exposed four inputs: `app_name`, `environment`, `vpc_cidr`, `subnet_count`. I fixed everything else: DNS support, the default route to the internet gateway, the `/8` subnet carving, and the `Name`/`Environment` tags. Every input has a type and a description; `app_name`, `environment`, `vpc_cidr` and `subnet_count` have validations because each can take a bad value.

The cost of an extra input is real: every input is another thing the caller must understand, another compatibility promise, and another chance to pass a wrong value. I kept the list short on purpose. The outputs are equally deliberate: `vpc_id`, `public_subnet_ids` and `public_route_table_id` tell a caller how to reference the network from another module without reaching into the module's internals.

**4. Move the resources in and make the names follow M05.** I used a local prefix:

```hcl
locals {
  name_prefix = "${var.app_name}-${var.environment}"
}
```

Then every `Name` tag follows `<app>-<env>-<resource>`: `m07app-dev-vpc`, `m07app-dev-igw`, `m07app-dev-public-rt`, `m07app-dev-public-1`, and so on. Each resource also carries `Environment = var.environment`, because the two calls share one provider and the provider-level tag cannot differ between them. The root provider supplies `ManagedBy`, `Project` and `Stage`.

**5. Call the module twice from the root.** The root configuration is where the two environments become two instances of one module:

```hcl
module "dev" {
  source = "./modules/network"

  app_name     = "m07app"
  environment  = "dev"
  vpc_cidr     = "10.70.0.0/16"
  subnet_count = 2
}

module "prod" {
  source = "./modules/network"

  app_name     = "m07app"
  environment  = "prod"
  vpc_cidr     = "10.80.0.0/16"
  subnet_count = 2
}
```

I kept the two named calls instead of a `count` or `for_each` over a map because the named calls make the two module paths explicit (`module.dev`, `module.prod`) and give each environment a readable address in plans and state. What is shared between the calls is the module *definition*; what each call owns is its own set of resources, its own CIDR, its own names and its own `Environment` tag.

**6. Initialize, then plan each call separately.** After adding the module, run `terraform init` so the local module is registered. Then plan each call with `-target=module.dev` and `-target=module.prod` to capture each plan separately. I read the plans before applying: seven resources per call, the correct CIDR, and the expected tags. The first plan is also where a wrong input name or a missing variable shows up as an error instead of an AWS surprise.

**7. Apply and read the state addresses.** `terraform apply`, then `terraform state list`. The important observation is the prefix on every address: `module.dev.aws_vpc.main` and `module.prod.aws_vpc.main` are two different resources in one state because the module path is part of the address. That is the whole mechanism of reuse: one definition, two addresses.

**8. Review a published module before trusting it.** I read `terraform-aws-modules/vpc/aws` at an exact version and recorded its inputs, outputs and what I checked. The habit is the point: a registry module is still third-party code, so I read the source, the provider constraints and the resource list before I would add it to a plan.

**9. Destroy, and keep the bucket.** `terraform destroy` removes both calls. Then confirm from the cloud side with the AWS CLI that no M07-tagged VPC or subnet remains, and that the M02 bucket still answers `head-bucket`. Terraform's "Destroy complete!" is the claim; the cloud-side query is the proof.

**10. Before calling it done.** Run `terraform fmt -check -recursive` and `terraform validate` for the root and the module, check that `git status` shows no state file and that `.terraform.lock.hcl` is committed, and make sure the write-up contains the plans, state listing, interface, review and decision note.

## 3. Decisions & Core Concepts

### Key Decisions

**What belongs inside the module and what stays in the root, and how did you draw the line?**

I drew the line at *lifecycle and meaning*, not at file size. The module owns the network topology — VPC, internet gateway, public route table, public subnets and associations — because those resources only make sense together, change together, and have the same shape in dev and prod. The root owns the provider, the backend, the credentials and the per-environment values, because those describe *where* and *as whom* the module is deployed, not what the network is. I also left out the NAT gateway and private subnets: the lab does not need them, they cost money, and adding them would make the module do more than the caller asked. The boundary test I used was: if a value changes when the environment changes, it is an input; if it changes when the account or region changes, it belongs to the root; if it only makes sense with the rest of the network, it belongs in the module.

**Which inputs did you expose and which did you fix, what does each extra input cost, and what must the outputs tell a caller?**

I exposed `app_name`, `environment`, `vpc_cidr` and `subnet_count`. I fixed the DNS settings, the route to the internet gateway, the subnet carving (`cidrsubnet(..., 8, ...)`), the `Name` pattern and the `Environment` tag. Each extra input costs the next person three things: something else to read, something else to get wrong, and a compatibility promise the module author has to keep. That is why I did not expose the availability zone list or the subnet CIDRs — the module reads the zones with a data source and derives the subnet CIDRs, so the caller cannot pass an inconsistent pair. The outputs tell the caller the three things they cannot otherwise reference safely: the VPC ID, the public subnet IDs and the public route table ID. Without those, a caller would have to guess at resource addresses inside the module, which breaks the boundary.

**How do resource addresses change when something moves into a module, and what would that mean for a configuration that is already deployed?**

Before the move, an address is `aws_vpc.main`. After the move it is `module.dev.aws_vpc.main` (or `module.prod.aws_vpc.main`). The module path becomes part of the address, which is exactly why the two calls can coexist in one state. For a configuration that is already deployed, that change is dangerous: Terraform sees a new address and a missing old one, so a naive move produces a plan that destroys the old resource and creates a new one. For a VPC that means a new VPC ID, new subnets and new associations, and anything referencing the old IDs breaks. In this stage I built the module and the calls fresh, so there was nothing to migrate. If I were refactoring an existing deployment, I would use a `moved` block (or `terraform state mv` under supervision) so Terraform rewrites the address without touching the real resource. That is the M08 problem, and this stage is where the address change becomes visible.

### Concepts Applied

**File structure and naming conventions.** The four standard files are not decoration. A reviewer who has never seen the module can open `variables.tf` for the interface, `outputs.tf` for what it returns, `main.tf` for what it creates, and `versions.tf` for what it needs. I paired that with one naming convention across inputs, outputs, resources and tags: `snake_case` for Terraform names, and `<app>-<env>-<resource>` for the `Name` tag. In my build that is why `module "dev"` produces `m07app-dev-vpc` and `module "prod"` produces `m07app-prod-vpc` — the convention survives the module boundary.

**Calling a module more than once.** The module is defined once and instantiated twice. What is shared is the definition, the version requirements and the code path; what each call owns is its own resources, CIDR, names and `Environment` tag. The state listing is the proof: `module.dev.aws_vpc.main` and `module.prod.aws_vpc.main` are separate addresses, and each call has its own seven resources. I chose named calls over a `count` or `for_each` because the named paths are easier to read in a plan and in state, and because each environment has a different CIDR rather than a repeated identical block.

**Module sources and pinning.** The module I wrote is referenced by a local path (`source = "./modules/network"`), so there is no version number to pin — the version is whatever commit the root is on, and the lock file does not cover it. For a registry module I would pin an exact version (`version = "6.0.0"`); for a Git source I would pin a tag or, better, a commit SHA. Pinning protects against upstream drift: a new release cannot silently change what my plan does, and a moved tag cannot silently swap the code. With a local path, the equivalent protection is code review and the fact that the module and its caller move together in the same commit.

## 4. AI Collaboration Log

- **Tools & Scope:** I used an AI assistant (Opencode) for roughly 15% of the work: checking the standard module layout, confirming the `can(cidrhost(...))` validation idiom, and building a checklist for reviewing a published module. The Terraform files, the interface decisions, the two calls, the plans, the state evidence and the decision note are mine.
- **Prompt Examples:** "What belongs inside a reusable network module versus the root configuration?" — "How do I validate an IPv4 CIDR and a subnet count in Terraform 1.16?" — "What should I check in `terraform-aws-modules/vpc/aws` before pinning it?"
- **Course Correction:** The assistant's first suggestion put a `provider "aws"` block inside the module, with `default_tags` including `Environment = "dev"`. That would have hard-coded one environment into a module that is supposed to be called twice, and it would have made the module fight the caller's provider configuration. I removed the provider block and moved the environment into an input; the module now sets `Environment` per resource from that input. A second suggestion was to use one module call with `count = 2` and a list of environments. I rejected that because the brief and the definition of done want distinct module paths, and named `module "dev"` / `module "prod"` calls make the two instances readable in plans and state.
- **Human Intervention:** I wrote the module interface, the validations and the tagging rule; I chose which resources to move and which to leave out; I wrote both module calls and the root provider; I ran the plans, the state listing and the destroy; and I wrote the published-module review and the decision note. I accepted the four-file layout and the `can(cidrhost(...))` idiom after testing them, but I rewrote the provider assumption and the call structure myself.

## 5. Retrospective & Self-Assessment

### Friction Log (What tripped me up)

- **Planning before re-running `init` after adding the module.** The first plan after adding `module "dev"` failed with:

  ```
  Error: Module not installed

    on main.tf line 1, in module "dev":
     1: module "dev" {

  This module is not yet installed. Run "terraform init" to install all modules required by this configuration.
  ```

  Cause: the root had been initialized before the local module existed, so the module was not registered. Fix: `terraform init` again, which installed the local module and updated the lock file. The lesson is that adding a module is a dependency change, not just a file edit.

- **Using the wrong input name in the root.** I passed `env = "dev"` while the module declared `environment`:

  ```
  Error: Unsupported argument

    on main.tf line 6, in module "dev":
     6:   env = "dev"

  An argument named "env" is not expected here.
  ```

  Cause: the root and the module disagreed about the interface. Fix: rename the argument to `environment`. This is the module boundary doing its job — a caller cannot quietly invent an input.

- **Triggering the CIDR validation on purpose.** Planning with `10.70.0.0/33` produced the custom message shown under DoD-02. Cause: an invalid prefix length. Fix: use a valid `/16`. I kept the failure because it is the evidence that the validation is wired to the variable and not just written down.

- **The state-key decision took longer than expected.** Both calls live in one root, so they share one state key (`m07/terraform.tfstate`) and are separated by module path. That is the right shape for demonstrating module addresses, but it is not the same isolation as M05's per-environment keys: a mistake in this root can affect both environments at once. I spent time deciding whether to split the root per environment, and chose the single root because the stage's evidence is the distinct `module.dev` / `module.prod` paths in one `state list`.

### What I'd do differently

If I started again, I would write the module interface and its validations *before* moving any resources, and I would decide the state layout before the first `init`. Writing the interface first would have caught the `env`/`environment` mismatch before it became a plan error, and deciding the state layout first would have made the shared-key trade-off a deliberate design choice from the start rather than a discovery halfway through.

### DoD Self-Assessment

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Met | `fmt`/`validate` pass for module and root; both calls plan cleanly (7 resources each); `state list` shows distinct `module.dev` and `module.prod` paths. |
| DoD-02 | Met | Four standard files; every input has a type and description; validations on `app_name`, `environment`, `vpc_cidr`, `subnet_count`; every output has a description. |
| DoD-03 | Met | `snake_case` for inputs/outputs; `<app>-<env>-<resource>` for `Name` tags; `#` comments explain why, and `description`/`error_message` document the interface. |
| DoD-04 | Met | Module has no provider/backend block; root supplies region, credentials and shared tags; environment comes from the input; plan shows the merged tags for dev and prod. |
| DoD-05 | Met | Published module review with source, exact pin, inputs, outputs and what I checked; decision note covers what is in, what is out and when I would not write a module. |
| DoD-06 | Met | Destroy removed 14 resources; cloud-side checks show no M07 VPCs or subnets; the M02 bucket remains. |
| DoD-07 | Met | I followed the section 2 guide from a clean checkout and reproduced the plans and state addresses. |

**Rubric self-rating:** Deliverable and definition of done — Excellent; configuration quality, security and cost — Satisfactory; design decisions — Excellent; how to build it — Satisfactory; concepts, obstacles and AI log — Satisfactory; understanding — Satisfactory.

### Blind Spots

I would need to re-read the details of provider aliases and `configuration_aliases` before I could explain cold how a module targets a second region or account. I also want to be more precise about the difference between a `moved` block and `terraform state mv` when refactoring an already-deployed module, and about when a Git source should be pinned to a tag versus a commit SHA. None of these blocks this stage, but they are the next things I would study before M08.

**Status:** In review
**Date:** 2026-11-10
