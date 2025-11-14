output "event_bus_name" {
  description = "Name of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.rafflenow.name
}

output "event_bus_arn" {
  description = "ARN of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.rafflenow.arn
}

output "raffle_created_rule_arn" {
  description = "ARN of the raffle.created event rule"
  value       = aws_cloudwatch_event_rule.raffle_created.arn
}

output "raffle_closed_rule_arn" {
  description = "ARN of the raffle.closed event rule"
  value       = aws_cloudwatch_event_rule.raffle_closed.arn
}

output "participation_received_rule_arn" {
  description = "ARN of the participation.received event rule"
  value       = aws_cloudwatch_event_rule.participation_received.arn
}

output "s3_object_created_rule_arn" {
  description = "ARN of the s3.object.created event rule"
  value       = aws_cloudwatch_event_rule.s3_object_created.arn
}

output "eventbridge_sqs_role_arn" {
  description = "ARN of the IAM role for EventBridge to SQS"
  value       = aws_iam_role.eventbridge_sqs_role.arn
}
