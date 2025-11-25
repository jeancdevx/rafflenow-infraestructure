export function prepareRaffleResponse(raffle, userHasParticipated = false) {
  return {
    raffle_id: raffle.raffle_id,
    title: raffle.title,
    description: raffle.description,
    status: raffle.status,
    start_date: raffle.start_date,
    end_date: raffle.end_date,
    max_participants: raffle.max_participants,
    current_participants: raffle.current_participants,
    prize_value: raffle.prize_value,
    category: raffle.category,
    prize_images: raffle.prize_images || [],
    created_at: raffle.created_at,
    updated_at: raffle.updated_at,
    user_has_participated: userHasParticipated
  }
}
