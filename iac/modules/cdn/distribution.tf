# CloudFront Distribution
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
