import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { processParticipation } from './handler.js'
import { ErrorCodes } from './lib/errors.js'

const Actions = {
  BATCH_STARTED: 'BATCH_STARTED',
  BATCH_COMPLETED: 'BATCH_COMPLETED',
  PARTICIPATION_PROCESSING: 'PARTICIPATION_PROCESSING',
  PARTICIPATION_SAVED: 'PARTICIPATION_SAVED',
  PARTICIPATION_FAILED: 'PARTICIPATION_FAILED'
}

export const handler = async (event) => {
  logger.info('Processing participation batch', {
    action: Actions.BATCH_STARTED,
    batch_size: event.Records.length
  })

  const batchItemFailures = []
  let successCount = 0

  for (const record of event.Records) {
    const messageId = record.messageId

    try {
      const messageBody = JSON.parse(record.body)
      const correlationId = messageBody.detail?.correlation_id

      logger.appendKeys({
        message_id: messageId,
        correlation_id: correlationId
      })

      logger.info('Processing participation record', {
        action: Actions.PARTICIPATION_PROCESSING
      })

      await processParticipation(messageBody)

      successCount++
    } catch (error) {
      const errorCode = error.errorCode || ErrorCodes.INTERNAL_ERROR

      logger.error('Error processing participation', {
        action: Actions.PARTICIPATION_FAILED,
        error_code: errorCode,
        error: error.message,
        error_name: error.name,
        message_id: messageId
      })

      batchItemFailures.push({
        itemIdentifier: messageId
      })

      metrics.addMetric('ParticipationProcessingError', MetricUnit.Count, 1)
    } finally {
      logger.removeKeys([
        'raffle_id',
        'participant_email',
        'message_id',
        'user_id',
        'correlation_id',
        'raffle_title'
      ])
    }
  }

  logger.info('Batch processing completed', {
    action: Actions.BATCH_COMPLETED,
    total: event.Records.length,
    success: successCount,
    failures: batchItemFailures.length
  })

  metrics.publishStoredMetrics()

  return {
    batchItemFailures
  }
}
