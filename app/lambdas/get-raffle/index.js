import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleGetRaffle } from './handler.js'
import { NotFoundError, ValidationError } from './lib/errors.js'

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
}

export const handler = async (event, context) => {
  try {
    logger.addContext(context)

    const result = await handleGetRaffle(event)

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      return {
        statusCode: error.statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: error.message })
      }
    }

    if (error instanceof NotFoundError) {
      logger.warn('Raffle not found', { error: error.message })
      metrics.addMetric('RaffleNotFound', MetricUnit.Count, 1)
      return {
        statusCode: error.statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: error.message })
      }
    }

    logger.error('Error retrieving raffle', {
      error: error.message,
      stack: error.stack
    })
    metrics.addMetric('GetRaffleError', MetricUnit.Count, 1)

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  } finally {
    metrics.publishStoredMetrics()
  }
}
