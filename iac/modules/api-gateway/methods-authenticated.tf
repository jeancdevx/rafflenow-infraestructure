resource "aws_api_gateway_method" "authenticated_post_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_raffles.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authenticated.id

  authorization_scopes = []
}

resource "aws_api_gateway_method" "authenticated_post_participate" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_participate.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authenticated.id

  authorization_scopes = []
}

resource "aws_api_gateway_method" "authenticated_post_close" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_close.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authenticated.id

  authorization_scopes = []
}

resource "aws_api_gateway_method" "authenticated_post_assets_upload" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authenticated.id

  authorization_scopes = []
}

resource "aws_api_gateway_method" "authenticated_options_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_raffles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "authenticated_options_participate" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_participate.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "authenticated_options_close" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_close.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "authenticated_options_assets_upload" {
  rest_api_id   = aws_api_gateway_rest_api.authenticated_api.id
  resource_id   = aws_api_gateway_resource.authenticated_assets_upload.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
