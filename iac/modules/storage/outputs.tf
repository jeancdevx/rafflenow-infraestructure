output "s3_assets_bucket_name" {
  description = "Name of the assets S3 bucket"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_assets_bucket_arn" {
  description = "ARN of the assets S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "dynamodb_raffles_table_name" {
  description = "Name of the raffles DynamoDB table"
  value       = aws_dynamodb_table.raffles.name
}

output "dynamodb_raffles_table_arn" {
  description = "ARN of the raffles DynamoDB table"
  value       = aws_dynamodb_table.raffles.arn
}
