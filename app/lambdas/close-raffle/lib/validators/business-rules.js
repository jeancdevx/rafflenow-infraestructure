import { ValidationError, ErrorCodes } from '../errors.js'

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id
  if (!raffleId) {
    throw new ValidationError(
      'Missing raffle_id in path',
      400,
      {},
      ErrorCodes.MISSING_RAFFLE_ID
    )
  }
  return raffleId
}

export function ensureRaffleIsActive(raffle) {
  if (raffle.status !== 'active') {
    throw new ValidationError(
      'Raffle is not active',
      400,
      { status: raffle.status },
      ErrorCodes.RAFFLE_NOT_ACTIVE
    )
  }
}
