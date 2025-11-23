resource "aws_api_gateway_integration" "public_get_raffles_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.public_api.id
  resource_id             = aws_api_gateway_resource.public_raffles.id
  http_method             = aws_api_gateway_method.public_get_raffles.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.list_raffles_invoke_arn
}

resource "aws_api_gateway_integration" "public_get_raffle_by_id_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.public_api.id
  resource_id             = aws_api_gateway_resource.public_raffle_id.id
  http_method             = aws_api_gateway_method.public_get_raffle_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_raffle_invoke_arn
}

resource "aws_api_gateway_integration" "public_options_raffles_mock" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  resource_id = aws_api_gateway_resource.public_raffles.id
  http_method = aws_api_gateway_method.public_options_raffles.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "public_options_raffle_by_id_mock" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  resource_id = aws_api_gateway_resource.public_raffle_id.id
  http_method = aws_api_gateway_method.public_options_raffle_by_id.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}
