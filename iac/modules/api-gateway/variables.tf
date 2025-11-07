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

variable "lambda_list_raffles_arn" {
  description = "ARN of the list raffles Lambda function"
  type        = string
}

variable "lambda_list_raffles_name" {
  description = "Name of the list raffles Lambda function"
  type        = string
}

variable "lambda_create_raffle_arn" {
  description = "ARN of the create raffle Lambda function"
  type        = string
}

variable "lambda_create_raffle_name" {
  description = "Name of the create raffle Lambda function"
  type        = string
}

variable "lambda_create_raffle_invoke_arn" {
  description = "Invoke ARN of the create raffle Lambda function"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorization"
  type        = string
}

variable "lambda_ingest_participation_arn" {
  description = "ARN of the ingest participation Lambda function"
  type        = string
}

variable "lambda_ingest_participation_name" {
  description = "Name of the ingest participation Lambda function"
  type        = string
}

variable "lambda_ingest_participation_invoke_arn" {
  description = "Invoke ARN of the ingest participation Lambda function"
  type        = string
}

variable "lambda_close_raffle_arn" {
  description = "ARN of the close raffle Lambda function"
  type        = string
}

variable "lambda_close_raffle_name" {
  description = "Name of the close raffle Lambda function"
  type        = string
}

variable "lambda_close_raffle_invoke_arn" {
  description = "Invoke ARN of the close raffle Lambda function"
  type        = string
}

variable "lambda_get_raffle_arn" {
  description = "ARN of the get raffle Lambda function"
  type        = string
}

variable "lambda_get_raffle_name" {
  description = "Name of the get raffle Lambda function"
  type        = string
}

variable "lambda_get_raffle_invoke_arn" {
  description = "Invoke ARN of the get raffle Lambda function"
  type        = string
}

variable "lambda_upload_image_arn" {
  description = "ARN of the upload image Lambda function"
  type        = string
}

variable "lambda_upload_image_name" {
  description = "Name of the upload image Lambda function"
  type        = string
}

variable "lambda_upload_image_invoke_arn" {
  description = "Invoke ARN of the upload image Lambda function"
  type        = string
}
