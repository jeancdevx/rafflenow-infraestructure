resource "aws_cloudwatch_event_target" "raffle_closed_to_sqs" {
  rule           = aws_cloudwatch_event_rule.raffle_closed.name
  event_bus_name = aws_cloudwatch_event_bus.rafflenow.name
  target_id      = "SendToSQSWinnersQueue"
  arn            = var.sqs_winners_queue_arn
}

resource "aws_cloudwatch_event_target" "participation_received_to_sqs" {
  rule           = aws_cloudwatch_event_rule.participation_received.name
  event_bus_name = aws_cloudwatch_event_bus.rafflenow.name
  target_id      = "SendToSQSParticipationsQueue"
  arn            = var.sqs_participations_queue_arn
}

resource "aws_cloudwatch_event_target" "s3_object_created_to_sqs" {
  rule           = aws_cloudwatch_event_rule.s3_object_created.name
  event_bus_name = "default"
  target_id      = "SendToSQSImageOptimizerQueue"
  arn            = var.sqs_image_optimizer_queue_arn
}
