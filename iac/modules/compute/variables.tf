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

variable "dynamodb_participants_table_name" {
  description = "Name of the DynamoDB table for participants"
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
variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  type        = string
}
variable "cf_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  type        = string
}
