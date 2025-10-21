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
          "dynamodb:Query"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/${var.dynamodb_table_name}"
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
