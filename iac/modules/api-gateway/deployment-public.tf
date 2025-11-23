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
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  deployment_id = aws_api_gateway_deployment.public_api_deployment.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-api-${var.environment}"
  })
}
