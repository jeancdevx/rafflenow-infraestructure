import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { tracer, logger } from "./powertools.js";
import { createHash } from "crypto";

const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}));

function generateIdempotencyKey(raffleId, participantEmail) {
  return createHash("sha256")
    .update(`${raffleId}:${participantEmail}`)
    .digest("hex")
    .substring(0, 16);
}

export async function emitParticipationReceivedEvent(params) {
  const { raffleId, raffle, participantData } = params;

  const participationTimestamp = new Date().toISOString();
  const idempotencyKey = generateIdempotencyKey(
    raffleId,
    participantData.participant_email
  );

  const eventDetail = {
    raffle_id: raffleId,
    raffle_title: raffle.title,
    participant_email: participantData.participant_email,
    participant_name: participantData.participant_name,
    participated_at: participationTimestamp,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants,
    raffle_status: raffle.status,
    idempotency_key: idempotencyKey,
  };

  logger.info("Emitting participation.received event to EventBridge", {
    raffle_id: raffleId,
    participant_email: participantData.participant_email,
    event_bus: process.env.EVENT_BUS_NAME,
    idempotency_key: idempotencyKey,
  });

  const putEventsCommand = new PutEventsCommand({
    Entries: [
      {
        EventBusName: process.env.EVENT_BUS_NAME,
        Source: "rafflenow.participations",
        DetailType: "participation.received",
        Detail: JSON.stringify(eventDetail),
      },
    ],
  });

  const response = await eventBridgeClient.send(putEventsCommand);

  if (response.FailedEntryCount > 0) {
    logger.error("Failed to emit event to EventBridge", {
      failed_entry_count: response.FailedEntryCount,
      entries: response.Entries,
    });
    throw new Error("Failed to emit participation event to EventBridge");
  }

  logger.info("Event emitted successfully to EventBridge", {
    raffle_id: raffleId,
    event_type: "participation.received",
    failed_entry_count: response.FailedEntryCount,
  });
}
