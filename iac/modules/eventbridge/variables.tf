variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "sqs_participations_queue_arn" {
  description = "ARN of the SQS Participations Queue"
  type        = string
}

variable "sqs_participations_queue_url" {
  description = "URL of the SQS Participations Queue"
  type        = string
}

variable "sqs_winners_queue_arn" {
  description = "ARN of the SQS Winners Queue"
  type        = string
}

variable "sqs_winners_queue_url" {
  description = "URL of the SQS Winners Queue"
  type        = string
}

variable "sqs_image_optimizer_queue_arn" {
  description = "ARN of the SQS Image Optimizer Queue"
  type        = string
}

variable "sqs_image_optimizer_queue_url" {
  description = "URL of the SQS Image Optimizer Queue"
  type        = string
}

variable "s3_assets_bucket_name" {
  description = "Name of the S3 assets bucket"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
