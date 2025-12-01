import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'

export const logger = new Logger({
  serviceName: 'create-raffle',
  logLevel: process.env.LOG_LEVEL || 'INFO'
})

export const tracer = new Tracer({
  serviceName: 'create-raffle',
  captureHTTPsRequests: true
})

export const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName: 'create-raffle'
})
