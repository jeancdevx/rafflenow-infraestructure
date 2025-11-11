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

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  stage_name    = var.environment

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-${var.environment}-stage"
  })
}
