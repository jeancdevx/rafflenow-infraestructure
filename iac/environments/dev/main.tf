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

  dynamodb_table_name                = module.storage.dynamodb_raffles_table_name
  dynamodb_participations_table_name = module.storage.dynamodb_participations_table_name
  dynamodb_winners_table_name        = module.storage.dynamodb_winners_table_name
  sqs_queue_url                      = module.storage.sqs_raffle_winner_queue_url
  sqs_queue_arn                      = module.storage.sqs_raffle_winner_queue_arn
  sqs_participations_queue_arn       = module.storage.sqs_participations_queue_arn
  sqs_image_optimizer_queue_arn      = module.storage.sqs_image_optimizer_queue_arn
  s3_assets_bucket_arn               = module.storage.s3_assets_bucket_arn
  s3_assets_bucket_name              = module.storage.s3_assets_bucket_id
  cloudfront_url                     = module.cdn.cloudfront_distribution_url
  cognito_user_pool_id               = module.cognito.user_pool_id
  cognito_client_id                  = module.cognito.user_pool_client_id
  event_bus_name                     = module.eventbridge.event_bus_name

  ses_sender_email           = module.ses.sender_email
  ses_configuration_set      = module.ses.configuration_set_name
  ses_participation_template = module.ses.participation_template_name
  ses_winner_template        = module.ses.winner_template_name

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

  list_raffles_invoke_arn         = module.compute.lambda_list_raffles_invoke_arn
  get_raffle_invoke_arn           = module.compute.lambda_get_raffle_invoke_arn
  create_raffle_invoke_arn        = module.compute.lambda_create_raffle_invoke_arn
  ingest_participation_invoke_arn = module.compute.lambda_ingest_participation_invoke_arn
  close_raffle_invoke_arn         = module.compute.lambda_close_raffle_invoke_arn
  upload_image_invoke_arn         = module.compute.lambda_upload_image_invoke_arn

  list_raffles_function_name         = module.compute.lambda_list_raffles_name
  get_raffle_function_name           = module.compute.lambda_get_raffle_name
  create_raffle_function_name        = module.compute.lambda_create_raffle_name
  ingest_participation_function_name = module.compute.lambda_ingest_participation_name
  close_raffle_function_name         = module.compute.lambda_close_raffle_name
  upload_image_function_name         = module.compute.lambda_upload_image_name

  cognito_user_pool_arn = module.cognito.user_pool_arn

  cloudfront_url = module.cdn.cloudfront_distribution_url

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

module "eventbridge" {
  source = "../../modules/eventbridge"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"

  sqs_winners_queue_arn         = module.storage.sqs_raffle_winner_queue_arn
  sqs_winners_queue_url         = module.storage.sqs_raffle_winner_queue_url
  sqs_participations_queue_arn  = module.storage.sqs_participations_queue_arn
  sqs_participations_queue_url  = module.storage.sqs_participations_queue_url
  sqs_image_optimizer_queue_arn = module.storage.sqs_image_optimizer_queue_arn
  sqs_image_optimizer_queue_url = module.storage.sqs_image_optimizer_queue_url
  s3_assets_bucket_name         = module.storage.s3_assets_bucket_name

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "ses" {
  source = "../../modules/ses"

  name_prefix  = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  sender_email = var.ses_sender_email

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}
