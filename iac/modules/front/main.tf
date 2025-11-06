resource "aws_s3_bucket_policy" "policy_s3" {
  bucket = "${var.s3_bucket_name}"
  policy = "${var.origin_bucket_policy_in}"
}

locals {
  s3_origin_id  = "mys3Origin"
  my_domain     = "mydomain.com"
}

resource "aws_cloudfront_origin_access_control" "mydomain" {
  name                              = "${var.name_prefix}-oac-mydomain"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name                 = "${var.bucket_regional_domain_name}"
    origin_access_control_id    = aws_cloudfront_origin_access_control.mydomain.id
    origin_id                   = local.s3_origin_id #verificar
  }

  enabled               = true
  is_ipv6_enabled       = true
  comment               = "some comment"
  default_root_object   = "index.html"

  default_cache_behavior {
    allowed_methods = [ "GET", "HEAD" ]
    cached_methods  = [ "GET", "HEAD" ]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  ordered_cache_behavior {
    path_pattern = "/content/inmutable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      headers = [ "Origin" ]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "/content/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Enviroment = "dev"
  }

  viewer_certificate {
        cloudfront_default_certificate = true

  }
}

