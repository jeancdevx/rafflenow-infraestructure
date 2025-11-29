function calculateParticipationPercentage(
  currentParticipants,
  maxParticipants
) {
  if (!maxParticipants || maxParticipants === 0) return 0
  return parseFloat(((currentParticipants / maxParticipants) * 100).toFixed(2))
}

function calculateDaysRemaining(endDate) {
  if (!endDate) return 0
  const now = new Date()
  const end = new Date(endDate)
  const diffMs = end - now
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function prepareRaffleResponse(raffle, userHasParticipated = false) {
  const baseResponse = {
    raffle_id: raffle.raffle_id,
    title: raffle.title,
    description: raffle.description,
    status: raffle.status,
    start_date: raffle.start_date,
    end_date: raffle.end_date,
    prize_value: raffle.prize_value,
    category: raffle.category,
    prize_images: raffle.prize_images || [],
    created_at: raffle.created_at,
    updated_at: raffle.updated_at,
    user_has_participated: userHasParticipated
  }

  switch (raffle.status) {
    case 'active':
      return {
        ...baseResponse,
        max_participants: raffle.max_participants,
        current_participants: raffle.current_participants,
        participation_percentage: calculateParticipationPercentage(
          raffle.current_participants,
          raffle.max_participants
        ),
        days_remaining: calculateDaysRemaining(raffle.end_date),
        can_participate: !userHasParticipated
      }

    case 'processing':
      return {
        ...baseResponse,
        max_participants: raffle.max_participants,
        message: 'Seleccionando ganador...',
        participation_percentage: 100,
        days_remaining: 0,
        can_participate: false
      }

    case 'completed':
      return {
        ...baseResponse,
        max_participants: raffle.max_participants,
        total_participants: raffle.current_participants,
        winner_name: raffle.winner_name || null,
        winner_selected_at: raffle.winner_selected_at || null,
        completed_at: raffle.completed_at || null,
        participation_percentage: 100,
        days_remaining: 0,
        can_participate: false
      }

    case 'cancelled':
      return {
        ...baseResponse,
        cancellation_reason: raffle.cancellation_reason || 'Sorteo cancelado',
        cancelled_at: raffle.cancelled_at || null,
        cancelled_by: raffle.cancelled_by || null,
        participation_percentage: calculateParticipationPercentage(
          raffle.current_participants,
          raffle.max_participants
        ),
        days_remaining: 0,
        can_participate: false
      }

    default:
      return {
        ...baseResponse,
        max_participants: raffle.max_participants,
        current_participants: raffle.current_participants,
        participation_percentage: calculateParticipationPercentage(
          raffle.current_participants,
          raffle.max_participants
        ),
        days_remaining: calculateDaysRemaining(raffle.end_date)
      }
  }
}
