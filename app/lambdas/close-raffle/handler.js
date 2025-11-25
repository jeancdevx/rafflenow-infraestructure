import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import {
  extractClaims,
  ensureIsAdmin,
  getUserId
} from './lib/validators/auth.js'
import {
  validateRaffleId,
  ensureRaffleIsActive
} from './lib/validators/business-rules.js'
import { getRaffle } from './lib/repositories/raffle-repository.js'
import { closeRaffle } from './lib/services/raffle-service.js'
import { publishRaffleClosedEvent } from './lib/services/event-publisher.js'

export async function handleCloseRaffle(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const userId = getUserId(claims)
  const raffleId = validateRaffleId(event)

  logger.appendKeys({ raffle_id: raffleId, user_id: userId })

  logger.info('Processing raffle close request', {
    raffle_id: raffleId,
    closed_by: userId
  })

  const raffle = await getRaffle(raffleId)
  ensureRaffleIsActive(raffle)

  const hasParticipants = raffle.current_participants > 0

  logger.info('Closing raffle', {
    raffle_id: raffleId,
    has_participants: hasParticipants,
    current_participants: raffle.current_participants
  })

  const updatedRaffle = await closeRaffle(raffleId, userId, hasParticipants)

  if (hasParticipants) {
    logger.info('Publishing raffle.closed event for winner selection', {
      raffle_id: raffleId
    })
    await publishRaffleClosedEvent(updatedRaffle, userId)
  } else {
    logger.info('Raffle closed without participants, no event emission', {
      raffle_id: raffleId
    })
  }

  metrics.addMetric('RaffleClosed', MetricUnit.Count, 1)

  const message = hasParticipants
    ? 'Raffle closed successfully and winner selection initiated'
    : 'Raffle closed successfully without participants'

  return {
    message,
    raffle: updatedRaffle
  }
}
