output "lambda_list_raffles_arn" {
  description = "ARN of the list raffles Lambda function"
  value       = aws_lambda_function.list_raffles.arn
}

output "lambda_list_raffles_name" {
  description = "Name of the list raffles Lambda function"
  value       = aws_lambda_function.list_raffles.function_name
}

output "lambda_create_raffle_arn" {
  description = "ARN of the create raffle Lambda function"
  value       = aws_lambda_function.create_raffle.arn
}

output "lambda_create_raffle_name" {
  description = "Name of the create raffle Lambda function"
  value       = aws_lambda_function.create_raffle.function_name
}

output "lambda_create_raffle_invoke_arn" {
  description = "Invoke ARN of the create raffle Lambda function"
  value       = aws_lambda_function.create_raffle.invoke_arn
}

output "lambda_ingest_participation_arn" {
  description = "ARN of the ingest participation Lambda function"
  value       = aws_lambda_function.ingest_participation.arn
}

output "lambda_ingest_participation_name" {
  description = "Name of the ingest participation Lambda function"
  value       = aws_lambda_function.ingest_participation.function_name
}

output "lambda_ingest_participation_invoke_arn" {
  description = "Invoke ARN of the ingest participation Lambda function"
  value       = aws_lambda_function.ingest_participation.invoke_arn
}

output "lambda_close_raffle_arn" {
  description = "ARN of the close raffle Lambda function"
  value       = aws_lambda_function.close_raffle.arn
}

output "lambda_close_raffle_name" {
  description = "Name of the close raffle Lambda function"
  value       = aws_lambda_function.close_raffle.function_name
}

output "lambda_close_raffle_invoke_arn" {
  description = "Invoke ARN of the close raffle Lambda function"
  value       = aws_lambda_function.close_raffle.invoke_arn
}

output "lambda_get_raffle_arn" {
  description = "ARN of the get raffle Lambda function"
  value       = aws_lambda_function.get_raffle.arn
}

output "lambda_get_raffle_name" {
  description = "Name of the get raffle Lambda function"
  value       = aws_lambda_function.get_raffle.function_name
}

output "lambda_get_raffle_invoke_arn" {
  description = "Invoke ARN of the get raffle Lambda function"
  value       = aws_lambda_function.get_raffle.invoke_arn
}

output "lambda_check_expired_raffles_arn" {
  description = "ARN of the check expired raffles Lambda function"
  value       = aws_lambda_function.check_expired_raffles.arn
}

output "lambda_check_expired_raffles_name" {
  description = "Name of the check expired raffles Lambda function"
  value       = aws_lambda_function.check_expired_raffles.function_name
}

output "lambda_worker_process_arn" {
  description = "ARN of the worker process Lambda function"
  value       = aws_lambda_function.worker_process.arn
}

output "lambda_worker_process_name" {
  description = "Name of the worker process Lambda function"
  value       = aws_lambda_function.worker_process.function_name
}
output "origin_bucket_policy" {
  description = "politica para cloudfront acceder al bucket s3"
  value = data.aws_iam_policy_document.origin_bucket_policy.json
}
