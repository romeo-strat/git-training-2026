provider "aws" {
  region = "ap-southeast-1"

  default_tags {
    tags = {
      ManagedBy = "terraform"
      Project   = "terraform-basics-training"
      Stage     = "M03"
    }
  }
}
