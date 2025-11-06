output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.rafflenow_pool.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.rafflenow_pool.arn
}

output "user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.rafflenow_client.id
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.rafflenow_pool.endpoint
}

output "user_pool_domain" {
  description = "Domain prefix for Cognito Hosted UI"
  value       = aws_cognito_user_pool_domain.rafflenow_domain.domain
}

output "admin_group_name" {
  description = "Name of the Admin group"
  value       = aws_cognito_user_group.admin.name
}

output "user_group_name" {
  description = "Name of the User group"
  value       = aws_cognito_user_group.user.name
}
