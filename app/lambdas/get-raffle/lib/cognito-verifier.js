import { CognitoJwtVerifier } from 'aws-jwt-verify'

import { logger } from './powertools.js'

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const CLIENT_ID = process.env.COGNITO_CLIENT_ID

let verifier = null

if (USER_POOL_ID && CLIENT_ID) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse: 'id',
    clientId: CLIENT_ID
  })
  logger.info('Cognito JWT Verifier initialized')
}

export async function verifyToken(authHeader) {
  if (!authHeader || !verifier) {
    return null
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const payload = await verifier.verify(token)
    const email = payload.email?.toLowerCase()
    logger.info('Token verified successfully', { email })
    return email || null
  } catch (error) {
    logger.warn('Token verification failed (optional)', {
      error: error.message
    })
    return null
  }
}
