resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.name_prefix}-api-gateway-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${var.name_prefix}-api-gateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn

  depends_on = [aws_iam_role_policy.api_gateway_cloudwatch]
}

resource "aws_cloudwatch_log_group" "public_api_access_logs" {
  name              = "/aws/api-gateway/${var.name_prefix}-public-api-${var.environment}/access-logs"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "authenticated_api_access_logs" {
  name              = "/aws/api-gateway/${var.name_prefix}-authenticated-api-${var.environment}/access-logs"
  retention_in_days = 30

  tags = var.tags
}
