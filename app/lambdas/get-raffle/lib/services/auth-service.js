import { logger } from '../powertools.js'
import { verifyToken } from '../cognito-verifier.js'

export async function extractUserEmail(event) {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization

  if (!authHeader) {
    return null
  }

  try {
    const userEmail = await verifyToken(authHeader)
    return userEmail
  } catch (error) {
    logger.warn('Failed to extract user email from token', {
      error: error.message
    })
    return null
  }
}
