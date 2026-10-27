resource "aws_ssm_parameter" "config" {
  name  = "/${local.name_prefix}/config"
  type  = "String"
  value = "${var.app_name}-${var.environment}-config-value"
}
