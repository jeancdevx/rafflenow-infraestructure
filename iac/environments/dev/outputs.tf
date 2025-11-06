output "aws_account_id" {
  description = "El ID de la cuenta de AWS"
  value       = data.aws_caller_identity.me.account_id
}

output "aws_region" {
  description = "La región de AWS utilizada"
  value       = var.region
}

output "environment" {
  description = "El entorno actual"
  value       = var.env
}

output "aws_profile" {
  description = "El perfil de AWS utilizado"
  value       = var.aws_profile
}

output "bucket_name" {
  description = "The name of the S3 assets bucket"
  value       = module.storage.s3_assets_bucket_name
}

output "table_name" {
  description = "The name of the DynamoDB raffles table"
  value       = module.storage.dynamodb_raffles_table_name
}

output "lambda_list_raffles_name" {
  description = "Name of list raffles Lambda"
  value       = module.compute.lambda_list_raffles_name
}

output "lambda_list_raffles_arn" {
  description = "ARN of list raffles Lambda"
  value       = module.compute.lambda_list_raffles_arn
}

output "api_gateway_url" {
  description = "API Gateway base URL"
  value       = module.api_gateway.api_gateway_url
}

output "api_endpoint_get_raffles" {
  description = "GET /raffles endpoint"
  value       = module.api_gateway.api_endpoint_get_raffles
}

output "api_endpoint_get_raffle_by_id" {
  description = "GET /raffles/{id} endpoint"
  value       = module.api_gateway.api_endpoint_get_raffle_by_id
}

output "api_endpoint_post_raffles" {
  description = "POST /raffles endpoint"
  value       = module.api_gateway.api_endpoint_post_raffles
}

output "api_endpoint_post_participate" {
  description = "POST /raffles/{id}/participate endpoint"
  value       = module.api_gateway.api_endpoint_post_participate
}

output "api_endpoint_post_close" {
  description = "POST /raffles/{id}/close endpoint"
  value       = module.api_gateway.api_endpoint_post_close
}

output "cloudfront_domain" {
  description = "domino del cloudfront"
  value       = module.front.cloudfront_domain
}