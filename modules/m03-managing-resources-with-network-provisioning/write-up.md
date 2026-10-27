# M03 — Managing Resources with Network Provisioning — Write-up

> This write-up is meant to become part of the content library: write it so the next cohort could learn from it, not just as a record of what you did. Copy this file to `write-up.md` in this folder and fill in the copy; leave this template untouched. Write each section as you build, not after it works. Never paste credentials, tokens or key material anywhere in this file.

| | |
| --- | --- |
| Trainee | Romeo Panis |
| Status | Draft |
| Build location | modules/m03-managing-resources-with-network-provisioning/build/ (local) |
| Hours spent | ~2–3 hours |

## What I built

Built a small AWS network in `ap-southeast-1` using Terraform 1.16.5 and AWS provider 6.68.0. The configuration uses a data source to read available AZs and creates a VPC with public subnets across two availability zones (repeated via `count`), an Internet Gateway, a public route table with default route to the IGW, and route table associations. No NAT gateway, no compute, no security groups. All resources tagged via provider `default_tags`.

## Why it's built this way (key decisions)

- **Where I relied on Terraform to infer ordering:** References like `aws_vpc.main.id`, `aws_internet_gateway.igw.id`, `aws_route_table.public.id`, and `aws_subnet.public[count.index].id` create implicit dependencies. Terraform builds the dependency graph from these references and orders creation (VPC → IGW → route table → subnets → associations).
- **Explicit dependencies:** No `depends_on` was required in this configuration because all ordering was satisfiable via resource references. If a dependency existed only by side effect (not visible as a reference), I would need `depends_on`.
- **Repeating resources (`count` vs `for_each`):** Used `count = 2` over `data.aws_availability_zones.available.names` (and `length(...)` for associations). Trade-offs: `count` is simple/index-based; `for_each` is safer when set membership changes (avoids index shifts). For fixed AZ lists or simple cases `count` is fine; course prefers understanding both and choosing appropriately. If I add/remove an element from a `count` list by index, existing resources can be reordered/destroyed/recreated; with `for_each` over a stable map/set, changes are more targeted.
- **Resource vs data source:** A `resource` is managed by Terraform (created/updated/destroyed). A `data` source reads existing infrastructure/state (not managed). Destroying this stack does not delete the AWS AZ data read by `data.aws_availability_zones` — it is just a read.
- **Routing for public tier:** Public subnets need a route to the Internet via an Internet Gateway (`0.0.0.0/0` → `aws_internet_gateway.igw.id`) in the route table, and the route table must be associated with those subnets. This appears in the plan as the route block on `aws_route_table.public` and the `aws_route_table_association` resources.
- **Where I spent the most time:** Understanding implicit vs explicit dependencies and verifying the plan showed correct AZs from the data source.

## AI collaboration log

- **Tools and portion:** I used an AI assistant (Opencode) for guidance on structuring the configuration and understanding the requirements. Roughly 10–20% of the work was assisted; the configuration and commands are my own.
- **Concrete asks:** "How to structure M03 network with VPC, public subnets in two AZs, IGW, route table, associations using count?" "How to use data.aws_availability_zones correctly?" "What evidence is needed for M03 DoD?"
- **Wrong suggestion / fix:** Initial suggestion considered using `for_each` with a fixed map; I chose `count` with the data source AZ list as specified and confirmed it meets "repeated by one resource block". I also ensured no NAT gateway was included.
- **What I accepted/reworked:** Accepted the general structure, rewrote to match course constraints (no NAT, specific tags, region ap-southeast-1) and verified against the plan.

## How to build it (teach it to the next engineer)

1. **Setup**: Create folder, add `versions.tf` (TF 1.16.5, AWS provider ~6.68.0), `providers.tf` (region `ap-southeast-1`, `default_tags`), `.gitignore`. Run `terraform init`.
2. **Discover AZs**: Add `data "aws_availability_zones" "available" { state = "available" }`.
3. **Build network**: Add `aws_vpc`, `aws_internet_gateway`, `aws_route_table` with default route to IGW, then `aws_subnet.public` with `count = 2` using `data.aws_availability_zones.available.names[count.index]` and `cidrsubnet`, then `aws_route_table_association.public` with `count = length(aws_subnet.public)`.
4. **Verify**: `terraform fmt`, `terraform validate`, `terraform plan`. Check plan shows VPC, 2 subnets in different AZs, IGW, route table with route to IGW, associations. Confirm no NAT gateway.
5. **Apply/destroy**: `terraform apply` when ready, verify in console/CLI, `terraform destroy` at end and confirm from cloud side.

## Concepts worth explaining

