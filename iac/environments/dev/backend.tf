terraform {
  backend "s3" {
    bucket       = "rafflenow-terraform-state-422228629090"
    key          = "dev/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
    profile      = "jeancdev"
  }
}
