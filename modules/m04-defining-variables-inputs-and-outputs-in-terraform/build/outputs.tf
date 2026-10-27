output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "db_password_display" {
  description = "Password for display test (sensitive)"
  value       = var.db_password
  sensitive   = true
}
