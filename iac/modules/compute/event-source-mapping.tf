resource "aws_lambda_event_source_mapping" "sqs_to_worker" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.worker_process.arn
  batch_size       = 10
  enabled          = true

  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 10
  }

  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_lambda_event_source_mapping" "sqs_to_participation_process" {
  event_source_arn = var.sqs_participations_queue_arn
  function_name    = aws_lambda_function.participation_process.arn
  batch_size       = 10
  enabled          = true

  maximum_batching_window_in_seconds = 5

  scaling_config {
    maximum_concurrency = 20
  }

  function_response_types = ["ReportBatchItemFailures"]
}
