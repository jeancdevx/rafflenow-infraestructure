resource "aws_api_gateway_deployment" "public_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id

  depends_on = [
    aws_api_gateway_integration.public_get_raffles_lambda,
    aws_api_gateway_integration.public_get_raffle_by_id_lambda,
    aws_api_gateway_integration_response.public_options_raffles_200,
    aws_api_gateway_integration_response.public_options_raffle_by_id_200,
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.public_api.body,
      aws_api_gateway_resource.public_raffles.id,
      aws_api_gateway_resource.public_raffle_id.id,
      aws_api_gateway_method.public_get_raffles.id,
      aws_api_gateway_method.public_get_raffle_by_id.id,
      aws_api_gateway_integration.public_get_raffles_lambda.id,
      aws_api_gateway_integration.public_get_raffle_by_id_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "public_api_stage" {
  #checkov:skip=CKV_AWS_120:API Gateway caching disabled - responses are dynamic and cache handled at CloudFront layer
  #checkov:skip=CKV2_AWS_29:WAF association exists in waf/associations.tf - Checkov cannot trace cross-module relationships
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  deployment_id = aws_api_gateway_deployment.public_api_deployment.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.public_api_access_logs.arn
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
    })
  }

  depends_on = [aws_api_gateway_account.main]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-api-${var.environment}"
  })
}

resource "aws_api_gateway_method_settings" "public_all" {
  rest_api_id = aws_api_gateway_rest_api.public_api.id
  stage_name  = aws_api_gateway_stage.public_api_stage.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    metrics_enabled    = true
    data_trace_enabled = false
  }
}
