locals {
  # En desarrollo permitimos cualquier origen, en producción solo CloudFront
  # Para producción estricta, cambiar a: cors_origin = var.cloudfront_url
  cors_origin = "*"
}

resource "aws_api_gateway_method_response" "authenticated_options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_raffles.id
  http_method = aws_api_gateway_method.authenticated_options_raffles.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "authenticated_options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_raffles.id
  http_method = aws_api_gateway_method.authenticated_options_raffles.http_method
  status_code = aws_api_gateway_method_response.authenticated_options_raffles_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_origin}'"
  }

  depends_on = [
    aws_api_gateway_integration.authenticated_options_raffles_mock
  ]
}

resource "aws_api_gateway_method_response" "authenticated_options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_participate.id
  http_method = aws_api_gateway_method.authenticated_options_participate.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "authenticated_options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_participate.id
  http_method = aws_api_gateway_method.authenticated_options_participate.http_method
  status_code = aws_api_gateway_method_response.authenticated_options_participate_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_origin}'"
  }

  depends_on = [
    aws_api_gateway_integration.authenticated_options_participate_mock
  ]
}

resource "aws_api_gateway_method_response" "authenticated_options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_close.id
  http_method = aws_api_gateway_method.authenticated_options_close.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "authenticated_options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_close.id
  http_method = aws_api_gateway_method.authenticated_options_close.http_method
  status_code = aws_api_gateway_method_response.authenticated_options_close_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_origin}'"
  }

  depends_on = [
    aws_api_gateway_integration.authenticated_options_close_mock
  ]
}

resource "aws_api_gateway_method_response" "authenticated_options_assets_upload_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method = aws_api_gateway_method.authenticated_options_assets_upload.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "authenticated_options_assets_upload_200" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  resource_id = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method = aws_api_gateway_method.authenticated_options_assets_upload.http_method
  status_code = aws_api_gateway_method_response.authenticated_options_assets_upload_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_origin}'"
  }

  depends_on = [
    aws_api_gateway_integration.authenticated_options_assets_upload_mock
  ]
}
