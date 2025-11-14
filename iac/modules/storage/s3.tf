# S3 Bucket for assets
resource "aws_s3_bucket" "assets" {
  bucket = "${var.name_prefix}-assets"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-assets-bucket"
    Type = "S3"
  })
}

# S3 Event Notifications to EventBridge
resource "aws_s3_bucket_notification" "assets_eventbridge" {
  bucket      = aws_s3_bucket.assets.id
  eventbridge = true
}
