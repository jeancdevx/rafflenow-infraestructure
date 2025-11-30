import { logger, metrics } from './lib/powertools.js'
import { handleCloseRaffle } from './handler.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ErrorCodes
} from './lib/errors.js'

const Actions = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  RAFFLE_CLOSED: 'RAFFLE_CLOSED',
  REQUEST_FAILED: 'REQUEST_FAILED'
}

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
})

export const handler = async (event) => {
  logger.info('Close raffle request received', {
    action: Actions.REQUEST_RECEIVED,
    path: event.path
  })

  try {
    const result = await handleCloseRaffle(event)

    logger.info('Raffle closed successfully', {
      action: Actions.RAFFLE_CLOSED,
      raffle_id: result.raffle?.id
    })

    return buildResponse(200, result)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized attempt', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('UnauthorizedAttempt', 'Count', 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ForbiddenError) {
      logger.warn('Forbidden attempt', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ForbiddenAttempt', 'Count', 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof NotFoundError) {
      logger.warn('Resource not found', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ResourceNotFound', 'Count', 1)
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    if (error instanceof ValidationError) {
      logger.warn('Validation error', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ValidationError', 'Count', 1)
      return buildResponse(error.statusCode, {
        message: error.message,
        ...error.details
      })
    }

    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('Concurrent close attempt detected', {
        action: Actions.REQUEST_FAILED,
        error_code: ErrorCodes.CONCURRENT_CLOSE
      })
      metrics.addMetric('ConcurrentCloseAttempt', 'Count', 1)
      return buildResponse(409, {
        message: 'Raffle is not in active status or was already closed'
      })
    }

    logger.error('Unexpected error closing raffle', {
      action: Actions.REQUEST_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })
    metrics.addMetric('UnexpectedError', 'Count', 1)

    return buildResponse(500, {
      message: 'Error closing raffle',
      error: error.message
    })
  } finally {
    metrics.publishStoredMetrics()
  }
}
