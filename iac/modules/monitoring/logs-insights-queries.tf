locals {
  lambda_log_groups = [
    "/aws/lambda/${var.lambda_functions.ingest_participation}",
    "/aws/lambda/${var.lambda_functions.participation_process}",
    "/aws/lambda/${var.lambda_functions.create_raffle}",
    "/aws/lambda/${var.lambda_functions.close_raffle}",
    "/aws/lambda/${var.lambda_functions.check_expired_raffles}",
    "/aws/lambda/${var.lambda_functions.worker_process}",
    "/aws/lambda/${var.lambda_functions.get_raffle}",
    "/aws/lambda/${var.lambda_functions.list_raffles}",
    "/aws/lambda/${var.lambda_functions.upload_image}"
  ]

  participation_log_groups = [
    "/aws/lambda/${var.lambda_functions.ingest_participation}",
    "/aws/lambda/${var.lambda_functions.participation_process}"
  ]

  worker_log_group = "/aws/lambda/${var.lambda_functions.worker_process}"
}

resource "aws_cloudwatch_query_definition" "trace_by_correlation_id" {
  name = "${var.name_prefix}/Trazabilidad-Participacion"

  log_group_names = local.participation_log_groups

  query_string = <<-EOT
    fields @timestamp, @message, correlation_id, action, raffle_id, participant_email, error_code
    | filter correlation_id like /CORRELATION_ID_AQUI/
    | sort @timestamp asc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "errors_by_code" {
  name = "${var.name_prefix}/Errores-Por-Codigo"

  log_group_names = local.lambda_log_groups

  query_string = <<-EOT
    fields @timestamp, error_code, @message, service
    | filter level = "ERROR" or level = "WARN"
    | filter ispresent(error_code)
    | stats count(*) as total by error_code, service
    | sort total desc
    | limit 50
  EOT
}

resource "aws_cloudwatch_query_definition" "failed_raffles" {
  name = "${var.name_prefix}/Sorteos-Fallidos-CRITICO"

  log_group_names = [
    "/aws/lambda/${var.lambda_functions.worker_process}",
    "/aws/lambda/${var.lambda_functions.check_expired_raffles}"
  ]

  query_string = <<-EOT
    fields @timestamp, raffle_id, raffle_title, action, error_code, @message
    | filter action = "RAFFLE_FAILED" or error_code = "NO_PARTICIPANTS" or error_code = "RAFFLE_CLOSE_ERROR"
    | sort @timestamp desc
    | limit 100
  EOT
}

resource "aws_cloudwatch_query_definition" "worker_latency" {
  name = "${var.name_prefix}/Latencia-Seleccion-Ganador"

  log_group_names = [local.worker_log_group]

  query_string = <<-EOT
    fields @timestamp, @duration, raffle_id, action
    | filter action = "WINNER_SELECTED" or action = "RAFFLE_COMPLETED"
    | stats avg(@duration) as avg_ms, max(@duration) as max_ms, pct(@duration, 95) as p95_ms, count(*) as total by bin(1h)
    | sort @timestamp desc
    | limit 24
  EOT
}
