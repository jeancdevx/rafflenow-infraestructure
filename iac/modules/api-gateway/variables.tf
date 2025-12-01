variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, qa, prod)"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "cloudfront_url" {
  description = "CloudFront distribution URL for CORS configuration"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name for CORS (e.g., rafflenow.es)"
  type        = string
  default     = null
}

variable "origin_verify_header_value" {
  description = "Secret value for X-Origin-Verify header to validate requests come from CloudFront"
  type        = string
  sensitive   = true
  default     = null
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorization"
  type        = string
}

# Data source for current region
data "aws_region" "current" {}

variable "list_raffles_invoke_arn" {
  description = "Invoke ARN of the list raffles Lambda function"
  type        = string
}

variable "get_raffle_invoke_arn" {
  description = "Invoke ARN of the get raffle Lambda function"
  type        = string
}

variable "create_raffle_invoke_arn" {
  description = "Invoke ARN of the create raffle Lambda function"
  type        = string
}

variable "ingest_participation_invoke_arn" {
  description = "Invoke ARN of the ingest participation Lambda function"
  type        = string
}

variable "close_raffle_invoke_arn" {
  description = "Invoke ARN of the close raffle Lambda function"
  type        = string
}

variable "upload_image_invoke_arn" {
  description = "Invoke ARN of the upload image Lambda function"
  type        = string
}

variable "list_raffles_function_name" {
  description = "Name of the list raffles Lambda function"
  type        = string
}

variable "get_raffle_function_name" {
  description = "Name of the get raffle Lambda function"
  type        = string
}

variable "create_raffle_function_name" {
  description = "Name of the create raffle Lambda function"
  type        = string
}

variable "ingest_participation_function_name" {
  description = "Name of the ingest participation Lambda function"
  type        = string
}

variable "close_raffle_function_name" {
  description = "Name of the close raffle Lambda function"
  type        = string
}

variable "upload_image_function_name" {
  description = "Name of the upload image Lambda function"
  type        = string
}
