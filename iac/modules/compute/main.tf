resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-lambda-role"
    Type = "IAM"
  })
}

resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name = "${var.name_prefix}-lambda-dynamodb-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}",
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}/index/*",
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_participants_table_name}",
          "arn:aws:dynamodb:*:*:table/${var.dynamodb_participants_table_name}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

resource "aws_iam_policy" "lambda_sqs_policy" {
  name = "${var.name_prefix}-lambda-sqs-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sqs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_sqs_policy.arn
}

data "archive_file" "list_raffles_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/list-raffles"
  output_path = "${path.module}/../../../app/lambdas/list-raffles.zip"
}

resource "aws_lambda_function" "list_raffles" {
  filename         = data.archive_file.list_raffles_zip.output_path
  function_name    = "${var.name_prefix}-list-raffles"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.list_raffles_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-list-raffles"
    Type = "Lambda"
  })
}

data "archive_file" "create_raffle_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/create-raffle"
  output_path = "${path.module}/../../../app/lambdas/create-raffle.zip"
}

resource "aws_lambda_function" "create_raffle" {
  filename         = data.archive_file.create_raffle_zip.output_path
  function_name    = "${var.name_prefix}-create-raffle"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.create_raffle_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-create-raffle"
    Type = "Lambda"
  })
}

# Lambda: ingest-participation
data "archive_file" "ingest_participation_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/ingest-participation"
  output_path = "${path.module}/../../../app/lambdas/ingest-participation.zip"
}

resource "aws_lambda_function" "ingest_participation" {
  filename         = data.archive_file.ingest_participation_zip.output_path
  function_name    = "${var.name_prefix}-ingest-participation"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.ingest_participation_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE      = var.dynamodb_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ingest-participation"
    Type = "Lambda"
  })
}

# Lambda: close-raffle
data "archive_file" "close_raffle_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/close-raffle"
  output_path = "${path.module}/../../../app/lambdas/close-raffle.zip"
}

resource "aws_lambda_function" "close_raffle" {
  filename         = data.archive_file.close_raffle_zip.output_path
  function_name    = "${var.name_prefix}-close-raffle"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.close_raffle_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE = var.dynamodb_table_name
      SQS_QUEUE_URL          = var.sqs_queue_url
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-close-raffle"
    Type = "Lambda"
  })
}

# Lambda: worker-process (Python)
data "archive_file" "worker_process_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/worker-process"
  output_path = "${path.module}/../../../app/lambdas/worker-process.zip"
}

resource "aws_lambda_function" "worker_process" {
  filename         = data.archive_file.worker_process_zip.output_path
  function_name    = "${var.name_prefix}-worker-process"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.worker_process_zip.output_base64sha256
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE      = var.dynamodb_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-worker-process"
    Type = "Lambda"
  })
}

# Lambda: get-raffle
data "archive_file" "get_raffle_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/get-raffle"
  output_path = "${path.module}/../../../app/lambdas/get-raffle.zip"
}

resource "aws_lambda_function" "get_raffle" {
  filename         = data.archive_file.get_raffle_zip.output_path
  function_name    = "${var.name_prefix}-get-raffle"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.get_raffle_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-get-raffle"
    Type = "Lambda"
  })
}

# Lambda: check-expired-raffles
data "archive_file" "check_expired_raffles_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/check-expired-raffles"
  output_path = "${path.module}/../../../app/lambdas/check-expired-raffles.zip"
}

resource "aws_lambda_function" "check_expired_raffles" {
  filename         = data.archive_file.check_expired_raffles_zip.output_path
  function_name    = "${var.name_prefix}-check-expired-raffles"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.check_expired_raffles_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE = var.dynamodb_table_name
      SQS_QUEUE_URL          = var.sqs_queue_url
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-check-expired-raffles"
    Type = "Lambda"
  })
}

# Event source mapping: SQS -> Lambda worker-process
resource "aws_lambda_event_source_mapping" "sqs_to_worker" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.worker_process.arn
  batch_size       = 1
  enabled          = true

  # Configuración de manejo de errores
  function_response_types = ["ReportBatchItemFailures"]
}
