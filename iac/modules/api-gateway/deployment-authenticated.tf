resource "aws_api_gateway_deployment" "authenticated_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id

  depends_on = [
    aws_api_gateway_integration.authenticated_post_raffles_lambda,
    aws_api_gateway_integration.authenticated_post_participate_lambda,
    aws_api_gateway_integration.authenticated_post_close_lambda,
    aws_api_gateway_integration.authenticated_post_assets_upload_lambda,
    aws_api_gateway_integration_response.authenticated_options_raffles_200,
    aws_api_gateway_integration_response.authenticated_options_participate_200,
    aws_api_gateway_integration_response.authenticated_options_close_200,
    aws_api_gateway_integration_response.authenticated_options_assets_upload_200,
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.authenticated_api.body,
      aws_api_gateway_resource.authenticated_raffles.id,
      aws_api_gateway_resource.authenticated_participate.id,
      aws_api_gateway_resource.authenticated_close.id,
      aws_api_gateway_resource.authenticated_assets_upload.id,
      aws_api_gateway_method.authenticated_post_raffles.id,
      aws_api_gateway_method.authenticated_post_participate.id,
      aws_api_gateway_method.authenticated_post_close.id,
      aws_api_gateway_method.authenticated_post_assets_upload.id,
      aws_api_gateway_integration.authenticated_post_raffles_lambda.id,
      aws_api_gateway_integration.authenticated_post_participate_lambda.id,
      aws_api_gateway_integration.authenticated_post_close_lambda.id,
      aws_api_gateway_integration.authenticated_post_assets_upload_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "authenticated_api_stage" {
  #checkov:skip=CKV_AWS_120:API Gateway caching disabled - authenticated responses must not be cached
  #checkov:skip=CKV2_AWS_29:WAF association exists in waf/associations.tf - Checkov cannot trace cross-module relationships
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  deployment_id = aws_api_gateway_deployment.authenticated_api_deployment.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.authenticated_api_access_logs.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      caller             = "$context.identity.caller"
      user               = "$context.identity.user"
      userAgent          = "$context.identity.userAgent"
      requestTime        = "$context.requestTime"
      requestTimeEpoch   = "$context.requestTimeEpoch"
      httpMethod         = "$context.httpMethod"
      resourcePath       = "$context.resourcePath"
      path               = "$context.path"
      status             = "$context.status"
      protocol           = "$context.protocol"
      responseLength     = "$context.responseLength"
      responseLatency    = "$context.responseLatency"
      integrationLatency = "$context.integrationLatency"
      errorMessage       = "$context.error.message"
      errorType          = "$context.error.responseType"
      cognitoUser        = "$context.authorizer.claims.sub"
      cognitoEmail       = "$context.authorizer.claims.email"
    })
  }

  depends_on = [aws_api_gateway_account.main]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-authenticated-api-${var.environment}"
  })
}

resource "aws_api_gateway_method_settings" "authenticated_all" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  stage_name  = aws_api_gateway_stage.authenticated_api_stage.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    metrics_enabled    = true
    data_trace_enabled = false
  }
}
