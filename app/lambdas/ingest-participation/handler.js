import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import {
  extractClaims,
  getUserEmail,
  getUserName,
  getUserId,
  ensureNotAdmin
} from './lib/validators/auth.js'
import {
  validateRaffleId,
  ensureRaffleExists,
  ensureRaffleIsActive,
  ensureRaffleNotExpired,
  ensureNoDuplicateParticipation,
  ensureRaffleHasCapacity
} from './lib/validators/business-rules.js'
import {
  getRaffle,
  checkExistingParticipation
} from './lib/repositories/raffle-repository.js'
import { publishParticipationReceivedEvent } from './lib/services/event-publisher.js'

export async function handleParticipationRequest(event) {
  const claims = extractClaims(event)

  const userEmail = getUserEmail(claims)
  const userName = getUserName(claims)
  const userId = getUserId(claims)

  logger.appendKeys({
    user_email: userEmail,
    user_name: userName,
    user_id: userId
  })

  ensureNotAdmin(claims)

  const raffleId = validateRaffleId(event)
  logger.appendKeys({ raffle_id: raffleId })

  const participantData = {
    participant_email: userEmail.toLowerCase(),
    participant_name: userName,
    user_id: userId
  }

  logger.info('Processing participation request', {
    participant_email: participantData.participant_email,
    participant_name: participantData.participant_name
  })

  const raffle = await getRaffle(raffleId)
  ensureRaffleExists(raffle)
  ensureRaffleIsActive(raffle)
  ensureRaffleNotExpired(raffle)

  const alreadyParticipated = await checkExistingParticipation(raffleId, userId)
  ensureNoDuplicateParticipation(alreadyParticipated)

  ensureRaffleHasCapacity(raffle)

  await publishParticipationReceivedEvent({
    raffleId,
    raffle,
    participantData
  })

  logger.info('Participation request accepted', {
    raffle_id: raffleId,
    participant_email: participantData.participant_email
  })

  metrics.addMetric('ParticipationReceived', MetricUnit.Count, 1)

  return {
    raffle_id: raffleId,
    participant_email: participantData.participant_email
  }
}
