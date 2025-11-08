export interface Raffle {
  raffle_id: string;
  title: string;
  description: string;
  status: "active" | "closed" | "processing" | "completed";
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  prize_images: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  winner_id?: string;
}

export interface RaffleListResponse {
  message: string;
  raffles: Raffle[];
  count: number;
}

export interface RaffleDetailResponse {
  message: string;
  raffle: Raffle;
}
