import { Logger } from '@aws-lambda-powertools/logger'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { Metrics } from '@aws-lambda-powertools/metrics'

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
