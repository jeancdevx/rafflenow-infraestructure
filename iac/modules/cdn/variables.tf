variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "assets_bucket_id" {
  description = "ID of the S3 assets bucket"
  type        = string
}

variable "assets_bucket_arn" {
  description = "ARN of the S3 assets bucket"
  type        = string
}

variable "assets_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 assets bucket"
  type        = string
}
