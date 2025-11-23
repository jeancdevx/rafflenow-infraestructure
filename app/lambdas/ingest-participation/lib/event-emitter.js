import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { tracer, logger } from "./powertools.js";

const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}));

export async function emitParticipationReceivedEvent(params) {
  const { raffleId, raffle, participantData } = params;

  const participationTimestamp = new Date().toISOString();

  const eventDetail = {
    raffle_id: raffleId,
    raffle_title: raffle.title,
    participant_email: participantData.participant_email,
    participant_name: participantData.participant_name,
    participant_phone: participantData.participant_phone,
    participated_at: participationTimestamp,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants,
    raffle_status: raffle.status,
  };

  logger.info("Emitting participation.received event to EventBridge", {
    raffle_id: raffleId,
    participant_email: participantData.participant_email,
    event_bus: process.env.EVENT_BUS_NAME,
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
