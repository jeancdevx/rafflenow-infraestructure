# Base resource: /api
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_rest_api.rafflenow_api.root_resource_id
  path_part   = "api"
}

# Version resource: /api/v1
resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# Raffles resource: /api/v1/raffles
resource "aws_api_gateway_resource" "raffles" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "raffles"
}

# Raffle by ID: /api/v1/raffles/{id}
resource "aws_api_gateway_resource" "raffle_id" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffles.id
  path_part   = "{id}"
}

# Participate: /api/v1/raffles/{id}/participate
resource "aws_api_gateway_resource" "participate" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffle_id.id
  path_part   = "participate"
}

# Close: /api/v1/raffles/{id}/close
resource "aws_api_gateway_resource" "close" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.raffle_id.id
  path_part   = "close"
}

# Assets: /api/v1/assets
resource "aws_api_gateway_resource" "assets" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "assets"
}

# Upload: /api/v1/assets/upload
resource "aws_api_gateway_resource" "assets_upload" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  parent_id   = aws_api_gateway_resource.assets.id
  path_part   = "upload"
}
