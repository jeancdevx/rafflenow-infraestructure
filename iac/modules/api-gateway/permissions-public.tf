resource "aws_lambda_permission" "public_api_gateway_invoke_list_raffles" {
  statement_id  = "AllowPublicAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.list_raffles_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.public_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "public_api_gateway_invoke_get_raffle" {
  statement_id  = "AllowPublicAPIGatewayInvokeGetRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.get_raffle_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.public_api.execution_arn}/*/*"
}
