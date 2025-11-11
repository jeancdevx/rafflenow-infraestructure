# DynamoDB Table: Raffles
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

# DynamoDB Table: Participants
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
