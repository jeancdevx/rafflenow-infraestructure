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

module "api_gateway" {
  source = "../../modules/api-gateway"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  lambda_list_raffles_arn  = module.compute.lambda_list_raffles_arn
  lambda_list_raffles_name = module.compute.lambda_list_raffles_name

  lambda_create_raffle_arn        = module.compute.lambda_create_raffle_arn
  lambda_create_raffle_name       = module.compute.lambda_create_raffle_name
  lambda_create_raffle_invoke_arn = module.compute.lambda_create_raffle_invoke_arn

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}
