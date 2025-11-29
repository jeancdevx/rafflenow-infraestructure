terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.17.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "3.2"
    }
  }

  required_version = ">= 1.2"
}
