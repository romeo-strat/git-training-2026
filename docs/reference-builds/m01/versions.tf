# M01 reference build — provider requirements (trainer-only model answer).
#
# Stage rule: Terraform CLI, 1.11 or later, at the exact version in versions.env
# (README "Rules for every stage"). Constraints are *derived from* the exact pins
# (ADR-010); the installed pin itself comes from versions.env, not from this file.
#
# Pins as of curation: TF_VERSION=1.16.5, AWS_PROVIDER_VERSION=6.68.0.

terraform {
  required_version = ">= 1.11.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
