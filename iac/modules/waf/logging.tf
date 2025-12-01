resource "aws_cloudwatch_log_group" "waf_regional" {
  name              = "aws-waf-logs-${var.name_prefix}-regional"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-waf-regional-logs"
    Type = "WAF"
  })
}

resource "aws_cloudwatch_log_group" "waf_cloudfront" {
  provider = aws.us_east_1

  name              = "aws-waf-logs-${var.name_prefix}-cloudfront"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-waf-cloudfront-logs"
    Type = "WAF"
  })
}

resource "aws_wafv2_web_acl_logging_configuration" "regional" {
  log_destination_configs = [aws_cloudwatch_log_group.waf_regional.arn]
  resource_arn            = aws_wafv2_web_acl.regional.arn

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior = "KEEP"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }

      requirement = "MEETS_ANY"
    }
  }

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "cloudfront" {
  provider = aws.us_east_1

  log_destination_configs = [aws_cloudwatch_log_group.waf_cloudfront.arn]
  resource_arn            = aws_wafv2_web_acl.cloudfront.arn

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior = "KEEP"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }

      requirement = "MEETS_ANY"
    }
  }

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}
