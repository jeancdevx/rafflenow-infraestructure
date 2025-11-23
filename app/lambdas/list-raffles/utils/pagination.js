const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function validateLimit(limitParam) {
  if (!limitParam) {
    return DEFAULT_LIMIT;
  }

  const limit = parseInt(limitParam);

  if (isNaN(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
}

export function decodeCursor(cursor) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function encodeCursor(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null;
  }

  const jsonString = JSON.stringify(lastEvaluatedKey);
  return Buffer.from(jsonString).toString("base64");
}

export function buildPaginatedResponse(items, lastEvaluatedKey, scannedCount) {
  const hasMore = !!lastEvaluatedKey;
  const nextCursor = encodeCursor(lastEvaluatedKey);

  return {
    raffles: items || [],
    count: items?.length || 0,
    has_more: hasMore,
    next_cursor: nextCursor,
    scanned_count: scannedCount,
  };
}
