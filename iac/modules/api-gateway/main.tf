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

resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_rest_api.rafflenow_api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# Resource: /api/v1/raffles
resource "aws_api_gateway_resource" "raffles" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "raffles"
}

# Method: GET /raffles
resource "aws_api_gateway_method" "get_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integration: GET /raffles -> Lambda list-raffles
resource "aws_api_gateway_integration" "get_raffles_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.raffles.id
  http_method             = aws_api_gateway_method.get_raffles.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.id}:lambda:path/2015-03-31/functions/${var.lambda_list_raffles_arn}/invocations"
}

# Permission: Allow API Gateway to invoke Lambda
resource "aws_lambda_permission" "api_gateway_invoke_list_raffles" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_list_raffles_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}

# Method: POST /api/v1/raffles
resource "aws_api_gateway_method" "post_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration: POST /api/v1/raffles -> Lambda create-raffle
resource "aws_api_gateway_integration" "post_raffles_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.raffles.id
  http_method             = aws_api_gateway_method.post_raffles.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_create_raffle_invoke_arn
}

# Permission: Allow API Gateway to invoke create-raffle Lambda
resource "aws_lambda_permission" "api_gateway_invoke_create_raffle" {
  statement_id  = "AllowAPIGatewayInvokeCreateRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_create_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}

# Data source for current region
data "aws_region" "current" {}

# Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.v1.id,
      aws_api_gateway_resource.raffles.id,
      aws_api_gateway_method.get_raffles.id,
      aws_api_gateway_method.post_raffles.id,
      aws_api_gateway_integration.get_raffles_lambda.id,
      aws_api_gateway_integration.post_raffles_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.get_raffles_lambda
  ]
}

# Stage
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  stage_name    = var.environment

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${var.environment}-stage"
  })
}
