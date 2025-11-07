resource "aws_cloudfront_origin_access_identity" "assets_oai" {
  comment = "OAI for ${var.name_prefix} assets bucket"
}

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

resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = var.assets_bucket_id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = ["*"] # TODO: Restringir a dominios específicos en producción
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_versioning" "assets_versioning" {
  bucket = var.assets_bucket_id

  versioning_configuration {
    status = "Enabled"
  }
}

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

resource "aws_cloudfront_cache_policy" "assets_cache_policy" {
  name        = "${var.name_prefix}-assets-cache-policy"
  comment     = "Cache policy for RaffleNow assets"
  default_ttl = 86400
  max_ttl     = 31536000
  min_ttl     = 1

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_distribution" "assets_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for ${var.name_prefix} assets"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # USA, Canada, Europe

  origin {
    domain_name = var.assets_bucket_regional_domain_name
    origin_id   = "S3-${var.assets_bucket_id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${var.assets_bucket_id}"
    cache_policy_id        = aws_cloudfront_cache_policy.assets_cache_policy.id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # TODO: Para usar dominio custom, agregar:
    # acm_certificate_arn      = var.acm_certificate_arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-assets-cdn"
    Type = "CloudFront"
  })
}
