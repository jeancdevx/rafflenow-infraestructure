terraform {
  required_version = ">= 1.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.17.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = "shared"
      Project     = "RaffleNow"
      ManagedBy   = "Terraform"
      Component   = "Backend"
    }
  }
}
