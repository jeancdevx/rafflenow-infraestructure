output "lambda_list_raffles_arn" {
  description = "ARN of the list raffles Lambda function"
  value       = aws_lambda_function.list_raffles.arn
}

output "lambda_list_raffles_name" {
  description = "Name of the list raffles Lambda function"
  value       = aws_lambda_function.list_raffles.function_name
}
