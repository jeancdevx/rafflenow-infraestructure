import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleParticipationRequest } from './handler.js'
import { getCorsHeaders } from './lib/cors.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ErrorCodes
} from './lib/errors.js'

const Actions = {
  PARTICIPATION_STARTED: 'PARTICIPATION_STARTED',
  PARTICIPATION_ACCEPTED: 'PARTICIPATION_ACCEPTED',
  PARTICIPATION_REJECTED: 'PARTICIPATION_REJECTED'
}

const buildResponse = (statusCode, body, corsHeaders) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders
  },
  body: JSON.stringify(body)
})

const generateCorrelationId = (event) => {
  return (
    event.headers?.['x-correlation-id'] ||
    event.requestContext?.requestId ||
    crypto.randomUUID()
  )
}

export const handler = async (event) => {
  const corsHeaders = getCorsHeaders(event)
  const correlationId = generateCorrelationId(event)
  logger.appendKeys({ correlation_id: correlationId })

  logger.info('Incoming participation request', {
    action: Actions.PARTICIPATION_STARTED,
    path: event.path
  })

  try {
    const result = await handleParticipationRequest(event, correlationId)

    logger.info('Participation request completed', {
      action: Actions.PARTICIPATION_ACCEPTED
    })

    return buildResponse(
      202,
      {
        message: 'Participation request accepted',
        ...result
      },
      corsHeaders
    )
  } catch (error) {
    const errorCode = error.errorCode || ErrorCodes.INTERNAL_ERROR

    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized attempt', {
        action: Actions.PARTICIPATION_REJECTED,
        error_code: errorCode,
        error: error.message
      })
      metrics.addMetric('UnauthorizedAttempt', MetricUnit.Count, 1)
      return buildResponse(
        error.statusCode,
        {
          message: error.message
        },
        corsHeaders
      )
    }

    if (error instanceof ForbiddenError) {
      logger.warn('Forbidden attempt', {
        action: Actions.PARTICIPATION_REJECTED,
        error_code: errorCode,
        error: error.message
      })
      metrics.addMetric('ForbiddenAttempt', MetricUnit.Count, 1)
      return buildResponse(
        error.statusCode,
        {
          message: error.message
        },
        corsHeaders
      )
    }

    if (error instanceof NotFoundError) {
      logger.warn('Resource not found', {
        action: Actions.PARTICIPATION_REJECTED,
        error_code: errorCode,
        error: error.message
      })
      metrics.addMetric('ResourceNotFound', MetricUnit.Count, 1)
      return buildResponse(
        error.statusCode,
        {
          message: error.message
        },
        corsHeaders
      )
    }

    if (error instanceof ConflictError) {
      logger.warn('Conflict detected', {
        action: Actions.PARTICIPATION_REJECTED,
        error_code: errorCode,
        error: error.message
      })
      metrics.addMetric('ConflictError', MetricUnit.Count, 1)
      return buildResponse(
        error.statusCode,
        {
          message: error.message,
          ...error.details
        },
        corsHeaders
      )
    }

    if (error instanceof ValidationError) {
      logger.warn('Validation error', {
        action: Actions.PARTICIPATION_REJECTED,
        error_code: errorCode,
        error: error.message
      })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      return buildResponse(
        error.statusCode,
        {
          message: error.message,
          ...error.details
        },
        corsHeaders
      )
    }

    logger.error('Unexpected error processing participation request', {
      action: Actions.PARTICIPATION_REJECTED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })
    metrics.addMetric('UnexpectedError', MetricUnit.Count, 1)

    return buildResponse(
      500,
      {
        message: 'Error processing participation request',
        error: error.message
      },
      corsHeaders
    )
  } finally {
    metrics.publishStoredMetrics()
  }
}
