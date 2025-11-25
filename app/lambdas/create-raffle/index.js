import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleCreateRaffle } from './handler.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
} from './lib/errors.js'

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
})

export const handler = async (event, context) => {
  try {
    logger.addContext(context)

    const raffle = await handleCreateRaffle(event)

    metrics.publishStoredMetrics()

    return buildResponse(201, {
      message: 'Raffle created successfully',
      raffle: raffle
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized attempt', { error: error.message })
      metrics.addMetric('UnauthorizedAttempt', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ForbiddenError) {
      logger.warn('Forbidden attempt', { error: error.message })
      metrics.addMetric('ForbiddenAttempt', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: 'Validation error',
        error: error.message,
        ...error.details
      })
    }

    if (error instanceof ConflictError) {
      logger.warn('Raffle ID collision', { error: error.message })
      metrics.addMetric('ConflictError', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    logger.error('Error creating raffle', {
      error: error.message,
      stack: error.stack
    })

    metrics.addMetric('CreateRaffleError', MetricUnit.Count, 1)
    metrics.publishStoredMetrics()

    return buildResponse(500, {
      message: 'Error creating raffle',
      error: error.message
    })
  }
}
