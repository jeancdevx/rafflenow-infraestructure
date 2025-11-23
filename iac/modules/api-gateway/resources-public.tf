resource "aws_api_gateway_resource" "public_api" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  parent_id   = aws_api_gateway_rest_api.public_api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "public_v1" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  parent_id   = aws_api_gateway_resource.public_api.id
  path_part   = "v1"
}

resource "aws_api_gateway_resource" "public_raffles" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  parent_id   = aws_api_gateway_resource.public_v1.id
  path_part   = "raffles"
}

resource "aws_api_gateway_resource" "public_raffle_id" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  parent_id   = aws_api_gateway_resource.public_raffles.id
  path_part   = "{id}"
}
