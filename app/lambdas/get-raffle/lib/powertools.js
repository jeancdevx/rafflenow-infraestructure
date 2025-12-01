import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'

const SERVICE_NAME = 'get-raffle'

export const logger = new Logger({ serviceName: SERVICE_NAME })
export const tracer = new Tracer({ serviceName: SERVICE_NAME })
export const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName: SERVICE_NAME
})
