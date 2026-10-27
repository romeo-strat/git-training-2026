resource "aws_ssm_parameter" "placeholder" {
  name  = "/m02/placeholder"
  type  = "String"
  value = "m02-placeholder-not-a-real-secret"
}
