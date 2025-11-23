resource "aws_api_gateway_method" "public_get_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffles.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_get_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffle_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_options_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_options_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffle_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
