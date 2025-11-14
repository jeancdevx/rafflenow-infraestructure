resource "aws_cloudwatch_event_rule" "raffle_created" {
  name           = "${var.name_prefix}-raffle-created"
  description    = "Captures raffle.created events from Lambda Create"
  event_bus_name = aws_cloudwatch_event_bus.rafflenow.name

  event_pattern = jsonencode({
    source      = ["rafflenow.raffles"]
    detail-type = ["raffle.created"]
  })

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-raffle-created-rule"
    Type      = "EventBridge"
    EventType = "raffle.created"
  })
}

resource "aws_cloudwatch_event_rule" "raffle_closed" {
  name           = "${var.name_prefix}-raffle-closed"
  description    = "Captures raffle.closed events from Lambda Close and Lambda Check Expired"
  event_bus_name = aws_cloudwatch_event_bus.rafflenow.name

  event_pattern = jsonencode({
    source      = ["rafflenow.raffles"]
    detail-type = ["raffle.closed"]
  })

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-raffle-closed-rule"
    Type      = "EventBridge"
    EventType = "raffle.closed"
  })
}

resource "aws_cloudwatch_event_rule" "participation_received" {
  name           = "${var.name_prefix}-participation-received"
  description    = "Captures participation.received events from Lambda Ingest"
  event_bus_name = aws_cloudwatch_event_bus.rafflenow.name

  event_pattern = jsonencode({
    source      = ["rafflenow.participations"]
    detail-type = ["participation.received"]
  })

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-participation-received-rule"
    Type      = "EventBridge"
    EventType = "participation.received"
  })
}

resource "aws_cloudwatch_event_rule" "s3_object_created" {
  name           = "${var.name_prefix}-s3-object-created"
  description    = "Captures S3 ObjectCreated events for prize images"
  event_bus_name = "default"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [var.s3_assets_bucket_name]
      }
      object = {
        key = [{
          prefix = "prizes/"
        }]
      }
    }
  })

  tags = merge(var.tags, {
    Name      = "${var.name_prefix}-s3-object-created-rule"
    Type      = "EventBridge"
    EventType = "s3.object.created"
  })
}
