# EventBridge Target: Connect Rule to Lambda
resource "aws_cloudwatch_event_target" "check_expired_raffles_lambda" {
  rule      = aws_cloudwatch_event_rule.check_expired_raffles.name
  target_id = "CheckExpiredRafflesLambda"
  arn       = var.lambda_check_expired_raffles_arn
}

# Lambda Permission: Allow EventBridge to invoke
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_check_expired_raffles_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.check_expired_raffles.arn
}
