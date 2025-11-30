import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleImageUpload } from './handler.js'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ErrorCodes
} from './lib/errors.js'

const Actions = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  URL_GENERATED: 'URL_GENERATED',
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

    logger.info('Upload image request received', {
      action: Actions.REQUEST_RECEIVED
    })

    const result = await handleImageUpload(event)

    logger.info('Presigned URL generated successfully', {
      action: Actions.URL_GENERATED
    })

    metrics.publishStoredMetrics()

    return buildResponse(200, result)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logger.warn('Unauthorized upload attempt', {
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
      logger.warn('Forbidden upload attempt', {
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

    logger.error('Error generating presigned URL', {
      action: Actions.REQUEST_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })

    metrics.addMetric('PresignedUrlError', MetricUnit.Count, 1)
    metrics.publishStoredMetrics()

    return buildResponse(500, {
      message: 'Error generating presigned URL',
      error: error.message
    })
  }
}
