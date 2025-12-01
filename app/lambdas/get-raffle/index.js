import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleGetRaffle } from './handler.js'
import { NotFoundError, ValidationError, ErrorCodes } from './lib/errors.js'
import { getCorsHeaders } from './lib/cors.js'

const Actions = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  RAFFLE_RETRIEVED: 'RAFFLE_RETRIEVED',
  REQUEST_FAILED: 'REQUEST_FAILED'
}

export const handler = async (event, context) => {
  const corsHeaders = getCorsHeaders(event)

  try {
    logger.addContext(context)

    logger.info('Get raffle request received', {
      action: Actions.REQUEST_RECEIVED,
      raffle_id: event.pathParameters?.id
    })

    const result = await handleGetRaffle(event)

    logger.info('Raffle retrieved successfully', {
      action: Actions.RAFFLE_RETRIEVED,
      raffle_id: result.raffle?.id || result.id
    })

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      return {
        statusCode: error.statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      }
    }

    if (error instanceof NotFoundError) {
      logger.warn('Raffle not found', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('RaffleNotFound', MetricUnit.Count, 1)
      return {
        statusCode: error.statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      }
    }

    logger.error('Error retrieving raffle', {
      action: Actions.REQUEST_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })
    metrics.addMetric('GetRaffleError', MetricUnit.Count, 1)

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  } finally {
    metrics.publishStoredMetrics()
  }
}
