import { MetricUnit } from '@aws-lambda-powertools/metrics'

import { logger, metrics } from './lib/powertools.js'

import { validateEventDetail } from './lib/validators/event-validator.js'

import {
  checkExistingParticipation,
  createParticipation
} from './lib/repositories/participation-repository.js'
import {
  getRaffle,
  incrementParticipantCount
} from './lib/repositories/raffle-repository.js'

import { sendParticipationConfirmation } from './lib/services/email-service.js'

import { ErrorCodes } from './lib/errors.js'

const Actions = {
  PARTICIPATION_PROCESSING: 'PARTICIPATION_PROCESSING',
  DUPLICATE_SKIPPED: 'DUPLICATE_SKIPPED',
  PARTICIPATION_SAVED: 'PARTICIPATION_SAVED',
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_FAILED: 'EMAIL_FAILED'
}

export async function processParticipation(messageBody) {
  const eventDetail = messageBody.detail || messageBody

  const participationData = validateEventDetail(eventDetail)

  logger.appendKeys({
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail,
    user_id: participationData.userId,
    correlation_id: participationData.correlationId
  })

  logger.info('Processing participation', {
    action: Actions.PARTICIPATION_PROCESSING,
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail
  })

  const alreadyExists = await checkExistingParticipation(
    participationData.userId,
    participationData.raffleId
  )

  if (alreadyExists) {
    logger.warn('Duplicate participation detected, skipping', {
      action: Actions.DUPLICATE_SKIPPED,
      error_code: ErrorCodes.DUPLICATE_PARTICIPATION,
      raffle_id: participationData.raffleId,
      user_id: participationData.userId,
      participant_email: participationData.participantEmail
    })
    return
  }

  const newCount = await incrementParticipantCount(
    participationData.raffleId,
    participationData.participatedAt
  )

  participationData.participationNumber = newCount

  await createParticipation(participationData)

  metrics.addMetric('ParticipationProcessed', MetricUnit.Count, 1)

  const raffle = await getRaffle(participationData.raffleId)

  if (raffle) {
    logger.appendKeys({
      raffle_title: raffle.title
    })

    const emailSent = await sendParticipationConfirmation(
      participationData,
      raffle
    )

    if (emailSent) {
      logger.info('Confirmation email sent', {
        action: Actions.EMAIL_SENT
      })
      metrics.addMetric('ParticipationEmailSent', MetricUnit.Count, 1)
    } else {
      logger.warn('Failed to send confirmation email', {
        action: Actions.EMAIL_FAILED,
        error_code: ErrorCodes.EMAIL_SEND_FAILED
      })
    }
  }

  logger.info('Participation processed successfully', {
    action: Actions.PARTICIPATION_SAVED,
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail,
    participation_number: newCount
  })
}
