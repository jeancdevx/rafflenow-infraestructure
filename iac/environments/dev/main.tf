terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "6.17.0"
    }
  }

  required_version = ">= 1.2"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "RaffleNow"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "CoddersDev"
    }
  }
}