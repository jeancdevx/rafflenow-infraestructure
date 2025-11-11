import { differenceInDays, isPast, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RAFFLES_API } from '../constants';
import type { Raffle, RaffleListResponse, RaffleDetailResponse } from '../types';

export class RafflesAPI {
  static async getRaffles(): Promise<Raffle[]> {
    try {
      const response = await fetch(RAFFLES_API.LIST);
      
      if (!response.ok) {
        throw new Error(`Error fetching raffles: ${response.status}`);
      }

      const data: RaffleListResponse = await response.json();
      
      return data.raffles.filter(raffle => raffle.status === 'active');
    } catch (error) {
      console.error('Error in getRaffles:', error);
      throw error;
    }
  }

  static async getRaffleById(id: string, token?: string | null): Promise<{ raffle: Raffle; hasParticipated: boolean }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = token;
      }

      const response = await fetch(RAFFLES_API.DETAIL(id), {
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sorteo no encontrado');
        }
        throw new Error(`Error fetching raffle: ${response.status}`);
      }

      const data = await response.json();
      return {
        raffle: data.raffle,
        hasParticipated: data.user_has_participated || false,
      };
    } catch (error) {
      console.error('Error in getRaffleById:', error);
      throw error;
    }
  }

  static getProgress(raffle: Raffle): number {
    if (raffle.max_participants === 0) return 0;
    return Math.round((raffle.current_participants / raffle.max_participants) * 100);
  }

  static isFull(raffle: Raffle): boolean {
    return raffle.current_participants >= raffle.max_participants;
  }

  static isExpired(raffle: Raffle): boolean {
    return isPast(new Date(raffle.end_date));
  }

  static getDaysRemaining(raffle: Raffle): number {
    const days = differenceInDays(new Date(raffle.end_date), new Date());
    return Math.max(0, days);
  }

  static formatDate(dateString: string): string {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  }

  static formatDateTime(dateString: string): string {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  }

  static formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
  }

  static async participateInRaffle(
    raffleId: string,
    token: string,
    participantName: string,
    participantEmail: string
  ): Promise<{ message: string; participation_id: string }> {
    try {
      const response = await fetch(RAFFLES_API.PARTICIPATE(raffleId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          participant_name: participantName,
          participant_email: participantEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Error al participar en el sorteo';
        
        if (response.status === 400) {
          throw new Error(errorMessage);
        }
        if (response.status === 401) {
          throw new Error('Debes iniciar sesión para participar');
        }
        if (response.status === 403) {
          throw new Error('No tienes permiso para participar en este sorteo');
        }
        if (response.status === 409) {
          throw new Error('Ya participaste en este sorteo');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in participateInRaffle:', error);
      throw error;
    }
  }
}
