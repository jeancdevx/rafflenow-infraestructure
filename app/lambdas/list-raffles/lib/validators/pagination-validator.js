import { ValidationError } from '../errors.js'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export function validateLimit(limitParam) {
  if (!limitParam) {
    return DEFAULT_LIMIT
  }

  const limit = parseInt(limitParam, 10)

  if (isNaN(limit) || limit <= 0) {
    throw new ValidationError('Limit must be a positive number')
  }

  if (limit > MAX_LIMIT) {
    throw new ValidationError(`Limit cannot exceed ${MAX_LIMIT}`, 400, {
      max_limit: MAX_LIMIT
    })
  }

  return limit
}

export function decodeCursor(cursor) {
  if (!cursor) {
    return null
  }

  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    throw new ValidationError('Invalid cursor format')
  }
}

export function encodeCursor(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  const encoded = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString(
    'base64'
  )
  return encoded
}
