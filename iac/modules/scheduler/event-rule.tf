# EventBridge Rule: Check Expired Raffles Daily
resource "aws_cloudwatch_event_rule" "check_expired_raffles" {
  name                = "${var.name_prefix}-check-expired-raffles"
  description         = "Triggers daily at midnight UTC to check and close expired raffles"
  schedule_expression = "cron(0 0 * * ? *)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-check-expired-raffles-rule"
    Type = "EventBridge"
  })
}
