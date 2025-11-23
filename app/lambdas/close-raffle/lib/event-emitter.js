import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { tracer, logger } from "./powertools.js";

const client = tracer.captureAWSv3Client(new EventBridgeClient({}));

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

export async function emitRaffleClosedEvent(raffle, closedBy) {
  const event = {
    Source: "rafflenow.raffles",
    DetailType: "raffle.closed",
    Detail: JSON.stringify({
      raffle_id: raffle.id,
      title: raffle.title,
      status: raffle.status,
      previous_status: "active",
      closed_at: raffle.closed_at,
      current_participants: raffle.current_participants,
      max_participants: raffle.max_participants,
      closed_by: closedBy,
    }),
    EventBusName: EVENT_BUS_NAME,
  };

  const command = new PutEventsCommand({
    Entries: [event],
  });

  const response = await client.send(command);

  if (response.FailedEntryCount > 0) {
    logger.error("Failed to emit raffle.closed event", {
      failed_entry_count: response.FailedEntryCount,
      entries: response.Entries,
    });
    throw new Error("Failed to emit raffle.closed event");
  }

  logger.info("Successfully emitted raffle.closed event", {
    raffle_id: raffle.id,
    closed_by: closedBy,
    failed_entry_count: response.FailedEntryCount,
  });
}
