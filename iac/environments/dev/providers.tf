variable "region" {
  description = "Region de aws"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  description = "AWS profile to use (leave null for CI/CD with OIDC)"
  type        = string
  default     = null
}

variable "env" {
  type    = string
  default = "dev"
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}
