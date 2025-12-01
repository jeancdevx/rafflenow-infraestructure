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

variable "web_acl_id" {
  description = "WAF WebACL ID to associate with CloudFront distribution"
  type        = string
  default     = null
}

# API Gateway Origins
variable "api_gateway_public_domain" {
  description = "Domain name of the Public API Gateway (e.g., abc123.execute-api.us-east-2.amazonaws.com)"
  type        = string
}

variable "api_gateway_public_stage" {
  description = "Stage name of the Public API Gateway"
  type        = string
}

variable "api_gateway_authenticated_domain" {
  description = "Domain name of the Authenticated API Gateway"
  type        = string
}

variable "api_gateway_authenticated_stage" {
  description = "Stage name of the Authenticated API Gateway"
  type        = string
}

variable "origin_verify_header_value" {
  description = "Secret value for X-Origin-Verify header to validate requests come from CloudFront"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name for CloudFront (e.g., rafflenow.es)"
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 for CloudFront"
  type        = string
  default     = null
}
