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

export function validateParticipationData(body) {
  const requiredFields = ["participant_name", "participant_email"];

  for (const field of requiredFields) {
    if (!body[field]) {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
        data: null,
      };
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.participant_email)) {
    return {
      valid: false,
      error: "Invalid email format",
      data: null,
    };
  }

  if (body.participant_name.trim().length < 2) {
    return {
      valid: false,
      error: "Participant name must be at least 2 characters",
      data: null,
    };
  }

  if (body.participant_name.length > 100) {
    return {
      valid: false,
      error: "Participant name must be at most 100 characters",
      data: null,
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      participant_email: body.participant_email.toLowerCase().trim(),
      participant_name: body.participant_name.trim(),
      participant_phone: body.participant_phone || null,
    },
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
  if (raffle.current_participants >= raffle.max_participants) {
    return {
      valid: false,
      error: "Raffle is full",
      current_participants: raffle.current_participants,
      max_participants: raffle.max_participants,
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
