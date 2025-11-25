import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { handleListRaffles } from './handler.js'
import { ValidationError } from './lib/errors.js'

export const handler = async (event, context) => {
  try {
    logger.addContext(context)

    const result = await handleListRaffles(event)

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
      logger.warn('Validation error', { error: error.message })
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
