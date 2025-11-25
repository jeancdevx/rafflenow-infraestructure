import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { queryExpiredRaffles } from './lib/repositories/raffle-repository.js'
import {
  closeRaffleToProcessing,
  closeRaffleDirectly
} from './lib/services/raffle-service.js'
import { publishRaffleClosedEvent } from './lib/services/event-publisher.js'

async function processExpiredRaffle(raffle) {
  logger.appendKeys({
    raffle_id: raffle.raffle_id,
    raffle_title: raffle.title
  })

  logger.info('Processing expired raffle', {
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants
  })

  if (raffle.current_participants === 0) {
    logger.info('Raffle has no participants, closing directly', {
      raffle_id: raffle.raffle_id
    })

    const closedTimestamp = await closeRaffleDirectly(raffle.raffle_id)

    metrics.addMetric('RaffleClosedNoParticipants', MetricUnit.Count, 1)

    return {
      raffle_id: raffle.raffle_id,
      status: 'closed',
      closed_at: closedTimestamp
    }
  }

  const closedTimestamp = await closeRaffleToProcessing(raffle.raffle_id)

  await publishRaffleClosedEvent(raffle, closedTimestamp)

  metrics.addMetric('RaffleClosed', MetricUnit.Count, 1)

  return {
    raffle_id: raffle.raffle_id,
    status: 'processing',
    closed_at: closedTimestamp
  }
}

export async function checkAndCloseExpiredRaffles(scheduledTime) {
  logger.info('Starting expired raffles check', {
    scheduled_event: scheduledTime
  })

  const now = new Date()
  const targetDate = now.toISOString()

  const expiredRaffles = await queryExpiredRaffles(targetDate)

  logger.info('Expired raffles found', {
    count: expiredRaffles.length
  })

  metrics.addMetric(
    'ExpiredRafflesFound',
    MetricUnit.Count,
    expiredRaffles.length
  )

  if (expiredRaffles.length === 0) {
    return {
      message: 'No expired raffles found',
      checked_date: targetDate
    }
  }

  const results = []

  for (const raffle of expiredRaffles) {
    try {
      const result = await processExpiredRaffle(raffle)
      results.push(result)
    } catch (error) {
      logger.error('Error processing individual raffle', {
        error: error.message,
        error_name: error.name,
        raffle_id: raffle.raffle_id
      })

      metrics.addMetric('RaffleProcessingError', MetricUnit.Count, 1)

      results.push({
        raffle_id: raffle.raffle_id,
        status: 'error',
        error: error.message
      })
    } finally {
      logger.removeKeys(['raffle_id', 'raffle_title'])
    }
  }

  logger.info('Expired raffles processing completed', {
    total_found: expiredRaffles.length,
    results_count: results.length
  })

  return {
    message: 'Expired raffles processed',
    total_found: expiredRaffles.length,
    results: results
  }
}
