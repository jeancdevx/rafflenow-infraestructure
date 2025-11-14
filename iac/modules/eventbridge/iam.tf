resource "aws_iam_role" "eventbridge_sqs_role" {
  name = "${var.name_prefix}-eventbridge-sqs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eventbridge-sqs-role"
    Type = "IAM"
  })
}

resource "aws_iam_policy" "eventbridge_sqs_policy" {
  name        = "${var.name_prefix}-eventbridge-sqs-policy"
  description = "Allow EventBridge to send messages to SQS queues"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = [
          var.sqs_winners_queue_arn,
          var.sqs_participations_queue_arn,
          var.sqs_image_optimizer_queue_arn
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eventbridge-sqs-policy"
    Type = "IAM"
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_sqs" {
  role       = aws_iam_role.eventbridge_sqs_role.name
  policy_arn = aws_iam_policy.eventbridge_sqs_policy.arn
}

resource "aws_sqs_queue_policy" "winners_queue_eventbridge" {
  queue_url = var.sqs_winners_queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = var.sqs_winners_queue_arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.raffle_closed.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "participations_queue_eventbridge" {
  queue_url = var.sqs_participations_queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = var.sqs_participations_queue_arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.participation_received.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "image_optimizer_queue_eventbridge" {
  queue_url = var.sqs_image_optimizer_queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = var.sqs_image_optimizer_queue_arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.s3_object_created.arn
          }
        }
      }
    ]
  })
}
