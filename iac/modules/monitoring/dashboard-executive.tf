resource "aws_cloudwatch_dashboard" "executive" {
  dashboard_name = "${var.name_prefix}-executive"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# RaffleNow - Panel Ejecutivo"
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 1
        width  = 24
        height = 1
        properties = {
          markdown = "## Estado del Servicio"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 2
        width  = 6
        height = 4
        properties = {
          title  = "Disponibilidad del Servicio"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            [{ expression = "(1-(errors/total))*100", label = "%", id = "availability" }],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Sum", id = "errors", visible = false }],
            [".", "Count", ".", ".", ".", ".", { stat = "Sum", id = "total", visible = false }]
          ]
          period = 86400
          annotations = {
            horizontal = [
              { label = "Objetivo 99.9%", value = 99.9, color = "#2ca02c" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 2
        width  = 6
        height = 4
        properties = {
          title  = "Velocidad de Carga (segundos)"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            [{ expression = "latency/1000", label = "seg", id = "seconds" }],
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Average", id = "latency", visible = false }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 2
        width  = 6
        height = 4
        properties = {
          title  = "Errores del Sistema"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "Sum", label = "errores" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 2
        width  = 6
        height = 4
        properties = {
          title  = "Operaciones Fallidas Pendientes"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            [{ expression = "dlq1+dlq2+dlq3", label = "pendientes", id = "total_dlq" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_queues.participations_dlq, { stat = "Maximum", id = "dlq1", visible = false }],
            ["...", var.sqs_queues.raffle_winner_dlq, { stat = "Maximum", id = "dlq2", visible = false }],
            ["...", var.sqs_queues.image_optimizer_dlq, { stat = "Maximum", id = "dlq3", visible = false }]
          ]
          period = 86400
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 6
        width  = 24
        height = 1
        properties = {
          markdown = "## Actividad de Hoy"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 6
        height = 5
        properties = {
          title  = "Sorteos Consultados"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            [{ expression = "list_views + detail_views", label = "consultas", id = "total_views" }],
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", id = "list_views", visible = false }],
            ["...", var.lambda_functions.get_raffle, { stat = "Sum", id = "detail_views", visible = false }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 7
        width  = 6
        height = 5
        properties = {
          title  = "Participaciones Registradas"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "participaciones" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 7
        width  = 6
        height = 5
        properties = {
          title  = "Sorteos Creados"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.create_raffle, { stat = "Sum", label = "nuevos" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 7
        width  = 6
        height = 5
        properties = {
          title  = "Sorteos Cerrados"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.close_raffle, { stat = "Sum", label = "cerrados" }]
          ]
          period = 86400
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 12
        width  = 24
        height = 1
        properties = {
          markdown = "## Embudo de Conversion"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 13
        width  = 8
        height = 5
        properties = {
          title  = "1. Visitas a Sorteos"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.get_raffle, { stat = "Sum", label = "vistas" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 13
        width  = 8
        height = 5
        properties = {
          title  = "2. Intentos de Participacion"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "intentos" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 13
        width  = 8
        height = 5
        properties = {
          title  = "3. Ganadores Procesados"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.worker_process, { stat = "Sum", label = "ganadores" }]
          ]
          period = 86400
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 18
        width  = 24
        height = 1
        properties = {
          markdown = "## Tendencia Semanal"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 19
        width  = 12
        height = 6
        properties = {
          title   = "Participaciones por Dia"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", label = "Participaciones" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 19
        width  = 12
        height = 6
        properties = {
          title   = "Consultas por Dia"
          region  = data.aws_region.current.id
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.list_raffles, { stat = "Sum", label = "Listados" }],
            ["...", var.lambda_functions.get_raffle, { stat = "Sum", label = "Detalles" }]
          ]
          period = 86400
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 25
        width  = 24
        height = 1
        properties = {
          markdown = "## Experiencia del Usuario"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 26
        width  = 8
        height = 5
        properties = {
          title  = "Tiempo de Respuesta Tipico"
          region = data.aws_region.current.id
          view   = "gauge"
          metrics = [
            [{ expression = "latency/1000", label = "segundos", id = "seconds" }],
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_public_name, "Stage", var.api_gateway_public_stage, { stat = "p50", id = "latency", visible = false }]
          ]
          period = 3600
          yAxis = {
            left = { min = 0, max = 2 }
          }
          annotations = {
            horizontal = [
              { label = "Excelente", value = 0.5, color = "#2ca02c" },
              { label = "Aceptable", value = 1, color = "#ff7f0e" },
              { label = "Lento", value = 1.5, color = "#d62728" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 26
        width  = 8
        height = 5
        properties = {
          title  = "Tasa de Exito de Participaciones"
          region = data.aws_region.current.id
          view   = "gauge"
          metrics = [
            [{ expression = "(1-(errors/total))*100", label = "%", id = "success_rate" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_functions.ingest_participation, { stat = "Sum", id = "errors", visible = false }],
            [".", "Invocations", ".", ".", { stat = "Sum", id = "total", visible = false }]
          ]
          period = 86400
          yAxis = {
            left = { min = 95, max = 100 }
          }
          annotations = {
            horizontal = [
              { label = "Objetivo 99%", value = 99, color = "#2ca02c" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 26
        width  = 8
        height = 5
        properties = {
          title  = "Tiempo de Procesamiento"
          region = data.aws_region.current.id
          view   = "gauge"
          metrics = [
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", var.sqs_queues.participations, { stat = "Average", label = "segundos" }]
          ]
          period = 3600
          yAxis = {
            left = { min = 0, max = 60 }
          }
          annotations = {
            horizontal = [
              { label = "Inmediato", value = 10, color = "#2ca02c" },
              { label = "Normal", value = 30, color = "#ff7f0e" },
              { label = "Demora", value = 45, color = "#d62728" }
            ]
          }
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 31
        width  = 24
        height = 1
        properties = {
          markdown = "## Resumen de Contenido"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 32
        width  = 12
        height = 5
        properties = {
          title  = "Imagenes Subidas Hoy"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.upload_image, { stat = "Sum", label = "imagenes" }]
          ]
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 32
        width  = 12
        height = 5
        properties = {
          title  = "Imagenes Optimizadas"
          region = data.aws_region.current.id
          view   = "singleValue"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_functions.image_optimizer, { stat = "Sum", label = "procesadas" }]
          ]
          period = 86400
        }
      }
    ]
  })
}
