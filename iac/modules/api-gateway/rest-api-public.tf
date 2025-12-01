#checkov:skip=CKV2_AWS_51:Client certificates not applicable - web browsers don't support mTLS, using Cognito instead
resource "aws_api_gateway_rest_api" "public_api" {
  name        = "${var.name_prefix}-public-api"
  description = "RaffleNow Public REST API for listing raffles"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-api"
    Type = "API Gateway Public"
  })
}
