output "s3_assets_bucket_name" {
  description = "Name of the assets S3 bucket"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_assets_bucket_arn" {
  description = "ARN of the assets S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "s3_assets_bucket_id" {
  description = "ID of the assets S3 bucket"
  value       = aws_s3_bucket.assets.id
}

output "s3_assets_bucket_regional_domain_name" {
  description = "Regional domain name of the assets S3 bucket"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "dynamodb_raffles_table_name" {
  description = "Name of the raffles DynamoDB table"
  value       = aws_dynamodb_table.raffles.name
}

output "dynamodb_raffles_table_arn" {
  description = "ARN of the raffles DynamoDB table"
  value       = aws_dynamodb_table.raffles.arn
}

output "dynamodb_participations_table_name" {
  description = "Name of the participations DynamoDB table"
  value       = aws_dynamodb_table.participations.name
}

output "dynamodb_participations_table_arn" {
  description = "ARN of the participations DynamoDB table"
  value       = aws_dynamodb_table.participations.arn
}

output "dynamodb_winners_table_name" {
  description = "Name of the winners DynamoDB table"
  value       = aws_dynamodb_table.winners.name
}

output "dynamodb_winners_table_arn" {
  description = "ARN of the winners DynamoDB table"
  value       = aws_dynamodb_table.winners.arn
}

output "sqs_raffle_winner_queue_url" {
  description = "URL of the raffle winner SQS queue"
  value       = aws_sqs_queue.raffle_winner_queue.url
}

output "sqs_raffle_winner_queue_arn" {
  description = "ARN of the raffle winner SQS queue"
  value       = aws_sqs_queue.raffle_winner_queue.arn
}

output "sqs_raffle_winner_dlq_url" {
  description = "URL of the raffle winner DLQ"
  value       = aws_sqs_queue.raffle_winner_dlq.url
}

output "sqs_raffle_winner_dlq_arn" {
  description = "ARN of the raffle winner DLQ"
  value       = aws_sqs_queue.raffle_winner_dlq.arn
}

output "sqs_participations_queue_url" {
  description = "URL of the participations SQS queue"
  value       = aws_sqs_queue.participations_queue.url
}

output "sqs_participations_queue_arn" {
  description = "ARN of the participations SQS queue"
  value       = aws_sqs_queue.participations_queue.arn
}

output "sqs_participations_dlq_url" {
  description = "URL of the participations DLQ"
  value       = aws_sqs_queue.participations_dlq.url
}

output "sqs_participations_dlq_arn" {
  description = "ARN of the participations DLQ"
  value       = aws_sqs_queue.participations_dlq.arn
}

output "sqs_image_optimizer_queue_url" {
  description = "URL of the image optimizer SQS queue"
  value       = aws_sqs_queue.image_optimizer_queue.url
}

output "sqs_image_optimizer_queue_arn" {
  description = "ARN of the image optimizer SQS queue"
  value       = aws_sqs_queue.image_optimizer_queue.arn
}

output "sqs_image_optimizer_dlq_url" {
  description = "URL of the image optimizer DLQ"
  value       = aws_sqs_queue.image_optimizer_dlq.url
}

output "sqs_image_optimizer_dlq_arn" {
  description = "ARN of the image optimizer DLQ"
  value       = aws_sqs_queue.image_optimizer_dlq.arn
}
