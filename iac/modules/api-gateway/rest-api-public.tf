resource "aws_api_gateway_rest_api" "public_api" {
  name        = "${var.name_prefix}-public-api"
  description = "RaffleNow Public REST API for listing raffles"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-api"
    Type = "API Gateway Public"
  })
}
