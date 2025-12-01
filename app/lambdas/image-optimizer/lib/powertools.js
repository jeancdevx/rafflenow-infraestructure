import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'

const logger = new Logger({
  serviceName: 'image-optimizer',
  logLevel: process.env.LOG_LEVEL || 'INFO'
})

const tracer = new Tracer({
  serviceName: 'image-optimizer'
})

const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName: 'image-optimizer'
})

export { logger, tracer, metrics }
