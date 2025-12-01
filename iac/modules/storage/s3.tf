#checkov:skip=CKV_AWS_18:S3 access logging not needed - CloudFront access logs capture all requests
#checkov:skip=CKV_AWS_144:Cross-region replication not needed - single region deployment for Peru
#checkov:skip=CKV_AWS_145:SSE-S3 default encryption sufficient for public raffle images
#checkov:skip=CKV2_AWS_6:Public access block conflicts with CloudFront OAI - will migrate to OAC in future
resource "aws_s3_bucket" "assets" {
  bucket = "${var.name_prefix}-assets"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-assets-bucket"
    Type = "S3"
  })
}

resource "aws_s3_bucket_versioning" "assets_versioning" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "assets_lifecycle" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.assets_versioning]
}

# S3 Event Notifications to EventBridge
resource "aws_s3_bucket_notification" "assets_eventbridge" {
  bucket      = aws_s3_bucket.assets.id
  eventbridge = true
}
