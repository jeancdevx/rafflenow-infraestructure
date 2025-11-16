resource "aws_lambda_event_source_mapping" "sqs_to_worker" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.worker_process.arn
  batch_size       = 1
  enabled          = true

  maximum_batching_window_in_seconds = 0

  scaling_config {
    maximum_concurrency = 10
  }

  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_lambda_event_source_mapping" "sqs_to_participation_process" {
  event_source_arn = var.sqs_participations_queue_arn
  function_name    = aws_lambda_function.participation_process.arn
  batch_size       = 100
  enabled          = true

  maximum_batching_window_in_seconds = 1

  scaling_config {
    maximum_concurrency = 50
  }

  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_lambda_event_source_mapping" "sqs_to_image_optimizer" {
  event_source_arn = var.sqs_image_optimizer_queue_arn
  function_name    = aws_lambda_function.image_optimizer.arn
  batch_size       = 1
  enabled          = true

  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 5
  }

  function_response_types = ["ReportBatchItemFailures"]
}
