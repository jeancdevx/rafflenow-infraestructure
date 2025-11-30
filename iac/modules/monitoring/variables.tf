variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "lambda_functions" {
  description = "Map of Lambda function names for monitoring"
  type = object({
    list_raffles          = string
    get_raffle            = string
    create_raffle         = string
    ingest_participation  = string
    participation_process = string
    close_raffle          = string
    check_expired_raffles = string
    worker_process        = string
    upload_image          = string
    image_optimizer       = string
  })
}

variable "dynamodb_tables" {
  description = "Map of DynamoDB table names for monitoring"
  type = object({
    raffles        = string
    participations = string
    winners        = string
  })
}

variable "sqs_queues" {
  description = "Map of SQS queue names for monitoring"
  type = object({
    participations      = string
    participations_dlq  = string
    raffle_winner       = string
    raffle_winner_dlq   = string
    image_optimizer     = string
    image_optimizer_dlq = string
  })
}

variable "api_gateway_public_name" {
  description = "Name of the public API Gateway"
  type        = string
}

variable "api_gateway_authenticated_name" {
  description = "Name of the authenticated API Gateway"
  type        = string
}

variable "api_gateway_public_stage" {
  description = "Stage name for public API Gateway"
  type        = string
  default     = "dev"
}

variable "api_gateway_authenticated_stage" {
  description = "Stage name for authenticated API Gateway"
  type        = string
  default     = "dev"
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "s3_assets_bucket_name" {
  description = "Name of the S3 assets bucket"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
