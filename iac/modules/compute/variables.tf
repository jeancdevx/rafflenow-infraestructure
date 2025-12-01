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

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for raffles"
  type        = string
}

variable "dynamodb_participations_table_name" {
  description = "Name of the DynamoDB table for participations"
  type        = string
}

variable "dynamodb_winners_table_name" {
  description = "Name of the DynamoDB table for winners"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the SQS queue for winner selection"
  type        = string
}
variable "sqs_queue_arn" {
  description = "ARN of the SQS queue for winner selection"
  type        = string
}

variable "sqs_participations_queue_arn" {
  description = "ARN of the SQS queue for participations processing"
  type        = string
}

variable "sqs_image_optimizer_queue_arn" {
  description = "ARN of the SQS queue for image optimization"
  type        = string
}

variable "s3_assets_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  type        = string
}

variable "s3_assets_bucket_name" {
  description = "Name of the S3 bucket for assets"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for CORS and CloudFront URL (e.g., rafflenow.es)"
  type        = string
  default     = null
}

variable "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name (e.g., d123abc.cloudfront.net). Only needed when domain_name is not set."
  type        = string
  default     = null
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS (includes localhost for development)"
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:3000"]
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  type        = string
}

variable "cognito_client_id" {
  description = "ID of the Cognito User Pool Client"
  type        = string
}

variable "event_bus_name" {
  description = "Name of the EventBridge custom event bus"
  type        = string
}

variable "ses_sender_email" {
  description = "Verified SES sender email address"
  type        = string
}

variable "ses_configuration_set" {
  description = "SES configuration set name"
  type        = string
}

variable "ses_participation_template" {
  description = "SES template name for participation confirmation"
  type        = string
}

variable "ses_winner_template" {
  description = "SES template name for winner notification"
  type        = string
}
