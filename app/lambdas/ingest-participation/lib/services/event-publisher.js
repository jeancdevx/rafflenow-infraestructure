import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { eventBridgeClient } from '../clients.js'
import { logger } from '../powertools.js'
import { ErrorCodes } from '../errors.js'

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME

export async function publishParticipationReceivedEvent(params) {
  const { raffleId, raffle, participantData, correlationId } = params

  const participationTimestamp = new Date().toISOString()

  const eventDetail = {
    raffle_id: raffleId,
    raffle_title: raffle.title,
    participant_email: participantData.participant_email,
    participant_name: participantData.participant_name,
    user_id: participantData.user_id,
    participated_at: participationTimestamp,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants,
    raffle_status: raffle.status,
    correlation_id: correlationId
  }

  logger.info('Publishing participation.received event', {
    action: 'EVENT_PUBLISHING',
    raffle_id: raffleId,
    participant_email: participantData.participant_email,
    event_bus: EVENT_BUS_NAME
  })

  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'rafflenow.participations',
        DetailType: 'participation.received',
        Detail: JSON.stringify(eventDetail)
      }
    ]
  })

  const response = await eventBridgeClient.send(command)

  if (response.FailedEntryCount > 0) {
    logger.error('Failed to publish event to EventBridge', {
      action: 'EVENT_PUBLISH_FAILED',
      error_code: ErrorCodes.QUEUE_ERROR,
      failed_entry_count: response.FailedEntryCount,
      entries: response.Entries
    })
    throw new Error('Failed to publish participation event to EventBridge')
  }

  logger.info('Event published successfully', {
    action: 'EVENT_PUBLISHED',
    raffle_id: raffleId,
    event_type: 'participation.received'
  })
}
