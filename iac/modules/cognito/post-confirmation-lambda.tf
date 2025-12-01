# IAM Role for Post Confirmation Lambda
resource "aws_iam_role" "post_confirmation_lambda_role" {
  name = "${var.name_prefix}-post-confirmation-role"

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
    Name = "${var.name_prefix}-post-confirmation-role"
    Type = "IAM"
  })
}

# Policy to allow adding users to Cognito groups
resource "aws_iam_policy" "post_confirmation_cognito_policy" {
  name = "${var.name_prefix}-post-confirmation-cognito-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminAddUserToGroup"
        ]
        Resource = aws_cognito_user_pool.rafflenow_pool.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "post_confirmation_basic" {
  role       = aws_iam_role.post_confirmation_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "post_confirmation_xray" {
  role       = aws_iam_role.post_confirmation_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

resource "aws_iam_role_policy_attachment" "post_confirmation_cognito" {
  role       = aws_iam_role.post_confirmation_lambda_role.name
  policy_arn = aws_iam_policy.post_confirmation_cognito_policy.arn
}

# Lambda Function
data "archive_file" "post_confirmation_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../../app/lambdas/post-confirmation"
  output_path = "${path.module}/../../../app/lambdas/post-confirmation.zip"
}

resource "aws_lambda_function" "post_confirmation" {
  #checkov:skip=CKV_AWS_115:Cognito trigger, low frequency function
  #checkov:skip=CKV_AWS_116:Cognito trigger Lambda - DLQ not applicable for synchronous Cognito triggers
  #checkov:skip=CKV_AWS_117:Intentionally not in VPC - accesses Cognito via IAM
  #checkov:skip=CKV_AWS_272:Code signing not required for this project
  #checkov:skip=CKV_AWS_173:Using AWS managed encryption for environment variables
  filename         = data.archive_file.post_confirmation_zip.output_path
  function_name    = "${var.name_prefix}-post-confirmation"
  role             = aws_iam_role.post_confirmation_lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.post_confirmation_zip.output_base64sha256
  runtime          = "nodejs22.x"
  timeout          = 5
  memory_size      = 128

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      SERVICE_NAME = "post-confirmation"
      LOG_LEVEL    = "INFO"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-post-confirmation"
    Type = "Lambda"
  })
}

# Permission for Cognito to invoke the Lambda
resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.rafflenow_pool.arn
}
