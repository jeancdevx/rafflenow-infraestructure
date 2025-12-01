const getAllowedOrigins = () => {
  const originsEnv = process.env.CORS_ALLOWED_ORIGINS || '*'
  if (originsEnv === '*') return ['*']
  return originsEnv.split(',').map(origin => origin.trim())
}

export const getCorsHeaders = event => {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = event?.headers?.origin || event?.headers?.Origin || ''

  if (allowedOrigins.includes('*')) {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
  }

  const origin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export const buildResponse = (statusCode, body, event) => ({
  statusCode,
  headers: getCorsHeaders(event),
  body: JSON.stringify(body)
})

export default { getCorsHeaders, buildResponse }
