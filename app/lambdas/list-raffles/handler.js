import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import {
  validateLimit,
  decodeCursor
} from './lib/validators/pagination-validator.js'
import {
  queryRafflesByStatus,
  scanAllRaffles
} from './lib/repositories/raffle-repository.js'
import { buildPaginatedResponse } from './lib/services/pagination-service.js'

export async function handleListRaffles(event) {
  const queryParams = event.queryStringParameters || {}
  const status = queryParams.status
  const limit = validateLimit(queryParams.limit)
  const lastEvaluatedKey = decodeCursor(queryParams.cursor)

  logger.info('Processing list raffles request', {
    status,
    limit,
    hasCursor: !!lastEvaluatedKey
  })

  let response
  if (status) {
    response = await queryRafflesByStatus(status, limit, lastEvaluatedKey)
    metrics.addMetric('QueryByStatus', MetricUnit.Count, 1)
  } else {
    response = await scanAllRaffles(limit, lastEvaluatedKey)
    metrics.addMetric('ScanAll', MetricUnit.Count, 1)
  }

  const paginatedResult = buildPaginatedResponse(
    response.items,
    response.lastEvaluatedKey,
    response.scannedCount
  )

  logger.info('Raffles retrieved successfully', {
    count: paginatedResult.count,
    hasMore: paginatedResult.has_more,
    scannedCount: paginatedResult.scanned_count
  })

  metrics.addMetric('RafflesRetrieved', MetricUnit.Count, paginatedResult.count)

  return paginatedResult
}
