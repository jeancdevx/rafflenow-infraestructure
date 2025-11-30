import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { validateRaffleId } from './lib/validators/raffle-validator.js'
import {
  getRaffleById,
  checkUserParticipation
} from './lib/repositories/raffle-repository.js'
import { extractUserEmail } from './lib/services/auth-service.js'
import { prepareRaffleResponse } from './lib/services/raffle-formatter.js'

const Actions = {
  INPUT_VALIDATED: 'INPUT_VALIDATED',
  RAFFLE_FETCHED: 'RAFFLE_FETCHED',
  PARTICIPATION_CHECKED: 'PARTICIPATION_CHECKED'
}

export async function handleGetRaffle(event) {
  const raffleId = validateRaffleId(event)

  logger.appendKeys({ raffle_id: raffleId })

  logger.info('Input validated', {
    action: Actions.INPUT_VALIDATED
  })

  const raffle = await getRaffleById(raffleId)

  logger.appendKeys({ raffle_title: raffle.title })

  logger.info('Raffle fetched from database', {
    action: Actions.RAFFLE_FETCHED,
    raffle_status: raffle.status,
    current_participants: raffle.current_participants
  })

  const userEmail = await extractUserEmail(event)
  const userHasParticipated = await checkUserParticipation(raffleId, userEmail)

  logger.info('User participation checked', {
    action: Actions.PARTICIPATION_CHECKED,
    user_has_participated: userHasParticipated,
    is_authenticated: !!userEmail
  })

  metrics.addMetric('RaffleRetrieved', MetricUnit.Count, 1)
  metrics.addDimension('RaffleStatus', raffle.status)

  return prepareRaffleResponse(raffle, userHasParticipated)
}
