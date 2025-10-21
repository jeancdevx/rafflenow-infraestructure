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
