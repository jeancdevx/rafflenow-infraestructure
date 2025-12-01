# S3 Bucket Policy for CloudFront access
resource "aws_s3_bucket_policy" "assets_policy" {
  bucket = var.assets_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.assets_oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${var.assets_bucket_arn}/*"
      }
    ]
  })
}

# S3 CORS Configuration
resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = var.assets_bucket_id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = concat(
      var.domain_name != null ? [
        "https://${var.domain_name}",
        "https://www.${var.domain_name}"
      ] : [],
      [
        "https://${aws_cloudfront_distribution.assets_cdn.domain_name}",
        "http://localhost:3000",
        "http://localhost:4321",
        "http://localhost:5173"
      ]
    )
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Versioning
resource "aws_s3_bucket_versioning" "assets_versioning" {
  bucket = var.assets_bucket_id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "assets_lifecycle" {
  bucket = var.assets_bucket_id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "delete-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
