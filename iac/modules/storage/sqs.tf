# SQS Queue: Raffle Winner Processing
resource "aws_sqs_queue" "raffle_winner_queue" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                       = "${var.name_prefix}-raffle-winner-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 180
  sqs_managed_sse_enabled    = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffle-winner-queue"
    Type = "SQS"
  })
}

# SQS DLQ: Dead Letter Queue
resource "aws_sqs_queue" "raffle_winner_dlq" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                      = "${var.name_prefix}-raffle-winner-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffle-winner-dlq"
    Type = "SQS"
  })
}

# Redrive Policy: Connect Queue to DLQ
resource "aws_sqs_queue_redrive_policy" "raffle_winner_queue_redrive" {
  queue_url = aws_sqs_queue.raffle_winner_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.raffle_winner_dlq.arn
    maxReceiveCount     = 3
  })
}

# SQS Queue: Participations Processing
resource "aws_sqs_queue" "participations_queue" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                       = "${var.name_prefix}-participations-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 60
  sqs_managed_sse_enabled    = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-participations-queue"
    Type = "SQS"
  })
}

# SQS DLQ: Participations Dead Letter Queue
resource "aws_sqs_queue" "participations_dlq" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                      = "${var.name_prefix}-participations-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-participations-dlq"
    Type = "SQS"
  })
}

# Redrive Policy: Connect Participations Queue to DLQ
resource "aws_sqs_queue_redrive_policy" "participations_queue_redrive" {
  queue_url = aws_sqs_queue.participations_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.participations_dlq.arn
    maxReceiveCount     = 3
  })
}

# SQS Queue: Image Optimizer Processing
resource "aws_sqs_queue" "image_optimizer_queue" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                       = "${var.name_prefix}-image-optimizer-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300
  sqs_managed_sse_enabled    = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-image-optimizer-queue"
    Type = "SQS"
  })
}

# SQS DLQ: Image Optimizer Dead Letter Queue
resource "aws_sqs_queue" "image_optimizer_dlq" {
  #checkov:skip=CKV_AWS_168:SQS policy not needed - access controlled via IAM roles
  #checkov:skip=CKV_AWS_27:Using SQS managed SSE instead of KMS CMK for cost optimization
  name                      = "${var.name_prefix}-image-optimizer-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-image-optimizer-dlq"
    Type = "SQS"
  })
}

# Redrive Policy: Connect Image Optimizer Queue to DLQ
resource "aws_sqs_queue_redrive_policy" "image_optimizer_queue_redrive" {
  queue_url = aws_sqs_queue.image_optimizer_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.image_optimizer_dlq.arn
    maxReceiveCount     = 3
  })
}
