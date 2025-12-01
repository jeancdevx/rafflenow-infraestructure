import { MetricUnit } from '@aws-lambda-powertools/metrics'

import { logger, metrics } from './lib/powertools.js'

import { validateRaffleId } from './lib/validators/raffle-validator.js'

import {
  checkUserParticipation,
  getRaffleById
} from './lib/repositories/raffle-repository.js'

import { extractUserInfo } from './lib/services/auth-service.js'
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

  const { userId } = await extractUserInfo(event)
  const userHasParticipated = await checkUserParticipation(raffleId, userId)

  logger.info('User participation checked', {
    action: Actions.PARTICIPATION_CHECKED,
    user_has_participated: userHasParticipated,
    is_authenticated: !!userId
  })

  metrics.addMetric('RaffleRetrieved', MetricUnit.Count, 1)
  metrics.addDimension('RaffleStatus', raffle.status)

  return prepareRaffleResponse(raffle, userHasParticipated)
}
