import { UnauthorizedError, ForbiddenError, ErrorCodes } from '../errors.js'

export function extractClaims(event) {
  const claims = event.requestContext?.authorizer?.claims
  if (!claims) {
    throw new UnauthorizedError(
      'Authentication required',
      ErrorCodes.UNAUTHORIZED
    )
  }
  return claims
}

export function ensureIsAdmin(claims) {
  const groups = claims?.['cognito:groups']

  if (!groups) {
    throw new ForbiddenError(
      'Admin role required to upload images',
      ErrorCodes.ADMIN_REQUIRED
    )
  }

  const isAdmin =
    typeof groups === 'string'
      ? groups === 'Admin'
      : Array.isArray(groups) && groups.includes('Admin')

  if (!isAdmin) {
    throw new ForbiddenError(
      'Admin role required to upload images',
      ErrorCodes.ADMIN_REQUIRED
    )
  }
}

export function getUserEmail(claims) {
  return claims?.email || 'unknown'
}
