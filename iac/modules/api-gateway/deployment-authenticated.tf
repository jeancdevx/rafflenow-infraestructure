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
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  deployment_id = aws_api_gateway_deployment.authenticated_api_deployment.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-authenticated-api-${var.environment}"
  })
}
