resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-api-5xx-errors"
  alarm_description   = "API Gateway returning 5xx errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 10
  treat_missing_data  = "notBreaching"

  metric_name = "5XXError"
  namespace   = "AWS/ApiGateway"
  statistic   = "Sum"
  period      = 300

  dimensions = {
    ApiName = var.api_gateway_public_name
    Stage   = var.api_gateway_public_stage
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "api_high_latency" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-api-high-latency"
  alarm_description   = "API Gateway p99 latency exceeds 2 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 2000
  treat_missing_data  = "notBreaching"

  metric_name        = "Latency"
  namespace          = "AWS/ApiGateway"
  extended_statistic = "p99"
  period             = 300

  dimensions = {
    ApiName = var.api_gateway_public_name
    Stage   = var.api_gateway_public_stage
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_ingest_errors" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-lambda-ingest-errors"
  alarm_description   = "Ingest participation Lambda errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_name = "Errors"
  namespace   = "AWS/Lambda"
  statistic   = "Sum"
  period      = 300

  dimensions = {
    FunctionName = var.lambda_functions.ingest_participation
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_worker_errors" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-lambda-worker-errors"
  alarm_description   = "Worker process Lambda errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 3
  treat_missing_data  = "notBreaching"

  metric_name = "Errors"
  namespace   = "AWS/Lambda"
  statistic   = "Sum"
  period      = 300

  dimensions = {
    FunctionName = var.lambda_functions.worker_process
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-lambda-throttles"
  alarm_description   = "Lambda functions being throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "Throttles"
  namespace   = "AWS/Lambda"
  statistic   = "Sum"
  period      = 60

  dimensions = {
    FunctionName = var.lambda_functions.ingest_participation
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles_raffles" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-dynamodb-throttles-raffles"
  alarm_description   = "DynamoDB Raffles table throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "ThrottledRequests"
  namespace   = "AWS/DynamoDB"
  statistic   = "Sum"
  period      = 60

  dimensions = {
    TableName = var.dynamodb_tables.raffles
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles_participations" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-dynamodb-throttles-participations"
  alarm_description   = "DynamoDB Participations table throttled"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "ThrottledRequests"
  namespace   = "AWS/DynamoDB"
  statistic   = "Sum"
  period      = 60

  dimensions = {
    TableName = var.dynamodb_tables.participations
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_participations_not_empty" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-dlq-participations-not-empty"
  alarm_description   = "Participations DLQ has messages - failed operations pending"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateNumberOfMessagesVisible"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 60

  dimensions = {
    QueueName = var.sqs_queues.participations_dlq
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_winner_not_empty" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-dlq-winner-not-empty"
  alarm_description   = "Winner DLQ has messages - failed winner processing"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateNumberOfMessagesVisible"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 60

  dimensions = {
    QueueName = var.sqs_queues.raffle_winner_dlq
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_image_not_empty" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-dlq-image-not-empty"
  alarm_description   = "Image optimizer DLQ has messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateNumberOfMessagesVisible"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 60

  dimensions = {
    QueueName = var.sqs_queues.image_optimizer_dlq
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_message_age_warning" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-sqs-message-age-warning"
  alarm_description   = "Messages waiting too long in participations queue"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 60
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateAgeOfOldestMessage"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 60

  dimensions = {
    QueueName = var.sqs_queues.participations
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_message_age_critical" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-sqs-message-age-critical"
  alarm_description   = "Critical processing delay in participations queue"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 300
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateAgeOfOldestMessage"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 60

  dimensions = {
    QueueName = var.sqs_queues.participations
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth_high" {
  #checkov:skip=CKV_AWS_319:No SNS topics in architecture - alarms are for CloudWatch dashboard monitoring only
  alarm_name          = "${var.name_prefix}-sqs-queue-depth-high"
  alarm_description   = "High number of messages in participations queue"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 1000
  treat_missing_data  = "notBreaching"

  metric_name = "ApproximateNumberOfMessagesVisible"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = 300

  dimensions = {
    QueueName = var.sqs_queues.participations
  }

  tags = var.tags
}
