provider "aws" {
  region = var.region

  default_tags {
    tags = {
      ManagedBy = "terraform"
      Project   = "terraform-basics-training"
      Stage     = "M04"
    }
  }
}
