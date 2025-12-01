output "public_api_id" {
  description = "ID of the Public API Gateway"
  value       = aws_api_gateway_rest_api.public_api.id
}

output "public_api_url" {
  description = "Base URL of the Public API Gateway"
  value       = aws_api_gateway_stage.public_api_stage.invoke_url
}

output "public_api_domain" {
  description = "Domain name of the Public API Gateway (without protocol)"
  value       = "${aws_api_gateway_rest_api.public_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com"
}

output "public_api_endpoints" {
  description = "Public API endpoints (via CloudFront)"
  value = {
    list_raffles = "/api/v1/public/raffles"
    get_raffle   = "/api/v1/public/raffles/{id}"
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

output "authenticated_api_domain" {
  description = "Domain name of the Authenticated API Gateway (without protocol)"
  value       = "${aws_api_gateway_rest_api.authenticated_api.id}.execute-api.${data.aws_region.current.id}.amazonaws.com"
}

output "authenticated_api_endpoints" {
  description = "Authenticated API endpoints (via CloudFront)"
  value = {
    create_raffle = "/api/v1/raffles"
    participate   = "/api/v1/raffles/{id}/participate"
    close_raffle  = "/api/v1/raffles/{id}/close"
    upload_image  = "/api/v1/assets/upload"
  }
}

output "api_endpoints" {
  description = "All API endpoints (via CloudFront)"
  value = {
    public = {
      list_raffles = "/api/v1/public/raffles"
      get_raffle   = "/api/v1/public/raffles/{id}"
    }
    authenticated = {
      create_raffle = "/api/v1/raffles"
      participate   = "/api/v1/raffles/{id}/participate"
      close_raffle  = "/api/v1/raffles/{id}/close"
      upload_image  = "/api/v1/assets/upload"
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

output "public_api_access_logs_arn" {
  description = "ARN of the Public API Gateway access logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.public_api_access_logs.arn
}

output "public_api_access_logs_name" {
  description = "Name of the Public API Gateway access logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.public_api_access_logs.name
}

output "authenticated_api_access_logs_arn" {
  description = "ARN of the Authenticated API Gateway access logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.authenticated_api_access_logs.arn
}

output "authenticated_api_access_logs_name" {
  description = "Name of the Authenticated API Gateway access logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.authenticated_api_access_logs.name
}
