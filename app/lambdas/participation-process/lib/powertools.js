import { Logger } from '@aws-lambda-powertools/logger'
import { Tracer } from '@aws-lambda-powertools/tracer'
import { Metrics } from '@aws-lambda-powertools/metrics'

const serviceName = 'participation-process'

export const logger = new Logger({ serviceName })
export const tracer = new Tracer({ serviceName })
export const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName
})
