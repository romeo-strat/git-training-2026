# M01 reference build — AWS provider config (trainer-only model answer).
#
# Region: set this to the AWS sandbox region before running.
# default_tags: applied once at the provider so every resource this configuration
# creates inherits the same tags (see write-up "Why it's built this way"),
# rather than repeating a tags block on each resource.

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "terraform-basics-training"
      Stage     = "M01"
      ManagedBy = "terraform"
    }
  }
}
