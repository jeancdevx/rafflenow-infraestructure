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

const Actions = {
  AUTH_VALIDATED: 'AUTH_VALIDATED',
  RAFFLE_VALIDATED: 'RAFFLE_VALIDATED',
  RAFFLE_CLOSING: 'RAFFLE_CLOSING',
  RAFFLE_CLOSED: 'RAFFLE_CLOSED',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED',
  NO_PARTICIPANTS: 'NO_PARTICIPANTS'
}

export async function handleCloseRaffle(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const userId = getUserId(claims)
  const raffleId = validateRaffleId(event)

  logger.appendKeys({ raffle_id: raffleId, user_id: userId })

  logger.info('Admin authenticated for close operation', {
    action: Actions.AUTH_VALIDATED,
    closed_by: userId
  })

  const raffle = await getRaffle(raffleId)
  ensureRaffleIsActive(raffle)

  logger.appendKeys({ raffle_title: raffle.title })

  const hasParticipants = raffle.current_participants > 0

  logger.info('Raffle validated for closing', {
    action: Actions.RAFFLE_VALIDATED,
    has_participants: hasParticipants,
    current_participants: raffle.current_participants,
    raffle_status: raffle.status
  })

  logger.info('Closing raffle', {
    action: Actions.RAFFLE_CLOSING,
    has_participants: hasParticipants
  })

  const updatedRaffle = await closeRaffle(raffleId, userId, hasParticipants)

  logger.info('Raffle closed in database', {
    action: Actions.RAFFLE_CLOSED,
    new_status: updatedRaffle.status
  })

  if (hasParticipants) {
    await publishRaffleClosedEvent(updatedRaffle, userId)
    logger.info('Raffle closed event published for winner selection', {
      action: Actions.EVENT_PUBLISHED
    })
  } else {
    logger.info('Raffle closed without participants, no event emitted', {
      action: Actions.NO_PARTICIPANTS
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