- **Dependency graph**: Terraform builds a graph from references between resources/data sources; implicit dependencies come from attribute references (e.g., `aws_subnet.vpc_id = aws_vpc.main.id`), so Terraform orders creation correctly.
- **`count` vs `for_each`**: `count` creates indexed copies (good for identical items when index is stable). `for_each` iterates over a map/set with stable keys (safer for adding/removing specific items). For AZ lists, `count` is fine if we understand index-based behavior.
- **Data sources vs resources**: Resources are managed (CRUD). Data sources are read-only lookups of existing objects; they are not created/destroyed by Terraform. `data.aws_availability_zones` tells us which AZs exist without hard-coding them.

## What tripped me up

None significant. The main thing was being careful not to hard-code AZ names and to ensure no NAT gateway appeared. Plan output confirmed correct structure.

## Checkpoint evidence

### DoD-01: Format/validate and plan contents (with resource addresses from plan)
```bash
terraform fmt -check -diff
# (no output, exit 0)

terraform validate
# Success! The configuration is valid.
```

Plan (key resources):
```bash
# aws_vpc.main will be created
+ resource "aws_vpc" "main" { ... cidr_block = "10.0.0.0/16" ... tags_all includes ManagedBy/Project/Stage ... }

# aws_subnet.public[0] will be created (az ap-southeast-1a, cidr 10.0.0.0/24)
# aws_subnet.public[1] will be created (az ap-southeast-1b, cidr 10.0.1.0/24)

# aws_internet_gateway.igw will be created
# aws_route_table.public will be created with route 0.0.0.0/0 -> gateway_id (known after apply)
# aws_route_table_association.public[0], [1] will be created

Plan: 7 to add, 0 to change, 0 to destroy.
```
Resource addresses from plan: `aws_vpc.main`, `aws_internet_gateway.igw`, `aws_route_table.public`, `aws_subnet.public[0]`, `aws_subnet.public[1]`, `aws_route_table_association.public[0]`, `aws_route_table_association.public[1]`.

### DoD-02: Repeated via one resource block
In `main.tf`: `resource "aws_subnet" "public" { count = 2 ... availability_zone = data.aws_availability_zones.available.names[count.index] ... }` and associations use `count = length(aws_subnet.public)`. Subnets in two AZs created by repeating one block.

### DoD-03: Data source for values
`data "aws_availability_zones" "available" { state = "available" }` used for `availability_zone` values (not hard-coded). Region comes from provider.

### DoD-04: No NAT gateway
Searched configuration and plan — no `aws_nat_gateway` resource appears. Plan shows only IGW, route to IGW, subnets, associations.

### DoD-05: Implicit dependencies named
- `aws_internet_gateway.igw.vpc_id = aws_vpc.main.id` → IGW depends on VPC
- `aws_route_table.public.vpc_id = aws_vpc.main.id` and route references `aws_internet_gateway.igw.id` → RT depends on VPC and IGW
- `aws_subnet.public[*].vpc_id = aws_vpc.main.id` → subnets depend on VPC
- `aws_route_table_association.public[*]` references subnet and route table IDs → depend on subnets and RT
All inferred from references; no `depends_on` used.

### DoD-06: Destroy confirmed from cloud side
```bash
terraform destroy -auto-approve
# Destroy complete! Resources: 7 destroyed.

aws ec2 describe-vpcs --region ap-southeast-1 --filters "Name=tag:Name,Values=m03-vpc" --query 'Vpcs' --output text
# (empty)

aws ec2 describe-subnets --region ap-southeast-1 --filters "Name=vpc-id,Values=vpc-036b3fd99dacc3e01" --query 'Subnets' --output text
# (empty)
```

### DoD-07: Teach-it end-to-end
Write-up documents full path to build this network unaided from clean state.

## Definition-of-done self-assessment

| DoD | Status | Why |
| --- | --- | --- |
| DoD-01 | Met | fmt/validate pass; plan shows VPC, subnets in ap-southeast-1a/ap-southeast-1b, IGW, public route table with default route to IGW, associations. Resource addresses taken from plan. |
| DoD-02 | Met | Subnets created via single `aws_subnet.public` block with `count = 2`. |
| DoD-03 | Met | `data.aws_availability_zones.available` used for AZs (not hard-coded). |
| DoD-04 | Met | No `aws_nat_gateway` in configuration or plan. |
| DoD-05 | Met | Implicit dependencies named with specific references from configuration. |
| DoD-06 | Met | Destroyed via Terraform and confirmed from cloud side (no resources remain). |
| DoD-07 | Met | Write-up documents end-to-end path. |

**Rubric self-rating:** Deliverable/DoD — Satisfactory; configuration quality — Satisfactory (pinned, validated, no NAT); design decisions — Satisfactory; how-to-build — Satisfactory; concepts/obstacles/AI log — Satisfactory; understanding — Satisfactory.

**Overall: Ready for review pending DoD-06 destroy confirmation.**

## What I'd do differently

Capture apply/destroy evidence in same session. Consider using `for_each` over AZ set for safer refactoring.
