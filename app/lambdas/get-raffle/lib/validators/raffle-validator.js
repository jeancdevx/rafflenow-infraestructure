import { ValidationError } from '../errors.js'

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id
  if (!raffleId) {
    throw new ValidationError('raffle_id is required')
  }
  return raffleId
}
