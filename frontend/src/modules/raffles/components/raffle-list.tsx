import { useState, useEffect } from "react";
import { RaffleCard } from "./raffle-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RafflesAPI } from "../api/raffles-api";
import type { Raffle } from "../types";
import { OctagonAlertIcon } from "lucide-react";

export function RaffleList() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RafflesAPI.getRaffles();
      setRaffles(data);
    } catch (err) {
      console.error("Error loading raffles:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los sorteos"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <OctagonAlertIcon className="h-4 w-4" />
        <AlertDescription>
          {error}
          <button
            onClick={loadRaffles}
            className="ml-2 underline hover:no-underline"
          >
            Reintentar
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (raffles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No hay sorteos activos en este momento
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {raffles.map((raffle) => (
        <RaffleCard key={raffle.raffle_id} raffle={raffle} />
      ))}
    </div>
  );
}
