variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "sender_email" {
  description = "Email address to use as sender (must be verified in SES)"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
