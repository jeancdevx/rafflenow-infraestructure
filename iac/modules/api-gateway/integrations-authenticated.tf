resource "aws_api_gateway_integration" "authenticated_post_raffles_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.authenticated_api.id
  resource_id             = aws_api_gateway_resource.authenticated_raffles.id
  http_method             = aws_api_gateway_method.authenticated_post_raffles.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.create_raffle_invoke_arn
}

resource "aws_api_gateway_integration" "authenticated_post_participate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.authenticated_api.id
  resource_id             = aws_api_gateway_resource.authenticated_participate.id
  http_method             = aws_api_gateway_method.authenticated_post_participate.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.ingest_participation_invoke_arn
}

resource "aws_api_gateway_integration" "authenticated_post_close_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.authenticated_api.id
  resource_id             = aws_api_gateway_resource.authenticated_close.id
  http_method             = aws_api_gateway_method.authenticated_post_close.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.close_raffle_invoke_arn
}

resource "aws_api_gateway_integration" "authenticated_post_assets_upload_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.authenticated_api.id
  resource_id             = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method             = aws_api_gateway_method.authenticated_post_assets_upload.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.upload_image_invoke_arn
}

resource "aws_api_gateway_integration" "authenticated_options_raffles_mock" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_raffles.id
  http_method = aws_api_gateway_method.authenticated_options_raffles.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "authenticated_options_participate_mock" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_participate.id
  http_method = aws_api_gateway_method.authenticated_options_participate.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "authenticated_options_close_mock" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_close.id
  http_method = aws_api_gateway_method.authenticated_options_close.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration" "authenticated_options_assets_upload_mock" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method = aws_api_gateway_method.authenticated_options_assets_upload.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}
