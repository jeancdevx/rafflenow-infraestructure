resource "aws_wafv2_web_acl_association" "api_gateway_public" {
  resource_arn = var.api_gateway_public_arn
  web_acl_arn  = aws_wafv2_web_acl.regional.arn
}

resource "aws_wafv2_web_acl_association" "api_gateway_authenticated" {
  resource_arn = var.api_gateway_authenticated_arn
  web_acl_arn  = aws_wafv2_web_acl.regional.arn
}
