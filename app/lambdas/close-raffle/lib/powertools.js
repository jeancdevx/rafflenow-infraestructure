import { Logger } from '@aws-lambda-powertools/logger'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { Metrics } from '@aws-lambda-powertools/metrics'

export const logger = new Logger({
  serviceName: 'close-raffle',
  logLevel: process.env.LOG_LEVEL || 'INFO'
})

export const tracer = new Tracer({ serviceName: 'close-raffle' })

export const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName: 'close-raffle'
})
