import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ErrorCodes
} from '../errors.js'

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id
  if (!raffleId) {
    throw new ValidationError(
      'Missing raffle_id in path',
      400,
      {},
      ErrorCodes.VALIDATION_FAILED
    )
  }
  return raffleId
}

export function ensureRaffleExists(raffle) {
  if (!raffle) {
    throw new NotFoundError('Raffle not found', ErrorCodes.RAFFLE_NOT_FOUND)
  }
}

export function ensureRaffleIsActive(raffle) {
  if (raffle.status !== 'active') {
    throw new ValidationError(
      'Raffle is not active',
      400,
      { status: raffle.status },
      ErrorCodes.RAFFLE_CLOSED
    )
  }
}

export function ensureRaffleNotExpired(raffle) {
  const now = new Date()
  const endDate = new Date(raffle.end_date)

  if (now > endDate) {
    throw new ValidationError(
      'Raffle has ended',
      400,
      {},
      ErrorCodes.RAFFLE_EXPIRED
    )
  }
}

export function ensureNoDuplicateParticipation(alreadyParticipated) {
  if (alreadyParticipated) {
    throw new ConflictError(
      'User has already participated in this raffle',
      {},
      ErrorCodes.DUPLICATE_PARTICIPATION
    )
  }
}

export function ensureRaffleHasCapacity(raffle) {
  const currentParticipants = raffle.current_participants || 0
  const maxParticipants = raffle.max_participants

  if (currentParticipants >= maxParticipants) {
    throw new ValidationError(
      'Raffle has reached maximum capacity',
      400,
      {
        current_participants: currentParticipants,
        max_participants: maxParticipants
      },
      ErrorCodes.RAFFLE_FULL
    )
  }
}
