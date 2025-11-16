# Lambda: list-raffles
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
  timeout          = 5
  memory_size      = 256

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

# Lambda: create-raffle
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
  timeout          = 5
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
      EVENT_BUS_NAME = var.event_bus_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-create-raffle"
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
  timeout          = 5
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE              = var.dynamodb_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
      COGNITO_USER_POOL_ID        = var.cognito_user_pool_id
      COGNITO_CLIENT_ID           = var.cognito_client_id
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-get-raffle"
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
  timeout          = 5
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE      = var.dynamodb_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
      EVENT_BUS_NAME              = var.event_bus_name
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
  memory_size      = 256

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE = var.dynamodb_table_name
      SQS_QUEUE_URL          = var.sqs_queue_url
      EVENT_BUS_NAME         = var.event_bus_name
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
  memory_size      = 1024

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
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE = var.dynamodb_table_name
      SQS_QUEUE_URL          = var.sqs_queue_url
      EVENT_BUS_NAME         = var.event_bus_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-check-expired-raffles"
    Type = "Lambda"
  })
}

# Lambda: upload-image
data "archive_file" "upload_image_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/upload-image"
  output_path = "${path.module}/../../../app/lambdas/upload-image.zip"
}

resource "aws_lambda_function" "upload_image" {
  filename         = data.archive_file.upload_image_zip.output_path
  function_name    = "${var.name_prefix}-upload-image"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.upload_image_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      S3_BUCKET_NAME = var.s3_assets_bucket_name
      CLOUDFRONT_URL = var.cloudfront_url
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-upload-image"
    Type = "Lambda"
  })
}

# Lambda: participation-process
data "archive_file" "participation_process_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/participation-process"
  output_path = "${path.module}/../../../app/lambdas/participation-process.zip"
}

resource "aws_lambda_function" "participation_process" {
  filename         = data.archive_file.participation_process_zip.output_path
  function_name    = "${var.name_prefix}-participation-process"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.participation_process_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_RAFFLES_TABLE      = var.dynamodb_table_name
      DYNAMODB_PARTICIPANTS_TABLE = var.dynamodb_participants_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-participation-process"
    Type = "Lambda"
  })
}

# Lambda: image-optimizer
data "archive_file" "image_optimizer_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/image-optimizer"
  output_path = "${path.module}/../../../app/lambdas/image-optimizer.zip"
}

resource "aws_lambda_function" "image_optimizer" {
  filename         = data.archive_file.image_optimizer_zip.output_path
  function_name    = "${var.name_prefix}-image-optimizer"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_optimizer_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 60
  memory_size      = 2048

  environment {
    variables = {
      S3_BUCKET_NAME = var.s3_assets_bucket_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-image-optimizer"
    Type = "Lambda"
  })
}
