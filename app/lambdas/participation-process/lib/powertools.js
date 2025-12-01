import { Logger } from '@aws-lambda-powertools/logger'
import { Metrics } from '@aws-lambda-powertools/metrics'
import { Tracer } from '@aws-lambda-powertools/tracer'

const serviceName = 'participation-process'

export const logger = new Logger({ serviceName })
export const tracer = new Tracer({ serviceName })
export const metrics = new Metrics({
  namespace: 'RaffleNow',
  serviceName
})
