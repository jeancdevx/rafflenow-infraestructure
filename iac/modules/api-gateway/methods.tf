# GET /api/v1/raffles
resource "aws_api_gateway_method" "get_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST /api/v1/raffles
resource "aws_api_gateway_method" "post_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# GET /api/v1/raffles/{id}
resource "aws_api_gateway_method" "get_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffle_id.id
  http_method   = "GET"
  authorization = "NONE"
}

# POST /api/v1/raffles/{id}/participate
resource "aws_api_gateway_method" "post_participate" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.participate.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# POST /api/v1/raffles/{id}/close
resource "aws_api_gateway_method" "post_close" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.close.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}

# POST /api/v1/assets/upload
resource "aws_api_gateway_method" "post_assets_upload" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.assets_upload.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  authorization_scopes = []
}
