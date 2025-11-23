resource "aws_lambda_permission" "authenticated_api_gateway_invoke_create_raffle" {
  statement_id  = "AllowAuthenticatedAPIGatewayInvokeCreateRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.create_raffle_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.authenticated_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "authenticated_api_gateway_invoke_ingest_participation" {
  statement_id  = "AllowAuthenticatedAPIGatewayInvokeIngestParticipation"
  action        = "lambda:InvokeFunction"
  function_name = var.ingest_participation_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.authenticated_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "authenticated_api_gateway_invoke_close_raffle" {
  statement_id  = "AllowAuthenticatedAPIGatewayInvokeCloseRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.close_raffle_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.authenticated_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "authenticated_api_gateway_invoke_upload_image" {
  statement_id  = "AllowAuthenticatedAPIGatewayInvokeUploadImage"
  action        = "lambda:InvokeFunction"
  function_name = var.upload_image_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.authenticated_api.execution_arn}/*/*"
}
