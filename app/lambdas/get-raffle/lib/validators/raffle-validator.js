import { ErrorCodes, ValidationError } from '../errors.js'

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id
  if (!raffleId) {
    throw new ValidationError(
      'raffle_id is required',
      400,
      ErrorCodes.MISSING_RAFFLE_ID
    )
  }
  return raffleId
}

export function calculateParticipationPercentage(
  currentParticipants,
  maxParticipants
) {
  if (!maxParticipants || maxParticipants === 0) return 0
  return parseFloat(((currentParticipants / maxParticipants) * 100).toFixed(2))
}

export function calculateDaysRemaining(endDate) {
  if (!endDate) return 0
  const now = new Date()
  const end = new Date(endDate)
  const diffMs = end - now
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
