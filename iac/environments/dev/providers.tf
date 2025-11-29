variable "region" {
  description = "Region de aws"
  type        = string
  default     = "us-east-2"
}

variable "aws_profile" {
  type    = string
  default = "default"
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
