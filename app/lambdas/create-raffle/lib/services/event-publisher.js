import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { eventBridgeClient } from '../clients.js'
import { logger } from '../powertools.js'

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME

export async function publishRaffleCreatedEvent(raffle) {
  const event = {
    Source: 'rafflenow.raffles',
    DetailType: 'raffle.created',
    Detail: JSON.stringify({
      raffle_id: raffle.raffle_id,
      title: raffle.title,
      category: raffle.category,
      prize_value: raffle.prize_value,
      max_participants: raffle.max_participants,
      end_date: raffle.end_date,
      created_by: raffle.created_by
    }),
    EventBusName: EVENT_BUS_NAME
  }

  const command = new PutEventsCommand({
    Entries: [event]
  })

  const response = await eventBridgeClient.send(command)

  if (response.FailedEntryCount > 0) {
    logger.error('Failed to publish raffle.created event', {
      failed_entry_count: response.FailedEntryCount,
      entries: response.Entries
    })
    throw new Error('Failed to publish raffle.created event')
  }

  logger.info('Event published successfully', {
    raffle_id: raffle.raffle_id,
    event_type: 'raffle.created'
  })
}
