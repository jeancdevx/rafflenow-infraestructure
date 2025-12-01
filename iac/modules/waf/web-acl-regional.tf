resource "aws_wafv2_web_acl" "regional" {
  name        = "${var.name_prefix}-waf-regional"
  description = "WAF WebACL for API Gateway and regional resources"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = var.origin_verify_header_value != null ? [1] : []
    content {
      name     = "RequireOriginVerifyHeader"
      priority = 0

      action {
        block {
          custom_response {
            response_code            = 403
            custom_response_body_key = "blocked-direct-access"
          }
        }
      }

      statement {
        not_statement {
          statement {
            byte_match_statement {
              search_string = var.origin_verify_header_value
              field_to_match {
                single_header {
                  name = "x-origin-verify"
                }
              }
              text_transformation {
                priority = 0
                type     = "NONE"
              }
              positional_constraint = "EXACTLY"
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.name_prefix}-origin-verify"
        sampled_requests_enabled   = true
      }
    }
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
      metric_name                = "${var.name_prefix}-geo-block"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitGlobal"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_global
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-global"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitParticipate"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_participate
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/participate"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "CONTAINS"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-participate"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitAuth"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_auth
        aggregate_key_type = "IP"

        scope_down_statement {
          or_statement {
            statement {
              byte_match_statement {
                search_string = "/sign-in"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
                positional_constraint = "CONTAINS"
              }
            }
            statement {
              byte_match_statement {
                search_string = "/sign-up"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
                positional_constraint = "CONTAINS"
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit-auth"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "BlockNoUserAgent"
    priority = 5

    action {
      block {}
    }

    statement {
      size_constraint_statement {
        field_to_match {
          single_header {
            name = "user-agent"
          }
        }
        comparison_operator = "EQ"
        size                = 0
        text_transformation {
          priority = 0
          type     = "NONE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-block-no-ua"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSIPReputationList"
    priority = 6

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
      metric_name                = "${var.name_prefix}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSCommonRuleSet"
    priority = 7

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          action_to_use {
            count {}
          }
          name = "SizeRestrictions_BODY"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSKnownBadInputs"
    priority = 8

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf-regional"
    sampled_requests_enabled   = true
  }

  dynamic "custom_response_body" {
    for_each = var.origin_verify_header_value != null ? [1] : []
    content {
      key          = "blocked-direct-access"
      content      = jsonencode({ message = "Direct API access is not allowed. Please use the application." })
      content_type = "APPLICATION_JSON"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-waf-regional"
  })
}
