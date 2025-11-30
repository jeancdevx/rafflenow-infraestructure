resource "aws_cloudfront_response_headers_policy" "cors_policy" {
  name    = "${var.name_prefix}-cors-policy"
  comment = "CORS policy for raffle images"

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
}
