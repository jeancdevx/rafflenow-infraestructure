import { logger, metrics } from './lib/powertools.js'

import { checkAndCloseExpiredRaffles } from './handler.js'

const Actions = {
  SCHEDULED_TRIGGERED: 'SCHEDULED_TRIGGERED',
  CHECK_COMPLETED: 'CHECK_COMPLETED',
  CHECK_FAILED: 'CHECK_FAILED'
}

const ErrorCodes = {
  INTERNAL_ERROR: 'INTERNAL_ERROR'
}

export const handler = async event => {
  try {
    logger.info('Scheduled check triggered', {
      action: Actions.SCHEDULED_TRIGGERED,
      scheduled_time: event.time
    })

    const result = await checkAndCloseExpiredRaffles(event.time)

    logger.info('Scheduled check completed', {
      action: Actions.CHECK_COMPLETED,
      total_found: result.total_found || 0,
      results_count: result.results?.length || 0
    })

    metrics.publishStoredMetrics()

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }
  } catch (error) {
    logger.error('Fatal error checking expired raffles', {
      action: Actions.CHECK_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })

    metrics.publishStoredMetrics()

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error checking expired raffles',
        error: error.message
      })
    }
  }
}
