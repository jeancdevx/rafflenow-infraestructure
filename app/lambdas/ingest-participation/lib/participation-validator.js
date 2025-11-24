import { logger } from "./powertools.js";

export function validateRaffleId(event) {
  const raffleId = event.pathParameters?.id;

  if (!raffleId) {
    return {
      valid: false,
      raffleId: null,
      error: "Missing raffle_id in path",
    };
  }

  return {
    valid: true,
    raffleId: raffleId,
    error: null,
  };
}

export function validateRaffleStatus(raffle) {
  if (raffle.status !== "active") {
    return {
      valid: false,
      error: "Raffle is not active",
      status: raffle.status,
    };
  }

  return {
    valid: true,
    error: null,
  };
}

export function validateRaffleCapacity(raffle) {
  const currentParticipants = raffle.current_participants || 0;
  const maxParticipants = raffle.max_participants;

  if (currentParticipants >= maxParticipants) {
    return {
      valid: false,
      error: "Raffle has reached maximum capacity",
      current: currentParticipants,
      max: maxParticipants,
    };
  }

  return {
    valid: true,
    error: null,
  };
}

export function validateRaffleEndDate(raffle) {
  const now = new Date();
  const endDate = new Date(raffle.end_date);

  if (now > endDate) {
    return {
      valid: false,
      error: "Raffle has ended",
      end_date: raffle.end_date,
    };
  }

  return {
    valid: true,
    error: null,
  };
}

export function validateNoDuplicateParticipation(alreadyParticipated) {
  if (alreadyParticipated) {
    return {
      valid: false,
      error: "User has already participated in this raffle",
    };
  }

  return {
    valid: true,
    error: null,
  };
}
