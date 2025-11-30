import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleListRaffles } from './handler.js'
import { ValidationError, ErrorCodes } from './lib/errors.js'

const Actions = {
  REQUEST_RECEIVED: 'REQUEST_RECEIVED',
  RAFFLES_LISTED: 'RAFFLES_LISTED',
  REQUEST_FAILED: 'REQUEST_FAILED'
}

export const handler = async (event, context) => {
  try {
    logger.addContext(context)

    const queryParams = event.queryStringParameters || {}

    logger.info('List raffles request received', {
      action: Actions.REQUEST_RECEIVED,
      status_filter: queryParams.status || 'all',
      has_cursor: !!queryParams.cursor
    })

    const result = await handleListRaffles(event)

    logger.info('Raffles listed successfully', {
      action: Actions.RAFFLES_LISTED,
      count: result.count,
      has_more: result.has_more
    })

    metrics.publishStoredMetrics()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Raffles retrieved successfully',
        ...result
      })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error', {
        action: Actions.REQUEST_FAILED,
        error_code: error.errorCode,
        error: error.message
      })
      metrics.addMetric('ValidationError', MetricUnit.Count, 1)
      metrics.publishStoredMetrics()
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Validation error',
          error: error.message,
          ...error.details
        })
      }
    }

    logger.error('Error retrieving raffles', {
      action: Actions.REQUEST_FAILED,
      error_code: ErrorCodes.INTERNAL_ERROR,
      error: error.message,
      stack: error.stack
    })

    metrics.addMetric('ListRafflesError', MetricUnit.Count, 1)
    metrics.publishStoredMetrics()

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error retrieving raffles',
        error: error.message
      })
    }
  }
}
