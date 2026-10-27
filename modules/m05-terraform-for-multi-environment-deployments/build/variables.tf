variable "region" {
  type        = string
  description = "AWS region"
  default     = "ap-southeast-1"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "app_name" {
  type        = string
  description = "Application name"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR"
}
