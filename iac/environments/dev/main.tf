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

output "bucket_name" {
  description = "The name of the S3 assets bucket"
  value       = module.storage.s3_assets_bucket_name
}

output "table_name" {
  description = "The name of the DynamoDB raffles table"
  value       = module.storage.dynamodb_raffles_table_name
}
