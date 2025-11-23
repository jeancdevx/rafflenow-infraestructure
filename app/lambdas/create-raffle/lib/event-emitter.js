import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { logger, tracer } from "./powertools.js";

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}));

export async function emitRaffleCreatedEvent(raffle) {
  logger.info("Emitting raffle.created event to EventBridge", {
    raffle_id: raffle.raffle_id,
    event_bus: EVENT_BUS_NAME,
  });

  const command = new PutEventsCommand({
    Entries: [
      {
        Source: "rafflenow.raffles",
        DetailType: "raffle.created",
        Detail: JSON.stringify({
          raffle_id: raffle.raffle_id,
          title: raffle.title,
          description: raffle.description,
          status: raffle.status,
          start_date: raffle.start_date,
          end_date: raffle.end_date,
          max_participants: raffle.max_participants,
          prize_images: raffle.prize_images,
          created_by: raffle.created_by,
          created_at: raffle.created_at,
        }),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  });

  try {
    const response = await eventBridgeClient.send(command);

    logger.info("Event emitted successfully to EventBridge", {
      raffle_id: raffle.raffle_id,
      event_type: "raffle.created",
      failed_entry_count: response.FailedEntryCount || 0,
    });

    if (response.FailedEntryCount > 0) {
      logger.error("Some events failed to emit", {
        raffle_id: raffle.raffle_id,
        failed_entries: response.Entries,
      });
    }
  } catch (error) {
    logger.error("Failed to emit event to EventBridge", {
      error: error.message,
      raffle_id: raffle.raffle_id,
      non_fatal: true,
    });
  }
}
