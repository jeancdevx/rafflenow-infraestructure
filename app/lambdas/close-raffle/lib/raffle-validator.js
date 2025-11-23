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

export function validateRaffleForClosure(raffle) {
  if (raffle.status !== "active") {
    return {
      valid: false,
      error: "Raffle is not active",
      currentStatus: raffle.status,
    };
  }

  return {
    valid: true,
    error: null,
  };
}
