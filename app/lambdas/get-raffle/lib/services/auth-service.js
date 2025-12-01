import { verifyToken } from '../cognito-verifier.js'
import { logger } from '../powertools.js'

export async function extractUserInfo(event) {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization

  if (!authHeader) {
    return { email: null, userId: null }
  }

  try {
    const userInfo = await verifyToken(authHeader)
    return userInfo || { email: null, userId: null }
  } catch (error) {
    logger.warn('Failed to extract user info from token', {
      error: error.message
    })
    return { email: null, userId: null }
  }
}

export async function extractUserEmail(event) {
  const { email } = await extractUserInfo(event)
  return email
}
