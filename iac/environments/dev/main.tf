data "aws_caller_identity" "me" {}

module "storage" {
  source      = "../../modules/storage"
  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "compute" {
  source      = "../../modules/compute"
  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  dynamodb_table_name = module.storage.dynamodb_raffles_table_name

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}
