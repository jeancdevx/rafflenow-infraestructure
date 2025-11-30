data "aws_region" "current" {}

resource "aws_cloudwatch_dashboard" "golden_signals" {
  dashboard_name = "${var.name_prefix}-golden-signals"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# Golden Signals Dashboard - RaffleNow"
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 1
        width  = 24
        height = 1
        properties = {
          markdown = "## LATENCY"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "API Gateway Latency (p50/p90/p99)"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "p50", label = "Public p50" }],
            ["...", { stat = "p90", label = "Public p90" }],
            ["...", { stat = "p99", label = "Public p99" }],
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_authenticated_name, "Stage", var.api_gateway_authenticated_stage, { stat = "p50", label = "Auth p50" }],
            ["...", { stat = "p90", label = "Auth p90" }],
            ["...", { stat = "p99", label = "Auth p99" }]
          ]
          period = 300
          annotations = {
            horizontal = [
              { label = "SLA 500ms", value = 500, color = "#ff7f0e" },
              { label = "SLA 1s", value = 1000, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "Lambda Duration (p95)"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_functions.ingest_participation, { stat = "p95", label = "Ingest Participation" }],
            ["...", var.lambda_functions.participation_process, { stat = "p95", label = "Participation Process" }],
            ["...", var.lambda_functions.worker_process, { stat = "p95", label = "Worker Process" }],
            ["...", var.lambda_functions.get_raffle, { stat = "p95", label = "Get Raffle" }]
          ]
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "DynamoDB Latency"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_tables.raffles, "Operation", "GetItem", { stat = "Average", label = "Raffles GetItem" }],
            ["...", "Query", { stat = "Average", label = "Raffles Query" }],
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_tables.participations, "Operation", "PutItem", { stat = "Average", label = "Participations PutItem" }]
          ]
          period = 300
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 8
        width  = 24
        height = 1
        properties = {
          markdown = "## TRAFFIC"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 9
        width  = 8
        height = 6
        properties = {
          title   = "API Gateway Requests"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Sum", label = "Public API" }],
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_authenticated_name, "Stage", var.api_gateway_authenticated_stage, { stat = "Sum", label = "Auth API" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 9
        width  = 8
        height = 6
        properties = {
          title   = "Lambda Invocations"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = true
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", label = "List Raffles" }],
            ["...", var.lambda_functions.get_raffle, { stat = "Sum", label = "Get Raffle" }],
            ["...", var.lambda_functions.ingest_participation, { stat = "Sum", label = "Ingest Participation" }],
            ["...", var.lambda_functions.participation_process, { stat = "Sum", label = "Participation Process" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 9
        width  = 8
        height = 6
        properties = {
          title   = "SQS Messages"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.sqs_queues.participations, { stat = "Sum", label = "Participations Sent" }],
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", var.sqs_queues.participations, { stat = "Sum", label = "Participations Received" }],
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.sqs_queues.raffle_winner, { stat = "Sum", label = "Winner Sent" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 15
        width  = 24
        height = 1
        properties = {
          markdown = "## ERRORS"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 16
        width  = 6
        height = 6
        properties = {
          title   = "API Gateway 5xx"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Sum", label = "Public 5xx" }],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_authenticated_name, "Stage", var.api_gateway_authenticated_stage, { stat = "Sum", label = "Auth 5xx" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 16
        width  = 6
        height = 6
        properties = {
          title   = "Lambda Errors"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "Ingest" }],
            ["...", var.lambda_functions.participation_process, { stat = "Sum", label = "Process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Sum", label = "Worker" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 16
        width  = 6
        height = 6
        properties = {
          title   = "DynamoDB Throttles"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", var.dynamodb_tables.raffles, { stat = "Sum", label = "Raffles" }],
            ["...", var.dynamodb_tables.participations, { stat = "Sum", label = "Participations" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 16
        width  = 6
        height = 6
        properties = {
          title  = "DLQ Depth (debe ser 0)"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_queues.participations_dlq, { stat = "Maximum", label = "Participations DLQ" }],
            ["...", var.sqs_queues.raffle_winner_dlq, { stat = "Maximum", label = "Winner DLQ" }],
            ["...", var.sqs_queues.image_optimizer_dlq, { stat = "Maximum", label = "Image DLQ" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 22
        width  = 24
        height = 1
        properties = {
          markdown = "## SATURATION"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 23
        width  = 8
        height = 6
        properties = {
          title   = "Lambda Concurrent Executions"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = true
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Maximum", label = "Ingest" }],
            ["...", var.lambda_functions.participation_process, { stat = "Maximum", label = "Process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Maximum", label = "Worker" }]
          ]
          period = 60
          annotations = {
            horizontal = [
              { label = "Account Limit", value = 1000, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 23
        width  = 8
        height = 6
        properties = {
          title   = "Lambda Throttles"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "Ingest" }],
            ["...", var.lambda_functions.participation_process, { stat = "Sum", label = "Process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Sum", label = "Worker" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 23
        width  = 8
        height = 6
        properties = {
          title   = "SQS Message Age (lag)"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", var.sqs_queues.participations, { stat = "Maximum", label = "Participations" }],
            ["...", var.sqs_queues.raffle_winner, { stat = "Maximum", label = "Winner" }],
            ["...", var.sqs_queues.image_optimizer, { stat = "Maximum", label = "Image Optimizer" }]
          ]
          period = 60
          annotations = {
            horizontal = [
              { label = "Warning 60s", value = 60, color = "#ff7f0e" },
              { label = "Critical 300s", value = 300, color = "#d62728" }
            ]
          }
        }
      }
    ]
  })
}
