import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'

const logger = new Logger({
  serviceName: 'upload-image',
  logLevel: process.env.LOG_LEVEL || 'INFO'
})

const tracer = new Tracer({
  serviceName: 'upload-image'
})

const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName: 'upload-image'
})

export { logger, tracer, metrics }
