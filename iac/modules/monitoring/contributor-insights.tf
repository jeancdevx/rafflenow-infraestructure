resource "aws_cloudwatch_contributor_insight_rule" "top_ips_5xx_errors" {
  count = var.api_gateway_public_access_logs_name != "" ? 1 : 0

  rule_name  = "${var.name_prefix}-top-ips-5xx-errors-${var.environment}"
  rule_state = "ENABLED"

  rule_definition = jsonencode({
    Schema = {
      Name    = "CloudWatchLogRule"
      Version = 1
    }
    AggregateOn = "Count"
    Contribution = {
      Filters = [
        {
          Match = "$.status"
          In    = ["500", "501", "502", "503", "504"]
        }
      ]
      Keys = ["$.ip"]
    }
    LogFormat = "JSON"
    LogGroupNames = [
      var.api_gateway_public_access_logs_name,
      var.api_gateway_authenticated_access_logs_name
    ]
  })

  tags = var.tags
}

resource "aws_cloudwatch_contributor_insight_rule" "top_endpoints_latency" {
  count = var.api_gateway_public_access_logs_name != "" ? 1 : 0

  rule_name  = "${var.name_prefix}-top-endpoints-requests-${var.environment}"
  rule_state = "ENABLED"

  rule_definition = jsonencode({
    Schema = {
      Name    = "CloudWatchLogRule"
      Version = 1
    }
    AggregateOn = "Count"
    Contribution = {
      Filters = [
        {
          Match = "$.status"
          In    = ["200", "201", "400", "401", "403", "404", "429", "500", "502", "503"]
        }
      ]
      Keys = ["$.resourcePath", "$.httpMethod"]
    }
    LogFormat = "JSON"
    LogGroupNames = [
      var.api_gateway_public_access_logs_name,
      var.api_gateway_authenticated_access_logs_name
    ]
  })

  tags = var.tags
}

resource "aws_cloudwatch_contributor_insight_rule" "top_users_requests" {
  count = var.api_gateway_authenticated_access_logs_name != "" ? 1 : 0

  rule_name  = "${var.name_prefix}-top-users-requests-${var.environment}"
  rule_state = "ENABLED"

  rule_definition = jsonencode({
    Schema = {
      Name    = "CloudWatchLogRule"
      Version = 1
    }
    AggregateOn = "Count"
    Contribution = {
      Filters = [
        {
          Match     = "$.cognitoUser"
          IsPresent = true
        }
      ]
      Keys = ["$.cognitoUser"]
    }
    LogFormat = "JSON"
    LogGroupNames = [
      var.api_gateway_authenticated_access_logs_name
    ]
  })

  tags = var.tags
}

resource "aws_cloudwatch_contributor_insight_rule" "top_user_agents" {
  count = var.api_gateway_public_access_logs_name != "" ? 1 : 0

  rule_name  = "${var.name_prefix}-top-user-agents-${var.environment}"
  rule_state = "ENABLED"

  rule_definition = jsonencode({
    Schema = {
      Name    = "CloudWatchLogRule"
      Version = 1
    }
    AggregateOn = "Count"
    Contribution = {
      Filters = [
        {
          Match = "$.status"
          In    = ["400", "401", "403", "404", "429"]
        }
      ]
      Keys = ["$.userAgent", "$.ip"]
    }
    LogFormat = "JSON"
    LogGroupNames = [
      var.api_gateway_public_access_logs_name,
      var.api_gateway_authenticated_access_logs_name
    ]
  })

  tags = var.tags
}
