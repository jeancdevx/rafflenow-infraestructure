variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "lambda_check_expired_raffles_arn" {
  description = "ARN of the check-expired-raffles Lambda function"
  type        = string
}

variable "lambda_check_expired_raffles_name" {
  description = "Name of the check-expired-raffles Lambda function"
  type        = string
}
