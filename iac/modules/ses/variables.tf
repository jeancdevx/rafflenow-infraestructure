variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "domain_name" {
  description = "Domain name to verify in SES (e.g., rafflenow.es)"
  type        = string
}

variable "sender_email" {
  description = "Email address to use as sender (must be verified in SES)"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS records"
  type        = string
}

variable "aws_region" {
  description = "AWS region for SES endpoints"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
