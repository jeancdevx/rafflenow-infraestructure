resource "aws_cloudwatch_event_bus" "rafflenow" {
  name = "${var.name_prefix}-event-bus"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-event-bus"
    Type = "EventBridge"
  })
}
