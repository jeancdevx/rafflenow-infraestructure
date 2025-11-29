import { MetricUnit } from '@aws-lambda-powertools/metrics'
import { incrementParticipantCount } from './lib/repositories/raffle-repository.js'
import {
  checkExistingParticipation,
  createParticipation
} from './lib/repositories/participation-repository.js'
import { logger, metrics } from './lib/powertools.js'
import { validateEventDetail } from './lib/validators/event-validator.js'

export async function processParticipation(messageBody) {
  const eventDetail = messageBody.detail || messageBody

  const participationData = validateEventDetail(eventDetail)

  logger.appendKeys({
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail,
    user_id: participationData.userId
  })

  logger.info('Processing participation', {
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail
  })

  const alreadyExists = await checkExistingParticipation(
    participationData.userId,
    participationData.raffleId
  )

  if (alreadyExists) {
    logger.warn('Duplicate participation detected, skipping', {
      raffle_id: participationData.raffleId,
      user_id: participationData.userId,
      participant_email: participationData.participantEmail
    })
    return
  }

  await incrementParticipantCount(
    participationData.raffleId,
    participationData.participatedAt
  )

  await createParticipation(participationData)

  metrics.addMetric('ParticipationProcessed', MetricUnit.Count, 1)

  logger.info('Participation processed successfully', {
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail
  })
}
