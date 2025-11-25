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

resource "aws_dynamodb_table" "participations" {
  name         = "${var.name_prefix}-participations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "participation_id"

  attribute {
    name = "participation_id"
    type = "S"
  }

  attribute {
    name = "raffle_id"
    type = "S"
  }

  attribute {
    name = "participant_email"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "RaffleIdIndex"
    hash_key        = "raffle_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "participant_email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserIdRaffleIdIndex"
    hash_key        = "user_id"
    range_key       = "raffle_id"
    projection_type = "ALL"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-participations-table"
    Type = "DynamoDB"
  })
}

resource "aws_dynamodb_table" "winners" {
  name         = "${var.name_prefix}-winners"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "raffle_id"

  attribute {
    name = "raffle_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-winners-table"
    Type = "DynamoDB"
  })
}
