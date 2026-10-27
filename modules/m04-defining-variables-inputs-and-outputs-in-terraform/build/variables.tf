variable "region" {
  type        = string
  description = "AWS region to deploy into"
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && tonumber(split("/", var.vpc_cidr)[1]) >= 16 && tonumber(split("/", var.vpc_cidr)[1]) <= 28
    error_message = "vpc_cidr must be a valid IPv4 CIDR with prefix length between /16 and /28."
  }
}

variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "db_password" {
  type        = string
  description = "Database password (placeholder only)"
  sensitive   = true
}
