resource "aws_api_gateway_resource" "authenticated_api" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_rest_api.authenticated_api.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "authenticated_v1" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_api.id
  path_part   = "v1"
}

resource "aws_api_gateway_resource" "authenticated_raffles" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_v1.id
  path_part   = "raffles"
}

resource "aws_api_gateway_resource" "authenticated_raffle_id" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_raffles.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "authenticated_participate" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_raffle_id.id
  path_part   = "participate"
}

resource "aws_api_gateway_resource" "authenticated_close" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_raffle_id.id
  path_part   = "close"
}

resource "aws_api_gateway_resource" "authenticated_assets" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_v1.id
  path_part   = "assets"
}

resource "aws_api_gateway_resource" "authenticated_assets_upload" {
  rest_api_id = aws_api_gateway_rest_api.authenticated_api.id
  parent_id   = aws_api_gateway_resource.authenticated_assets.id
  path_part   = "upload"
}
