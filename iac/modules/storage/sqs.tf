# SQS Queue: Raffle Winner Processing
resource "aws_sqs_queue" "raffle_winner_queue" {
  name                       = "${var.name_prefix}-raffle-winner-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 180

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffle-winner-queue"
    Type = "SQS"
  })
}

# SQS DLQ: Dead Letter Queue
resource "aws_sqs_queue" "raffle_winner_dlq" {
  name                      = "${var.name_prefix}-raffle-winner-dlq"
  message_retention_seconds = 1209600

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
