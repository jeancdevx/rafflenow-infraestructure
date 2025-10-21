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

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-raffles-table"
    Type = "DynamoDB"
  })
}
