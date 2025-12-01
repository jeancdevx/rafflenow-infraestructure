resource "aws_api_gateway_method" "public_get_raffles" {
  #checkov:skip=CKV_AWS_59:Public API endpoints intentionally without authorization - listing raffles is public
  #checkov:skip=CKV2_AWS_53:Stage-level WAF configured at CloudFront layer
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffles.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_get_raffle_by_id" {
  #checkov:skip=CKV_AWS_59:Public API endpoints intentionally without authorization - listing raffles is public
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffle_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_options_raffles" {
  #checkov:skip=CKV_AWS_59:CORS preflight OPTIONS requests do not require authorization
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "public_options_raffle_by_id" {
  #checkov:skip=CKV_AWS_59:CORS preflight OPTIONS requests do not require authorization
  rest_api_id   = aws_api_gateway_rest_api.public_api.id
  resource_id   = aws_api_gateway_resource.public_raffle_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}
