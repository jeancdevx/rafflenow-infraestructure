resource "aws_s3_bucket" "assets" {
  bucket = "${var.name_prefix}-assets"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-assets-bucket"
    Type = "S3"
  })
}

resource "aws_dynamodb_table" "raffles" {
  name         = "${var.name_prefix}-raffles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "raffle_id"

  attribute {
    name = "raffle_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "end_date"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusEndDateIndex"
    hash_key        = "status"
    range_key       = "end_date"
    projection_type = "ALL"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffles-table"
    Type = "DynamoDB"
  })
}

resource "aws_dynamodb_table" "participants" {
  name         = "${var.name_prefix}-participants"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "raffle_id"
  range_key    = "participant_email"

  attribute {
    name = "raffle_id"
    type = "S"
  }

  attribute {
    name = "participant_email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "participant_email"
    projection_type = "ALL"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-participants-table"
    Type = "DynamoDB"
  })
}

resource "aws_sqs_queue" "raffle_winner_queue" {
  name                       = "${var.name_prefix}-raffle-winner-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffle-winner-queue"
    Type = "SQS"
  })
}

resource "aws_sqs_queue" "raffle_winner_dlq" {
  name                      = "${var.name_prefix}-raffle-winner-dlq"
  message_retention_seconds = 1209600

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffle-winner-dlq"
    Type = "SQS"
  })
}

resource "aws_sqs_queue_redrive_policy" "raffle_winner_queue_redrive" {
  queue_url = aws_sqs_queue.raffle_winner_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.raffle_winner_dlq.arn
    maxReceiveCount     = 3
  })
}
resource "aws_s3_bucket_public_access_block" "block_public_access" {

  bucket = aws_s3_bucket.assets.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

}
resource "aws_s3_object" "website_index" {

  bucket            = aws_s3_bucket.assets.id
  key               = "index.html"
  source            = "${path.module}/index.html"
  content_type      = "text/html"
  acl               = "private"

}
