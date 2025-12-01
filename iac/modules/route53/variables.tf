variable "domain_name" {
  description = "Primary domain name (e.g., rafflenow.es)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  type        = string
}

variable "cloudfront_distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution (always Z2FDTNDATAQYW2)"
  type        = string
  default     = "Z2FDTNDATAQYW2"
}

variable "api_gateway_public_id" {
  description = "ID of the public API Gateway (kept for compatibility)"
  type        = string
  default     = ""
}

variable "api_gateway_public_stage_name" {
  description = "Stage name of the public API Gateway (kept for compatibility)"
  type        = string
  default     = ""
}

variable "api_gateway_authenticated_id" {
  description = "ID of the authenticated API Gateway (kept for compatibility)"
  type        = string
  default     = ""
}

variable "api_gateway_authenticated_stage_name" {
  description = "Stage name of the authenticated API Gateway (kept for compatibility)"
  type        = string
  default     = ""
}

variable "cognito_domain" {
  description = "Cognito user pool domain (without .auth.region.amazoncognito.com)"
  type        = string
  default     = ""
}

variable "cognito_cloudfront_distribution" {
  description = "CloudFront distribution domain for Cognito hosted UI"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
