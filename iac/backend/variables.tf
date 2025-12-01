variable "aws_region" {
  description = "AWS region for the backend resources"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile to use (for SSO login)"
  type        = string
  default     = "jeancdev"
}
