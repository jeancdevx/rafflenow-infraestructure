variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, qa, prod)"
  type        = string
}

variable "allowed_country_codes" {
  description = "List of allowed country codes (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = ["PE"]
}

variable "rate_limit_global" {
  description = "Global rate limit per IP (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "rate_limit_participate" {
  description = "Rate limit for participate endpoint per IP (requests per 5 minutes)"
  type        = number
  default     = 50
}

variable "rate_limit_auth" {
  description = "Rate limit for auth endpoints per IP (requests per 5 minutes)"
  type        = number
  default     = 25
}

variable "api_gateway_public_arn" {
  description = "ARN of the public API Gateway stage"
  type        = string
}

variable "api_gateway_authenticated_arn" {
  description = "ARN of the authenticated API Gateway stage"
  type        = string
}

variable "origin_verify_header_value" {
  description = "Secret value for X-Origin-Verify header to validate requests come from CloudFront"
  type        = string
  sensitive   = true
  default     = null
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
