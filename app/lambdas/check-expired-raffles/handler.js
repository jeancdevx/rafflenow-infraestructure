import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { queryExpiredRaffles } from './lib/repositories/raffle-repository.js'
import {
  closeRaffleToProcessing,
  closeRaffleDirectly
} from './lib/services/raffle-service.js'
import { publishRaffleClosedEvent } from './lib/services/event-publisher.js'

const Actions = {
  RAFFLE_PROCESSING: 'RAFFLE_PROCESSING',
  RAFFLE_CLOSED_NO_PARTICIPANTS: 'RAFFLE_CLOSED_NO_PARTICIPANTS',
  RAFFLE_CLOSED_WITH_PARTICIPANTS: 'RAFFLE_CLOSED_WITH_PARTICIPANTS',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED',
  RAFFLE_PROCESSING_FAILED: 'RAFFLE_PROCESSING_FAILED',
  QUERY_EXPIRED: 'QUERY_EXPIRED',
  NO_EXPIRED_FOUND: 'NO_EXPIRED_FOUND',
  BATCH_COMPLETED: 'BATCH_COMPLETED'
}

const ErrorCodes = {
  RAFFLE_CLOSE_ERROR: 'RAFFLE_CLOSE_ERROR',
  EVENT_PUBLISH_ERROR: 'EVENT_PUBLISH_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
}

async function processExpiredRaffle(raffle) {
  logger.appendKeys({
    raffle_id: raffle.raffle_id,
    raffle_title: raffle.title
  })

  logger.info('Processing expired raffle', {
    action: Actions.RAFFLE_PROCESSING,
    current_participants: raffle.current_participants,
    max_participants: raffle.max_participants
  })

  if (raffle.current_participants === 0) {
    const closedTimestamp = await closeRaffleDirectly(raffle.raffle_id)

    logger.info('Raffle closed without participants', {
      action: Actions.RAFFLE_CLOSED_NO_PARTICIPANTS,
      closed_at: closedTimestamp
    })

    metrics.addMetric('RaffleClosedNoParticipants', MetricUnit.Count, 1)

    return {
      raffle_id: raffle.raffle_id,
      status: 'closed',
      closed_at: closedTimestamp
    }
  }

  const closedTimestamp = await closeRaffleToProcessing(raffle.raffle_id)

  logger.info('Raffle closed with participants, moving to processing', {
    action: Actions.RAFFLE_CLOSED_WITH_PARTICIPANTS,
    current_participants: raffle.current_participants,
    closed_at: closedTimestamp
  })

  await publishRaffleClosedEvent(raffle, closedTimestamp)

  logger.info('Raffle closed event published', {
    action: Actions.EVENT_PUBLISHED
  })

  metrics.addMetric('RaffleClosed', MetricUnit.Count, 1)

  return {
    raffle_id: raffle.raffle_id,
    status: 'processing',
    closed_at: closedTimestamp
  }
}

export async function checkAndCloseExpiredRaffles(scheduledTime) {
  const now = new Date()
  const targetDate = now.toISOString()

  const expiredRaffles = await queryExpiredRaffles(targetDate)

  logger.info('Expired raffles query completed', {
    action: Actions.QUERY_EXPIRED,
    count: expiredRaffles.length,
    target_date: targetDate
  })

  metrics.addMetric(
    'ExpiredRafflesFound',
    MetricUnit.Count,
    expiredRaffles.length
  )

  if (expiredRaffles.length === 0) {
    logger.info('No expired raffles found', {
      action: Actions.NO_EXPIRED_FOUND,
      checked_date: targetDate
    })

    return {
      message: 'No expired raffles found',
      checked_date: targetDate
    }
  }

  const results = []
  let successCount = 0
  let errorCount = 0

  for (const raffle of expiredRaffles) {
    try {
      const result = await processExpiredRaffle(raffle)
      results.push(result)
      successCount++
    } catch (error) {
      logger.error('Error processing individual raffle', {
        action: Actions.RAFFLE_PROCESSING_FAILED,
        error_code: ErrorCodes.RAFFLE_CLOSE_ERROR,
        error: error.message,
        error_name: error.name
      })

      metrics.addMetric('RaffleProcessingError', MetricUnit.Count, 1)

      results.push({
        raffle_id: raffle.raffle_id,
        status: 'error',
        error: error.message
      })
      errorCount++
    } finally {
      logger.removeKeys(['raffle_id', 'raffle_title'])
    }
  }

  logger.info('Expired raffles batch processing completed', {
    action: Actions.BATCH_COMPLETED,
    total_found: expiredRaffles.length,
    success_count: successCount,
    error_count: errorCount
  })

  return {
    message: 'Expired raffles processed',
    total_found: expiredRaffles.length,
    results: results
  }
}
