import { ValidationError, NotFoundError, ConflictError } from "../errors.js";

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id;
  if (!raffleId) {
    throw new ValidationError("Missing raffle_id in path");
  }
  return raffleId;
}

export function ensureRaffleExists(raffle) {
  if (!raffle) {
    throw new NotFoundError("Raffle not found");
  }
}

export function ensureRaffleIsActive(raffle) {
  if (raffle.status !== "active") {
    throw new ValidationError("Raffle is not active", 400, {
      status: raffle.status,
    });
  }
}

export function ensureRaffleNotExpired(raffle) {
  const now = new Date();
  const endDate = new Date(raffle.end_date);

  if (now > endDate) {
    throw new ValidationError("Raffle has ended");
  }
}

export function ensureNoDuplicateParticipation(alreadyParticipated) {
  if (alreadyParticipated) {
    throw new ConflictError("User has already participated in this raffle");
  }
}

export function ensureRaffleHasCapacity(raffle) {
  const currentParticipants = raffle.current_participants || 0;
  const maxParticipants = raffle.max_participants;

  if (currentParticipants >= maxParticipants) {
    throw new ValidationError("Raffle has reached maximum capacity", 400, {
      current_participants: currentParticipants,
      max_participants: maxParticipants,
    });
  }
}
