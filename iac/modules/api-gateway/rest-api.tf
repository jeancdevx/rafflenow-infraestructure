resource "aws_api_gateway_rest_api" "rafflenow_api" {
  name        = "${var.name_prefix}-api"
  description = "RaffleNow REST API for managing raffles"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api"
    Type = "API Gateway"
  })
}

data "aws_region" "current" {}
