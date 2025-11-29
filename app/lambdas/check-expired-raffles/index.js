import { logger, metrics } from './lib/powertools.js'
import { checkAndCloseExpiredRaffles } from './handler.js'

export const handler = async event => {
  try {
    const result = await checkAndCloseExpiredRaffles(event.time)

    metrics.publishStoredMetrics()

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }
  } catch (error) {
    logger.error('Fatal error checking expired raffles', {
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
