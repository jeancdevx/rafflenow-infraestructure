# Integration: GET /api/v1/raffles -> Lambda list-raffles
resource "aws_api_gateway_integration" "get_raffles_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id             = aws_api_gateway_resource.raffles.id
  http_method             = aws_api_gateway_method.get_raffles.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.id}:lambda:path/2015-03-31/functions/${var.lambda_list_raffles_arn}/invocations"
}

resource "aws_lambda_permission" "api_gateway_invoke_list_raffles" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_list_raffles_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
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

resource "aws_lambda_permission" "api_gateway_invoke_create_raffle" {
  statement_id  = "AllowAPIGatewayInvokeCreateRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_create_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
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

resource "aws_lambda_permission" "api_gateway_invoke_get_raffle" {
  statement_id  = "AllowAPIGatewayInvokeGetRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_get_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
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

resource "aws_lambda_permission" "api_gateway_invoke_ingest_participation" {
  statement_id  = "AllowAPIGatewayInvokeIngestParticipation"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_ingest_participation_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
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

resource "aws_lambda_permission" "api_gateway_invoke_close_raffle" {
  statement_id  = "AllowAPIGatewayInvokeCloseRaffle"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_close_raffle_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
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

resource "aws_lambda_permission" "api_gateway_invoke_upload_image" {
  statement_id  = "AllowAPIGatewayInvokeUploadImage"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_upload_image_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.rafflenow_api.execution_arn}/*/*"
}
