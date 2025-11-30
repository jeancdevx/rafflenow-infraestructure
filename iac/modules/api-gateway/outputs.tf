output "public_api_id" {
  description = "ID of the Public API Gateway"
  value       = aws_api_gateway_rest_api.public_api.id
}

output "public_api_url" {
  description = "Base URL of the Public API Gateway"
  value       = aws_api_gateway_stage.public_api_stage.invoke_url
}

output "public_api_endpoints" {
  description = "Public API endpoints"
  value = {
    list_raffles = "${aws_api_gateway_stage.public_api_stage.invoke_url}/api/v1/raffles"
    get_raffle   = "${aws_api_gateway_stage.public_api_stage.invoke_url}/api/v1/raffles/{id}"
  }
}

output "authenticated_api_id" {
  description = "ID of the Authenticated API Gateway"
  value       = aws_api_gateway_rest_api.authenticated_api.id
}

output "authenticated_api_url" {
  description = "Base URL of the Authenticated API Gateway"
  value       = aws_api_gateway_stage.authenticated_api_stage.invoke_url
}

output "authenticated_api_endpoints" {
  description = "Authenticated API endpoints"
  value = {
    create_raffle = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles"
    participate   = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles/{id}/participate"
    close_raffle  = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles/{id}/close"
    upload_image  = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/assets/upload"
  }
}

output "api_endpoints" {
  description = "All API endpoints (public and authenticated)"
  value = {
    public = {
      list_raffles = "${aws_api_gateway_stage.public_api_stage.invoke_url}/api/v1/raffles"
      get_raffle   = "${aws_api_gateway_stage.public_api_stage.invoke_url}/api/v1/raffles/{id}"
    }
    authenticated = {
      create_raffle = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles"
      participate   = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles/{id}/participate"
      close_raffle  = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/raffles/{id}/close"
      upload_image  = "${aws_api_gateway_stage.authenticated_api_stage.invoke_url}/api/v1/assets/upload"
    }
  }
}

output "public_api_stage_arn" {
  description = "ARN of the Public API Gateway stage (for WAF association)"
  value       = aws_api_gateway_stage.public_api_stage.arn
}

output "authenticated_api_stage_arn" {
  description = "ARN of the Authenticated API Gateway stage (for WAF association)"
  value       = aws_api_gateway_stage.authenticated_api_stage.arn
}

output "public_api_name" {
  description = "Name of the Public API Gateway"
  value       = aws_api_gateway_rest_api.public_api.name
}

output "public_api_stage_name" {
  description = "Stage name of the Public API Gateway"
  value       = aws_api_gateway_stage.public_api_stage.stage_name
}

output "authenticated_api_name" {
  description = "Name of the Authenticated API Gateway"
  value       = aws_api_gateway_rest_api.authenticated_api.name
}

output "authenticated_api_stage_name" {
  description = "Stage name of the Authenticated API Gateway"
  value       = aws_api_gateway_stage.authenticated_api_stage.stage_name
}
