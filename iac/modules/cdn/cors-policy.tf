resource "aws_cloudfront_response_headers_policy" "cors_policy" {
  name    = "${var.name_prefix}-cors-policy"
  comment = "CORS and security headers policy for raffle assets"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }

    access_control_allow_origins {
      items = [
        "http://localhost:3000",
        "http://localhost:4321",
        "http://localhost:5173",
        "https://rafflenow.com",
        "https://*.rafflenow.com"
      ]
    }

    access_control_max_age_sec = 86400

    origin_override = true
  }

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}
