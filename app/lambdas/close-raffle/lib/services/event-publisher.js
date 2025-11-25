import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { eventBridgeClient } from '../clients.js'
import { logger } from '../powertools.js'

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME

export async function publishRaffleClosedEvent(raffle, closedBy) {
  const event = {
    Source: 'rafflenow.raffles',
    DetailType: 'raffle.closed',
    Detail: JSON.stringify({
      raffle_id: raffle.raffle_id,
      title: raffle.title,
      status: raffle.status,
      previous_status: 'active',
      closed_at: raffle.closed_at,
      current_participants: raffle.current_participants,
      max_participants: raffle.max_participants,
      closed_by: closedBy
    }),
    EventBusName: EVENT_BUS_NAME
  }

  const command = new PutEventsCommand({
    Entries: [event]
  })

  const response = await eventBridgeClient.send(command)

  if (response.FailedEntryCount > 0) {
    logger.error('Failed to publish raffle.closed event', {
      failed_entry_count: response.FailedEntryCount,
      entries: response.Entries
    })
    throw new Error('Failed to publish raffle.closed event')
  }

  logger.info('Event published successfully', {
    raffle_id: raffle.raffle_id,
    closed_by: closedBy
  })
}
