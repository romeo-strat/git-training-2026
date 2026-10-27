locals {
  common_tags = {
    Name = "${var.name_prefix}-vpc"
  }
  subnet_cidr = cidrsubnet(var.vpc_cidr, 8, 0)
}
