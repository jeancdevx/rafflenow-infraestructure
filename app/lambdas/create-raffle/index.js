import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleCreateRaffle } from './handler.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ErrorCodes
} from './lib/errors.js'

const Actions = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  RAFFLE_CREATED: 'RAFFLE_CREATED',
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

export const handler = async (event, context) => {
  try {
    logger.addContext(context)

    logger.info('Create raffle request received', {
      action: Actions.REQUEST_RECEIVED
    })

    const raffle = await handleCreateRaffle(event)

    logger.info('Raffle created successfully', {
      action: Actions.RAFFLE_CREATED,
      raffle_id: raffle.id,
      raffle_title: raffle.title,
      category: raffle.category
    })

    metrics.publishStoredMetrics()

    return buildResponse(201, {
      message: 'Raffle created successfully',
      raffle: raffle
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized attempt', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('UnauthorizedAttempt', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
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
      metrics.addMetric('ForbiddenAttempt', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
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
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: 'Validation error',
        error: error.message,
        ...error.details
      })
    }

    if (error instanceof ConflictError) {
      logger.warn('Raffle ID collision', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ConflictError', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return buildResponse(error.statusCode, {
        message: error.message
      })
    }

    logger.error('Error creating raffle', {
      action: Actions.REQUEST_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
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
