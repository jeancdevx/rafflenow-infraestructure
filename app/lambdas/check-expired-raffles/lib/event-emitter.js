import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { logger, metrics } from "./powertools.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export async function emitRaffleClosedEvent(
  eventBridgeClient,
  raffle,
  closedTimestamp
) {
  const eventDetail = {
    raffle_id: raffle.raffle_id,
    title: raffle.title,
    status: "processing",
    previous_status: "active",
    closed_at: closedTimestamp,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants,
    triggered_by: "automated_expiration",
  };

  const putEventsCommand = new PutEventsCommand({
    Entries: [
      {
        EventBusName: process.env.EVENT_BUS_NAME,
        Source: "rafflenow.raffles",
        DetailType: "raffle.closed",
        Detail: JSON.stringify(eventDetail),
      },
    ],
  });

  const eventResult = await eventBridgeClient.send(putEventsCommand);

  if (eventResult.FailedEntryCount > 0) {
    logger.error("Failed to emit raffle.closed event", {
      raffle_id: raffle.raffle_id,
      failed_entries: eventResult.Entries,
    });
    throw new Error("EventBridge PutEvents failed");
  }

  logger.info("Event raffle.closed emitted successfully", {
    raffle_id: raffle.raffle_id,
    event_type: "raffle.closed",
  });

  metrics.addMetric("EventsEmitted", MetricUnit.Count, 1);
}
