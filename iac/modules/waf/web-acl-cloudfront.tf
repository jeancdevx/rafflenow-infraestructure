resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${var.name_prefix}-waf-cloudfront"
  description = "WAF WebACL for CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "GeoBlockNonPeru"
    priority = 1

    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          geo_match_statement {
            country_codes = var.allowed_country_codes
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-cf-geo-block"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitCDN"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 5000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-cf-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSIPReputationList"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-cf-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf-cloudfront"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-waf-cloudfront"
  })
}
