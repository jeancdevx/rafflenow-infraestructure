resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.name_prefix}-cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  provider_arns = [var.cognito_user_pool_arn]

  identity_source = "method.request.header.Authorization"
}
