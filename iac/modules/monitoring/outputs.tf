output "golden_signals_dashboard_name" {
  description = "Name of the Golden Signals dashboard"
  value       = aws_cloudwatch_dashboard.golden_signals.dashboard_name
}

output "red_lambdas_dashboard_name" {
  description = "Name of the RED Lambdas dashboard"
  value       = aws_cloudwatch_dashboard.red_lambdas.dashboard_name
}

output "use_infrastructure_dashboard_name" {
  description = "Name of the USE Infrastructure dashboard"
  value       = aws_cloudwatch_dashboard.use_infrastructure.dashboard_name
}

output "executive_dashboard_name" {
  description = "Name of the Executive dashboard"
  value       = aws_cloudwatch_dashboard.executive.dashboard_name
}

output "dashboard_names" {
  description = "Map of all dashboard names"
  value = {
    golden_signals     = aws_cloudwatch_dashboard.golden_signals.dashboard_name
    red_lambdas        = aws_cloudwatch_dashboard.red_lambdas.dashboard_name
    use_infrastructure = aws_cloudwatch_dashboard.use_infrastructure.dashboard_name
    executive          = aws_cloudwatch_dashboard.executive.dashboard_name
  }
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = {
    api_5xx_errors                    = aws_cloudwatch_metric_alarm.api_5xx_errors.arn
    api_high_latency                  = aws_cloudwatch_metric_alarm.api_high_latency.arn
    lambda_ingest_errors              = aws_cloudwatch_metric_alarm.lambda_ingest_errors.arn
    lambda_worker_errors              = aws_cloudwatch_metric_alarm.lambda_worker_errors.arn
    lambda_throttles                  = aws_cloudwatch_metric_alarm.lambda_throttles.arn
    dynamodb_throttles_raffles        = aws_cloudwatch_metric_alarm.dynamodb_throttles_raffles.arn
    dynamodb_throttles_participations = aws_cloudwatch_metric_alarm.dynamodb_throttles_participations.arn
    dlq_participations_not_empty      = aws_cloudwatch_metric_alarm.dlq_participations_not_empty.arn
    dlq_winner_not_empty              = aws_cloudwatch_metric_alarm.dlq_winner_not_empty.arn
    dlq_image_not_empty               = aws_cloudwatch_metric_alarm.dlq_image_not_empty.arn
    sqs_message_age_warning           = aws_cloudwatch_metric_alarm.sqs_message_age_warning.arn
    sqs_message_age_critical          = aws_cloudwatch_metric_alarm.sqs_message_age_critical.arn
    sqs_queue_depth_high              = aws_cloudwatch_metric_alarm.sqs_queue_depth_high.arn
  }
}
