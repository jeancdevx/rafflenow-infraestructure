import { MetricUnit } from '@aws-lambda-powertools/metrics'

import { logger, metrics } from './lib/powertools.js'

import {
  decodeCursor,
  validateLimit
} from './lib/validators/pagination-validator.js'

import {
  queryRafflesByStatus,
  scanAllRaffles
} from './lib/repositories/raffle-repository.js'

import { buildPaginatedResponse } from './lib/services/pagination-service.js'

const Actions = {
  INPUT_VALIDATED: 'INPUT_VALIDATED',
  QUERY_BY_STATUS: 'QUERY_BY_STATUS',
  SCAN_ALL: 'SCAN_ALL',
  RESPONSE_BUILT: 'RESPONSE_BUILT'
}

export async function handleListRaffles(event) {
  const queryParams = event.queryStringParameters || {}
  const status = queryParams.status
  const limit = validateLimit(queryParams.limit)
  const lastEvaluatedKey = decodeCursor(queryParams.cursor)

  logger.info('Input validated', {
    action: Actions.INPUT_VALIDATED,
    status_filter: status || 'all',
    limit,
    has_cursor: !!lastEvaluatedKey
  })

  let response
  if (status) {
    response = await queryRafflesByStatus(status, limit, lastEvaluatedKey)
    logger.info('Queried raffles by status', {
      action: Actions.QUERY_BY_STATUS,
      status_filter: status,
      items_returned: response.items.length
    })
    metrics.addMetric('QueryByStatus', MetricUnit.Count, 1)
  } else {
    response = await scanAllRaffles(limit, lastEvaluatedKey)
    logger.info('Scanned all raffles', {
      action: Actions.SCAN_ALL,
      items_returned: response.items.length
    })
    metrics.addMetric('ScanAll', MetricUnit.Count, 1)
  }

  const paginatedResult = buildPaginatedResponse(
    response.items,
    response.lastEvaluatedKey,
    response.scannedCount
  )

  logger.info('Paginated response built', {
    action: Actions.RESPONSE_BUILT,
    count: paginatedResult.count,
    has_more: paginatedResult.has_more,
    scanned_count: paginatedResult.scanned_count
  })

  metrics.addMetric('RafflesRetrieved', MetricUnit.Count, paginatedResult.count)

  return paginatedResult
}
