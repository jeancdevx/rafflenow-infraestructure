import { ValidationError } from '../errors.js'

export function validateEventDetail(eventDetail) {
  const raffleId = eventDetail.raffle_id
  const participantEmail = eventDetail.participant_email?.toLowerCase()
  const participantName = eventDetail.participant_name
  const userId = eventDetail.user_id

  if (!raffleId) {
    throw new ValidationError('Missing raffle_id in event', {
      has_raffle_id: false
    })
  }

  if (!participantEmail) {
    throw new ValidationError('Missing participant_email in event', {
      has_email: false
    })
  }

  if (!participantName) {
    throw new ValidationError('Missing participant_name in event', {
      has_name: false
    })
  }

  if (!userId) {
    throw new ValidationError('Missing user_id - user must be authenticated', {
      has_user_id: false
    })
  }

  return {
    raffleId,
    participantEmail,
    participantName,
    userId,
    participatedAt: eventDetail.participated_at || new Date().toISOString()
  }
}
