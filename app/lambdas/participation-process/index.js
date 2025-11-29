import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { processParticipation } from './handler.js'

export const handler = async event => {
  logger.info('Processing participation batch', {
    batch_size: event.Records.length
  })

  const batchItemFailures = []
  let successCount = 0

  for (const record of event.Records) {
    const messageId = record.messageId

    try {
      const messageBody = JSON.parse(record.body)

      logger.appendKeys({ message_id: messageId })

      await processParticipation(messageBody)

      successCount++
    } catch (error) {
      logger.error('Error processing participation', {
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
        'user_id'
      ])
    }
  }

  logger.info('Batch processing completed', {
    total: event.Records.length,
    success: successCount,
    failures: batchItemFailures.length
  })

  metrics.publishStoredMetrics()

  return {
    batchItemFailures
  }
}
