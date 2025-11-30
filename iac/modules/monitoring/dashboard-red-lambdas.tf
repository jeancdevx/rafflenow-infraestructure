resource "aws_cloudwatch_dashboard" "red_lambdas" {
  dashboard_name = "${var.name_prefix}-red-lambdas"

  dashboard_body = jsonencode({
    widgets = flatten([
      [
        {
          type   = "text"
          x      = 0
          y      = 0
          width  = 24
          height = 1
          properties = {
            markdown = "# RED Metrics - Lambda Functions"
          }
        }
      ],

      [
        {
          type   = "text"
          x      = 0
          y      = 1
          width  = 24
          height = 1
          properties = {
            markdown = "## API Lambdas (Synchronous)"
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 2
          width  = 8
          height = 5
          properties = {
            title   = "list-raffles"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 2
          width  = 8
          height = 5
          properties = {
            title   = "get-raffle"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.get_raffle, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 2
          width  = 8
          height = 5
          properties = {
            title   = "create-raffle"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.create_raffle, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 7
          width  = 8
          height = 5
          properties = {
            title   = "ingest-participation"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 7
          width  = 8
          height = 5
          properties = {
            title   = "close-raffle"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.close_raffle, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 7
          width  = 8
          height = 5
          properties = {
            title   = "upload-image"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.upload_image, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        }
      ],

      [
        {
          type   = "text"
          x      = 0
          y      = 12
          width  = 24
          height = 1
          properties = {
            markdown = "## Background Workers (Asynchronous)"
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 13
          width  = 8
          height = 5
          properties = {
            title   = "participation-process"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.participation_process, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 13
          width  = 8
          height = 5
          properties = {
            title   = "worker-process"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.worker_process, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 13
          width  = 8
          height = 5
          properties = {
            title   = "image-optimizer"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.image_optimizer, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        }
      ],

      [
        {
          type   = "text"
          x      = 0
          y      = 18
          width  = 24
          height = 1
          properties = {
            markdown = "## Scheduled Tasks"
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 19
          width  = 12
          height = 5
          properties = {
            title   = "check-expired-raffles"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.check_expired_raffles, { stat = "Sum", label = "Rate", yAxis = "left" }],
              [".", "Errors", ".", ".", { stat = "Sum", label = "Errors", yAxis = "left", color = "#d62728" }],
              [".", "Duration", ".", ".", { stat = "p95", label = "Duration p95", yAxis = "right" }]
            ]
            period = 60
            yAxis = {
              left  = { min = 0, label = "Count" }
              right = { min = 0, label = "ms" }
            }
          }
        }
      ],

      [
        {
          type   = "text"
          x      = 0
          y      = 24
          width  = 24
          height = 1
          properties = {
            markdown = "## Error Rate Summary"
          }
        },
        {
          type   = "metric"
          x      = 0
          y      = 25
          width  = 12
          height = 6
          properties = {
            title   = "Error Rate by Function (%)"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = false
            metrics = [
              [{ expression = "errors1/invocations1*100", label = "list-raffles", id = "e1" }],
              [{ expression = "errors2/invocations2*100", label = "get-raffle", id = "e2" }],
              [{ expression = "errors3/invocations3*100", label = "ingest-participation", id = "e3" }],
              [{ expression = "errors4/invocations4*100", label = "participation-process", id = "e4" }],
              ["AWS/Lambda", "Errors", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", id = "errors1", visible = false }],
              [".", "Invocations", ".", ".", { stat = "Sum", id = "invocations1", visible = false }],
              [".", "Errors", ".", var.lambda_functions.get_raffle, { stat = "Sum", id = "errors2", visible = false }],
              [".", "Invocations", ".", ".", { stat = "Sum", id = "invocations2", visible = false }],
              [".", "Errors", ".", var.lambda_functions.ingest_participation, { stat = "Sum", id = "errors3", visible = false }],
              [".", "Invocations", ".", ".", { stat = "Sum", id = "invocations3", visible = false }],
              [".", "Errors", ".", var.lambda_functions.participation_process, { stat = "Sum", id = "errors4", visible = false }],
              [".", "Invocations", ".", ".", { stat = "Sum", id = "invocations4", visible = false }]
            ]
            period = 300
            annotations = {
              horizontal = [
                { label = "SLO 1%", value = 1, color = "#ff7f0e" },
                { label = "Critical 5%", value = 5, color = "#d62728" }
              ]
            }
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 25
          width  = 12
          height = 6
          properties = {
            title   = "Cold Starts"
            region  = data.aws_region.current.id
            view    = "timeSeries"
            stacked = true
            metrics = [
              ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_functions.list_raffles, { stat = "Maximum", label = "list-raffles" }],
              ["...", var.lambda_functions.get_raffle, { stat = "Maximum", label = "get-raffle" }],
              ["...", var.lambda_functions.ingest_participation, { stat = "Maximum", label = "ingest-participation" }],
              ["...", var.lambda_functions.participation_process, { stat = "Maximum", label = "participation-process" }]
            ]
            period = 60
          }
        }
      ]
    ])
  })
}
