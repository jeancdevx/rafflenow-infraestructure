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
  web_acl_id                         = module.waf.cloudfront_web_acl_arn

  api_gateway_public_domain        = module.api_gateway.public_api_domain
  api_gateway_public_stage         = module.api_gateway.public_api_stage_name
  api_gateway_authenticated_domain = module.api_gateway.authenticated_api_domain
  api_gateway_authenticated_stage  = module.api_gateway.authenticated_api_stage_name
  origin_verify_header_value       = var.origin_verify_header_value

  domain_name         = var.domain_name
  acm_certificate_arn = module.route53.cloudfront_certificate_arn

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
  domain_name                        = var.domain_name
  cors_allowed_origins               = ["http://localhost:5173", "http://localhost:3000"]
  cognito_user_pool_id               = module.cognito.user_pool_id
  cognito_client_id                  = module.cognito.user_pool_client_id
  event_bus_name                     = module.eventbridge.event_bus_name
  event_bus_arn                      = module.eventbridge.event_bus_arn

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

  domain_name                = var.domain_name
  origin_verify_header_value = var.origin_verify_header_value

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

  name_prefix     = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  domain_name     = var.domain_name
  sender_email    = var.ses_sender_email
  route53_zone_id = module.route53.hosted_zone_id
  aws_region      = var.aws_region

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "waf" {
  source = "../../modules/waf"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  allowed_country_codes         = ["PE"]
  rate_limit_global             = 2000
  rate_limit_participate        = 50
  rate_limit_auth               = 25
  api_gateway_public_arn        = module.api_gateway.public_api_stage_arn
  api_gateway_authenticated_arn = module.api_gateway.authenticated_api_stage_arn
  origin_verify_header_value    = var.origin_verify_header_value

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "monitoring" {
  source = "../../modules/monitoring"

  name_prefix = "rafflenow-${var.environment}-${data.aws_caller_identity.me.account_id}"
  environment = var.environment

  lambda_functions = {
    list_raffles          = module.compute.lambda_list_raffles_name
    get_raffle            = module.compute.lambda_get_raffle_name
    create_raffle         = module.compute.lambda_create_raffle_name
    ingest_participation  = module.compute.lambda_ingest_participation_name
    close_raffle          = module.compute.lambda_close_raffle_name
    upload_image          = module.compute.lambda_upload_image_name
    check_expired_raffles = module.compute.lambda_check_expired_raffles_name
    worker_process        = module.compute.lambda_worker_process_name
    participation_process = module.compute.lambda_participation_process_name
    image_optimizer       = module.compute.lambda_image_optimizer_name
  }

  dynamodb_tables = {
    raffles        = module.storage.dynamodb_raffles_table_name
    participations = module.storage.dynamodb_participations_table_name
    winners        = module.storage.dynamodb_winners_table_name
  }

  sqs_queues = {
    raffle_winner       = module.storage.sqs_raffle_winner_queue_name
    raffle_winner_dlq   = module.storage.sqs_raffle_winner_dlq_name
    participations      = module.storage.sqs_participations_queue_name
    participations_dlq  = module.storage.sqs_participations_dlq_name
    image_optimizer     = module.storage.sqs_image_optimizer_queue_name
    image_optimizer_dlq = module.storage.sqs_image_optimizer_dlq_name
  }

  api_gateway_public_name         = module.api_gateway.public_api_name
  api_gateway_public_stage        = module.api_gateway.public_api_stage_name
  api_gateway_authenticated_name  = module.api_gateway.authenticated_api_name
  api_gateway_authenticated_stage = module.api_gateway.authenticated_api_stage_name

  api_gateway_public_access_logs_name        = module.api_gateway.public_api_access_logs_name
  api_gateway_authenticated_access_logs_name = module.api_gateway.authenticated_api_access_logs_name

  cloudfront_distribution_id = module.cdn.cloudfront_distribution_id
  cognito_user_pool_id       = module.cognito.user_pool_id
  s3_assets_bucket_name      = module.storage.s3_assets_bucket_name

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "route53" {
  source = "../../modules/route53"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name = var.domain_name
  environment = var.environment

  cloudfront_distribution_domain_name = module.cdn.cloudfront_domain_name

  api_gateway_public_id                = module.api_gateway.public_api_id
  api_gateway_public_stage_name        = module.api_gateway.public_api_stage_name
  api_gateway_authenticated_id         = module.api_gateway.authenticated_api_id
  api_gateway_authenticated_stage_name = module.api_gateway.authenticated_api_stage_name

  cognito_domain = module.cognito.user_pool_domain

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}

module "github_oidc" {
  source = "../../modules/github-oidc"

  project_name = "rafflenow"
  github_org   = "jeancdevx"
  github_repo  = "rafflenow-infraestructure"

  tags = {
    Environment = var.environment
    Project     = "RaffleNow"
  }
}
