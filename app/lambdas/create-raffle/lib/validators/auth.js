import { UnauthorizedError, ForbiddenError } from '../errors.js'

export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims
  if (!claims) {
    throw new UnauthorizedError('Authentication required')
  }
  return claims
}

export function ensureIsAdmin(claims) {
  const groups = claims?.['cognito:groups']

  if (!groups) {
    throw new ForbiddenError('Admin role required to create raffles')
  }

  const isAdmin =
    typeof groups === 'string'
      ? groups === 'Admin'
      : Array.isArray(groups) && groups.includes('Admin')

  if (!isAdmin) {
    throw new ForbiddenError('Admin role required to create raffles')
  }
}

export function getUserEmail(claims) {
  return claims?.email || 'unknown'
}
