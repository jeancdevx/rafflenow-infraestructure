import { Logger } from '@aws-lambda-powertools/logger'

const serviceName = process.env.SERVICE_NAME || 'post-confirmation'

export const logger = new Logger({
  serviceName,
  logLevel: process.env.LOG_LEVEL || 'INFO'
})
