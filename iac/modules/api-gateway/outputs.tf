output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.rafflenow_api.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.rafflenow_api.arn
}

output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = aws_api_gateway_stage.api_stage.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.api_stage.stage_name
}

output "api_endpoint_get_raffles" {
  description = "Full URL endpoint for GET /raffles"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/api/v1/raffles"
}

output "api_endpoint_post_raffles" {
  description = "Full URL endpoint for POST /api/v1/raffles"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/api/v1/raffles"
}

output "api_endpoint_post_participate" {
  description = "Full URL endpoint for POST /api/v1/raffles/{id}/participate"
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}/api/v1/raffles/{id}/participate"
}