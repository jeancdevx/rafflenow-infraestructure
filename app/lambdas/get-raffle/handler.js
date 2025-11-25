import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { validateRaffleId } from './lib/validators/raffle-validator.js'
import {
  getRaffleById,
  checkUserParticipation
} from './lib/repositories/raffle-repository.js'
import { extractUserEmail } from './lib/services/auth-service.js'
import { prepareRaffleResponse } from './lib/services/raffle-formatter.js'

export async function handleGetRaffle(event) {
  const raffleId = validateRaffleId(event)

  logger.info('Processing get-raffle request', { raffleId })

  const raffle = await getRaffleById(raffleId)

  const userEmail = await extractUserEmail(event)
  const userHasParticipated = await checkUserParticipation(raffleId, userEmail)

  logger.info('Raffle retrieved successfully', {
    raffleId,
    status: raffle.status,
    userHasParticipated
  })

  metrics.addMetric('RaffleRetrieved', MetricUnit.Count, 1)
  metrics.addDimension('RaffleStatus', raffle.status)

  return prepareRaffleResponse(raffle, userHasParticipated)
}
