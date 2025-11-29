import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleParticipationRequest } from './handler.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
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

export const handler = async event => {
  logger.info('Incoming participation request', { path: event.path })

  try {
    const result = await handleParticipationRequest(event)

    return buildResponse(202, {
      message: 'Participation request accepted',
      ...result
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized attempt', { error: error.message })
      metrics.addMetric('UnauthorizedAttempt', MetricUnit.Count, 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ForbiddenError) {
      logger.warn('Forbidden attempt', { error: error.message })
      metrics.addMetric('ForbiddenAttempt', MetricUnit.Count, 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof NotFoundError) {
      logger.warn('Resource not found', { error: error.message })
      metrics.addMetric('ResourceNotFound', MetricUnit.Count, 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ConflictError) {
      logger.warn('Conflict detected', { error: error.message })
      metrics.addMetric('ConflictError', MetricUnit.Count, 1)
      return buildResponse(error.statusCode, {
        message: error.message,
        ...error.details
      })
    }

    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      return buildResponse(error.statusCode, {
        message: error.message,
        ...error.details
      })
    }

    logger.error('Unexpected error processing participation request', {
      error: error.message,
      stack: error.stack
    })
    metrics.addMetric('UnexpectedError', MetricUnit.Count, 1)

    return buildResponse(500, {
      message: 'Error processing participation request',
      error: error.message
    })
  } finally {
    metrics.publishStoredMetrics()
  }
}
