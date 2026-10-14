# M01 reference build — one simple resource (trainer-only model answer).
#
# aws_ssm_parameter is chosen so the stage stays about the workflow, not AWS
# architecture (brief.md:29). It is cheap and fast to create and destroy.
#
# In-place update evidence (DoD-06): change the `value` attribute and re-plan —
# a String parameter's value changes in place. (Changing `type` would force
# replacement; that is the contrast the write-up records.)
#
# A resource-level Name tag sits alongside the provider-level default_tags on
# purpose: it shows the case where you tag a resource individually anyway.

resource "aws_ssm_parameter" "demo" {
  name  = "/terraform-basics/m01/demo"
  type  = "String"
  value = "placeholder-change-me"

  tags = {
    Name = "m01-demo-parameter"
  }
}
