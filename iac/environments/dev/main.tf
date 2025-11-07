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

module "cdn" {
  source = "../../modules/cdn"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"

  assets_bucket_id                   = module.storage.s3_assets_bucket_id
  assets_bucket_arn                  = module.storage.s3_assets_bucket_arn
  assets_bucket_regional_domain_name = module.storage.s3_assets_bucket_regional_domain_name

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "compute" {
  source      = "../../modules/compute"
  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  dynamodb_table_name              = module.storage.dynamodb_raffles_table_name
  dynamodb_participants_table_name = module.storage.dynamodb_participants_table_name
  sqs_queue_url                    = module.storage.sqs_raffle_winner_queue_url
  sqs_queue_arn                    = module.storage.sqs_raffle_winner_queue_arn
  s3_assets_bucket_arn             = module.storage.s3_assets_bucket_arn
  s3_assets_bucket_name            = module.storage.s3_assets_bucket_id
  cloudfront_url                   = module.cdn.cloudfront_distribution_url

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "cognito" {
  source = "../../modules/cognito"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"

  callback_urls = ["http://localhost:3000/callback", "https://rafflenow.com/callback"]
  logout_urls   = ["http://localhost:3000/logout", "https://rafflenow.com/logout"]

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

  lambda_ingest_participation_arn        = module.compute.lambda_ingest_participation_arn
  lambda_ingest_participation_name       = module.compute.lambda_ingest_participation_name
  lambda_ingest_participation_invoke_arn = module.compute.lambda_ingest_participation_invoke_arn

  lambda_close_raffle_arn        = module.compute.lambda_close_raffle_arn
  lambda_close_raffle_name       = module.compute.lambda_close_raffle_name
  lambda_close_raffle_invoke_arn = module.compute.lambda_close_raffle_invoke_arn

  lambda_get_raffle_arn        = module.compute.lambda_get_raffle_arn
  lambda_get_raffle_name       = module.compute.lambda_get_raffle_name
  lambda_get_raffle_invoke_arn = module.compute.lambda_get_raffle_invoke_arn

  lambda_upload_image_arn        = module.compute.lambda_upload_image_arn
  lambda_upload_image_name       = module.compute.lambda_upload_image_name
  lambda_upload_image_invoke_arn = module.compute.lambda_upload_image_invoke_arn

  cognito_user_pool_arn = module.cognito.user_pool_arn

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "scheduler" {
  source = "../../modules/scheduler"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"

  lambda_check_expired_raffles_arn  = module.compute.lambda_check_expired_raffles_arn
  lambda_check_expired_raffles_name = module.compute.lambda_check_expired_raffles_name

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}
