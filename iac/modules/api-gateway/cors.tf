# OPTIONS /api/v1/raffles (CORS preflight)
resource "aws_api_gateway_method" "options_raffles" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffles.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_raffles_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_raffles_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffles.id
  http_method = aws_api_gateway_method.options_raffles.http_method
  status_code = aws_api_gateway_method_response.options_raffles_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_raffles_mock
  ]
}

# OPTIONS /api/v1/raffles/{id} (CORS preflight)
resource "aws_api_gateway_method" "options_raffle_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.raffle_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_raffle_by_id_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_raffle_by_id_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_raffle_by_id_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.raffle_id.id
  http_method = aws_api_gateway_method.options_raffle_by_id.http_method
  status_code = aws_api_gateway_method_response.options_raffle_by_id_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  depends_on = [
    aws_api_gateway_integration.options_raffle_by_id_mock
  ]
}

# OPTIONS /api/v1/raffles/{id}/participate (CORS preflight)
resource "aws_api_gateway_method" "options_participate" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.participate.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_participate_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_participate_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.participate.id
  http_method = aws_api_gateway_method.options_participate.http_method
  status_code = aws_api_gateway_method_response.options_participate_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_participate_mock
  ]
}

# OPTIONS /api/v1/raffles/{id}/close (CORS preflight)
resource "aws_api_gateway_method" "options_close" {
  rest_api_id   = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id   = aws_api_gateway_resource.close.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_close_mock" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_close_200" {
  rest_api_id = aws_api_gateway_rest_api.rafflenow_api.id
  resource_id = aws_api_gateway_resource.close.id
  http_method = aws_api_gateway_method.options_close.http_method
  status_code = aws_api_gateway_method_response.options_close_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [
    aws_api_gateway_integration.options_close_mock
  ]
}
