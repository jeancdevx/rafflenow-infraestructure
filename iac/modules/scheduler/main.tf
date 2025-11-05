resource "aws_cloudwatch_event_rule" "check_expired_raffles" {
  name                = "${var.name_prefix}-check-expired-raffles"
  description         = "Triggers daily at midnight UTC to check and close expired raffles"
  schedule_expression = "cron(0 0 * * ? *)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-check-expired-raffles-rule"
    Type = "EventBridge"
  })
}

resource "aws_cloudwatch_event_target" "check_expired_raffles_lambda" {
  rule      = aws_cloudwatch_event_rule.check_expired_raffles.name
  target_id = "CheckExpiredRafflesLambda"
  arn       = var.lambda_check_expired_raffles_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_check_expired_raffles_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.check_expired_raffles.arn
}
