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
