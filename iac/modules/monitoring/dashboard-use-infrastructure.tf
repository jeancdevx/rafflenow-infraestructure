resource "aws_cloudwatch_dashboard" "use_infrastructure" {
  dashboard_name = "${var.name_prefix}-use-infrastructure"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# USE Metrics - Infrastructure Resources"
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 1
        width  = 24
        height = 1
        properties = {
          markdown = "## DynamoDB Tables"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "Utilization - Consumed Capacity"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_tables.raffles, { stat = "Sum", label = "Raffles Read" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Raffles Write" }],
            [".", "ConsumedReadCapacityUnits", ".", var.dynamodb_tables.participations, { stat = "Sum", label = "Participations Read" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Participations Write" }],
            [".", "ConsumedReadCapacityUnits", ".", var.dynamodb_tables.winners, { stat = "Sum", label = "Winners Read" }],
            [".", "ConsumedWriteCapacityUnits", ".", ".", { stat = "Sum", label = "Winners Write" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "Saturation - Throttled Requests"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", var.dynamodb_tables.raffles, { stat = "Sum", label = "Raffles" }],
            ["...", var.dynamodb_tables.participations, { stat = "Sum", label = "Participations" }],
            ["...", var.dynamodb_tables.winners, { stat = "Sum", label = "Winners" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 2
        width  = 8
        height = 6
        properties = {
          title   = "Errors - System/User Errors"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/DynamoDB", "SystemErrors", "TableName", var.dynamodb_tables.raffles, { stat = "Sum", label = "Raffles System" }],
            [".", "UserErrors", ".", ".", { stat = "Sum", label = "Raffles User" }],
            [".", "SystemErrors", ".", var.dynamodb_tables.participations, { stat = "Sum", label = "Participations System" }],
            [".", "UserErrors", ".", ".", { stat = "Sum", label = "Participations User" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 8
        width  = 24
        height = 1
        properties = {
          markdown = "## SQS Queues"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 9
        width  = 8
        height = 6
        properties = {
          title   = "Utilization - Messages In Flight"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesNotVisible", "QueueName", var.sqs_queues.participations, { stat = "Average", label = "Participations" }],
            ["...", var.sqs_queues.raffle_winner, { stat = "Average", label = "Winner" }],
            ["...", var.sqs_queues.image_optimizer, { stat = "Average", label = "Image Optimizer" }]
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
          title   = "Saturation - Queue Depth"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_queues.participations, { stat = "Maximum", label = "Participations" }],
            ["...", var.sqs_queues.raffle_winner, { stat = "Maximum", label = "Winner" }],
            ["...", var.sqs_queues.image_optimizer, { stat = "Maximum", label = "Image Optimizer" }]
          ]
          period = 60
          annotations = {
            horizontal = [
              { label = "Warning", value = 100, color = "#ff7f0e" },
              { label = "Critical", value = 1000, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 9
        width  = 8
        height = 6
        properties = {
          title  = "Errors - DLQ Messages"
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
        type   = "metric"
        x      = 0
        y      = 15
        width  = 12
        height = 5
        properties = {
          title   = "Message Age (Processing Lag)"
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
              { label = "SLO 30s", value = 30, color = "#2ca02c" },
              { label = "Warning 60s", value = 60, color = "#ff7f0e" },
              { label = "Critical 300s", value = 300, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 15
        width  = 12
        height = 5
        properties = {
          title   = "Message Throughput"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.sqs_queues.participations, { stat = "Sum", label = "Participations Sent" }],
            [".", "NumberOfMessagesReceived", ".", ".", { stat = "Sum", label = "Participations Received" }],
            [".", "NumberOfMessagesDeleted", ".", ".", { stat = "Sum", label = "Participations Deleted" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 20
        width  = 24
        height = 1
        properties = {
          markdown = "## Lambda Compute"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 21
        width  = 8
        height = 6
        properties = {
          title   = "Utilization - Concurrent Executions"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = true
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_functions.list_raffles, { stat = "Maximum", label = "list-raffles" }],
            ["...", var.lambda_functions.get_raffle, { stat = "Maximum", label = "get-raffle" }],
            ["...", var.lambda_functions.ingest_participation, { stat = "Maximum", label = "ingest-participation" }],
            ["...", var.lambda_functions.participation_process, { stat = "Maximum", label = "participation-process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Maximum", label = "worker-process" }]
          ]
          period = 60
          annotations = {
            horizontal = [
              { label = "Regional Limit", value = 1000, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 21
        width  = 8
        height = 6
        properties = {
          title   = "Saturation - Throttles"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", label = "list-raffles" }],
            ["...", var.lambda_functions.get_raffle, { stat = "Sum", label = "get-raffle" }],
            ["...", var.lambda_functions.ingest_participation, { stat = "Sum", label = "ingest-participation" }],
            ["...", var.lambda_functions.participation_process, { stat = "Sum", label = "participation-process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Sum", label = "worker-process" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 21
        width  = 8
        height = 6
        properties = {
          title   = "Errors - Function Errors"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", label = "list-raffles" }],
            ["...", var.lambda_functions.get_raffle, { stat = "Sum", label = "get-raffle" }],
            ["...", var.lambda_functions.ingest_participation, { stat = "Sum", label = "ingest-participation" }],
            ["...", var.lambda_functions.participation_process, { stat = "Sum", label = "participation-process" }],
            ["...", var.lambda_functions.worker_process, { stat = "Sum", label = "worker-process" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 27
        width  = 24
        height = 1
        properties = {
          markdown = "## API Gateway"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "Utilization - Request Count"
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
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "Saturation - Integration Latency"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "IntegrationLatency", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "p99", label = "Public p99" }],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiName", var.api_gateway_authenticated_name, "Stage", var.api_gateway_authenticated_stage, { stat = "p99", label = "Auth p99" }]
          ]
          period = 60
          annotations = {
            horizontal = [
              { label = "Timeout Warning", value = 25000, color = "#ff7f0e" },
              { label = "Timeout Limit", value = 29000, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "Errors - 4xx/5xx"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Sum", label = "Public 4xx" }],
            [".", "5XXError", ".", ".", ".", ".", { stat = "Sum", label = "Public 5xx" }],
            [".", "4XXError", ".", var.api_gateway_authenticated_name, ".", var.api_gateway_authenticated_stage, { stat = "Sum", label = "Auth 4xx" }],
            [".", "5XXError", ".", ".", ".", ".", { stat = "Sum", label = "Auth 5xx" }]
          ]
          period = 60
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 34
        width  = 24
        height = 1
        properties = {
          markdown = "## CloudFront CDN"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 35
        width  = 8
        height = 6
        properties = {
          title   = "Utilization - Requests"
          region  = "us-east-1"
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Sum", label = "Total Requests" }]
          ]
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 35
        width  = 8
        height = 6
        properties = {
          title   = "Cache Performance"
          region  = "us-east-1"
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Average", label = "Cache Hit Rate" }]
          ]
          period = 300
          annotations = {
            horizontal = [
              { label = "Target 80%", value = 80, color = "#2ca02c" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 35
        width  = 8
        height = 6
        properties = {
          title   = "Errors - Error Rate"
          region  = "us-east-1"
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Average", label = "4xx Rate" }],
            [".", "5xxErrorRate", ".", ".", ".", ".", { stat = "Average", label = "5xx Rate" }]
          ]
          period = 60
        }
      }
    ]
  })
}
