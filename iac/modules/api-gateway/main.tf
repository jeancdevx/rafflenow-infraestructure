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

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.name_prefix}-cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  provider_arns = [var.cognito_user_pool_arn]

  identity_source = "method.request.header.Authorization"
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
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
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

# Method: OPTIONS /api/v1/raffles
resource "aws_api_gateway_method" "options_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration: OPTIONS /api/v1/raffles -> Mock
resource "aws_api_gateway_integration" "options_raffles_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method Response: OPTIONS /api/v1/raffles
resource "aws_api_gateway_method_response" "options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
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

# Integration Response: OPTIONS /api/v1/raffles
resource "aws_api_gateway_integration_response" "options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
  status_code = aws_api_gateway_method_response.options_raffles_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_raffles_mock
  ]
}

# Resource: /api/v1/raffles/{id}
resource "aws_api_gateway_resource" "raffle_id" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffles.id
  path_part   = "{id}"
}

# Method: OPTIONS /api/v1/raffles/{id}
resource "aws_api_gateway_method" "options_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffle_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration: OPTIONS /api/v1/raffles/{id} -> MOCK
resource "aws_api_gateway_integration" "options_raffle_by_id_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method Response: OPTIONS /api/v1/raffles/{id}
resource "aws_api_gateway_method_response" "options_raffle_by_id_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# Integration Response: OPTIONS /api/v1/raffles/{id}
resource "aws_api_gateway_integration_response" "options_raffle_by_id_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  status_code = aws_api_gateway_method_response.options_raffle_by_id_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  depends_on = [
    aws_api_gateway_integration.options_raffle_by_id_mock
  ]
}

# Method: GET /api/v1/raffles/{id}
resource "aws_api_gateway_method" "get_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffle_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integration: GET /api/v1/raffles/{id} -> Lambda get-raffle
resource "aws_api_gateway_integration" "get_raffle_by_id_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.raffle_id.id
  http_method             = aws_api_gateway_method.get_raffle_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_get_raffle_invoke_arn
}

# Permission: Allow API Gateway to invoke get-raffle Lambda
resource "aws_lambda_permission" "api_gateway_invoke_get_raffle" {
  statement_id  = "AllowAPIGatewayInvokeGetRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_get_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}

# Resource: /api/v1/raffles/{id}/participate
resource "aws_api_gateway_resource" "participate" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffle_id.id
  path_part   = "participate"
}

# Method: POST /api/v1/raffles/{id}/participate
resource "aws_api_gateway_method" "post_participate" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.participate.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# Integration: POST /api/v1/raffles/{id}/participate -> Lambda ingest-participation
resource "aws_api_gateway_integration" "post_participate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.participate.id
  http_method             = aws_api_gateway_method.post_participate.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_ingest_participation_invoke_arn
}

# Permission: Allow API Gateway to invoke ingest-participation Lambda
resource "aws_lambda_permission" "api_gateway_invoke_ingest_participation" {
  statement_id  = "AllowAPIGatewayInvokeIngestParticipation"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_ingest_participation_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}

# Method: OPTIONS /api/v1/raffles/{id}/participate (CORS preflight)
resource "aws_api_gateway_method" "options_participate" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.participate.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration: OPTIONS /api/v1/raffles/{id}/participate -> Mock
resource "aws_api_gateway_integration" "options_participate_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method Response: OPTIONS /api/v1/raffles/{id}/participate
resource "aws_api_gateway_method_response" "options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
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

# Integration Response: OPTIONS /api/v1/raffles/{id}/participate
resource "aws_api_gateway_integration_response" "options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
  status_code = aws_api_gateway_method_response.options_participate_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_participate_mock
  ]
}

# Resource: /api/v1/raffles/{id}/close
resource "aws_api_gateway_resource" "close" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffle_id.id
  path_part   = "close"
}

