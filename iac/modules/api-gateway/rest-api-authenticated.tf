#checkov:skip=CKV2_AWS_51:Client certificates not applicable - web browsers don't support mTLS, using Cognito authorizer
resource "aws_api_gateway_rest_api" "authenticated_api" {
  name        = "${var.name_prefix}-authenticated-api"
  description = "RaffleNow Authenticated REST API for user actions"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-authenticated-api"
    Type = "API Gateway Authenticated"
  })
}
