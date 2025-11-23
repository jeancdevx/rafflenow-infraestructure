export function calculateDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function calculateParticipationPercentage(current, max) {
  if (!max || max === 0) return 0;
  return Math.round((current / max) * 100);
}

export function prepareRaffleResponse(raffle) {
  const status = raffle.status;

  const baseResponse = {
    raffle_id: raffle.raffle_id,
    title: raffle.title,
    description: raffle.description,
    category: raffle.category,
    prize_value: raffle.prize_value,
    image_url: raffle.image_url,
    image_thumbnail_url: raffle.image_thumbnail_url,
    status: raffle.status,
    created_at: raffle.created_at,
    end_date: raffle.end_date,
  };

  switch (status) {
    case "active":
      return {
        ...baseResponse,
        current_participants: raffle.current_participants || 0,
        max_participants: raffle.max_participants,
        days_remaining: calculateDaysRemaining(raffle.end_date),
        participation_percentage: calculateParticipationPercentage(
          raffle.current_participants || 0,
          raffle.max_participants
        ),
        can_participate: true,
      };

    case "processing":
      return {
        ...baseResponse,
        max_participants: raffle.max_participants,
        message: "Seleccionando ganador...",
        can_participate: false,
      };

    case "completed":
      return {
        ...baseResponse,
        winner_name: raffle.winner_name,
        winner_email: raffle.winner_email,
        winner_selected_at: raffle.winner_selected_at,
        total_participants:
          raffle.total_participants || raffle.current_participants || 0,
        max_participants: raffle.max_participants,
        can_participate: false,
      };

    case "cancelled":
      return {
        ...baseResponse,
        cancellation_reason: raffle.cancellation_reason || "Sorteo cancelado",
        cancelled_at: raffle.cancelled_at,
        can_participate: false,
      };

    default:
      return baseResponse;
  }
}
