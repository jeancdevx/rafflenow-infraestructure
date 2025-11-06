variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Enviroment name"
  type        = string
  default = "dev"
}

variable "tags" {
  description = "tags to put to all resources"
  type        = map(string)
  default = {
    "name" = "development"
  }
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for assets"
  type        = string
}
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for assets"
  type        = string
}

variable "origin_bucket_policy_in" {
  description = "policy "
  type = string
}
 variable "bucket_regional_domain_name" {
   description = "bucket s3 reegional domain name"
   type = string
 }