# Method: POST /api/v1/raffles/{id}/close
resource "aws_api_gateway_method" "post_close" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.close.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# Integration: POST /api/v1/raffles/{id}/close -> Lambda close-raffle
resource "aws_api_gateway_integration" "post_close_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.close.id
  http_method             = aws_api_gateway_method.post_close.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_close_raffle_invoke_arn
}

# Permission: Allow API Gateway to invoke close-raffle Lambda
resource "aws_lambda_permission" "api_gateway_invoke_close_raffle" {
  statement_id  = "AllowAPIGatewayInvokeCloseRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_close_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}

# Method: OPTIONS /api/v1/raffles/{id}/close (CORS preflight)
resource "aws_api_gateway_method" "options_close" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.close.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration: OPTIONS /api/v1/raffles/{id}/close -> Mock
resource "aws_api_gateway_integration" "options_close_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method Response: OPTIONS /api/v1/raffles/{id}/close
resource "aws_api_gateway_method_response" "options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
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

# Integration Response: OPTIONS /api/v1/raffles/{id}/close
resource "aws_api_gateway_integration_response" "options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
  status_code = aws_api_gateway_method_response.options_close_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_close_mock
  ]
}

# Resource: /api/v1/assets
resource "aws_api_gateway_resource" "assets" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "assets"
}

# Resource: /api/v1/assets/upload
resource "aws_api_gateway_resource" "assets_upload" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.assets.id
  path_part   = "upload"
}

# Method: POST /api/v1/assets/upload (Admin only)
resource "aws_api_gateway_method" "post_assets_upload" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.assets_upload.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# Integration: POST /api/v1/assets/upload -> Lambda upload-image
resource "aws_api_gateway_integration" "post_assets_upload_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.assets_upload.id
  http_method             = aws_api_gateway_method.post_assets_upload.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_upload_image_invoke_arn
}

# Permission: Allow API Gateway to invoke upload-image Lambda
resource "aws_lambda_permission" "api_gateway_invoke_upload_image" {
  statement_id  = "AllowAPIGatewayInvokeUploadImage"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_upload_image_name
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
      aws_api_gateway_resource.raffle_id.id,
      aws_api_gateway_resource.participate.id,
      aws_api_gateway_resource.close.id,
      aws_api_gateway_resource.assets.id,
      aws_api_gateway_resource.assets_upload.id,
      aws_api_gateway_method.get_raffles.id,
      aws_api_gateway_method.get_raffle_by_id.id,
      aws_api_gateway_method.post_raffles.id,
      aws_api_gateway_method.post_participate.id,
      aws_api_gateway_method.post_close.id,
      aws_api_gateway_method.post_assets_upload.id,
      aws_api_gateway_method.options_raffles.id,
      aws_api_gateway_method.options_raffle_by_id.id,
      aws_api_gateway_method.options_participate.id,
      aws_api_gateway_method.options_close.id,
      aws_api_gateway_integration.get_raffles_lambda.id,
      aws_api_gateway_integration.get_raffle_by_id_lambda.id,
      aws_api_gateway_integration.post_raffles_lambda.id,
      aws_api_gateway_integration.post_participate_lambda.id,
      aws_api_gateway_integration.post_close_lambda.id,
      aws_api_gateway_integration.post_assets_upload_lambda.id,
      aws_api_gateway_integration.options_raffles_mock.id,
      aws_api_gateway_integration.options_raffle_by_id_mock.id,
      aws_api_gateway_integration.options_participate_mock.id,
      aws_api_gateway_integration.options_close_mock.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.get_raffles_lambda,
    aws_api_gateway_integration.get_raffle_by_id_lambda,
    aws_api_gateway_integration.post_raffles_lambda,
    aws_api_gateway_integration.post_participate_lambda,
    aws_api_gateway_integration.post_close_lambda,
    aws_api_gateway_integration.post_assets_upload_lambda,
    aws_api_gateway_integration_response.options_raffles_200,
    aws_api_gateway_integration_response.options_raffle_by_id_200,
    aws_api_gateway_integration_response.options_participate_200,
    aws_api_gateway_integration_response.options_close_200,
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
