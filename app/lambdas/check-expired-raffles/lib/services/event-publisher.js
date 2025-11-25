import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { eventBridgeClient } from '../clients.js'
import { logger } from '../powertools.js'

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME

export async function publishRaffleClosedEvent(raffle, closedTimestamp) {
  const eventDetail = {
    raffle_id: raffle.raffle_id,
    title: raffle.title,
    status: 'processing',
    previous_status: 'active',
    closed_at: closedTimestamp,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants,
    triggered_by: 'automated_expiration'
  }

  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'rafflenow.raffles',
        DetailType: 'raffle.closed',
        Detail: JSON.stringify(eventDetail)
      }
    ]
  })

  const response = await eventBridgeClient.send(command)

  if (response.FailedEntryCount > 0) {
    logger.error('Failed to publish raffle.closed event', {
      raffle_id: raffle.raffle_id,
      failed_entries: response.Entries
    })
    throw new Error('EventBridge PutEvents failed')
  }

  logger.info('Event raffle.closed published successfully', {
    raffle_id: raffle.raffle_id,
    event_type: 'raffle.closed'
  })
}
