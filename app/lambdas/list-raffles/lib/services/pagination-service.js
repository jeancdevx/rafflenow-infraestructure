import { encodeCursor } from '../validators/pagination-validator.js'

export function buildPaginatedResponse(items, lastEvaluatedKey, scannedCount) {
  const nextCursor = encodeCursor(lastEvaluatedKey)

  return {
    raffles: items,
    count: items.length,
    scanned_count: scannedCount,
    has_more: !!lastEvaluatedKey,
    next_cursor: nextCursor
  }
}
