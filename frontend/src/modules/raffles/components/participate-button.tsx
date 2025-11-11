import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { RafflesAPI } from "../api/raffles-api";
import { toast } from "sonner";
import { Loader2Icon, TicketIcon } from "lucide-react";
import type { Raffle } from "../types";

interface ParticipateButtonProps {
  raffle: Raffle;
  hasParticipated: boolean;
  onSuccess?: () => void;
  className?: string;
}

export function ParticipateButton({
  raffle,
  hasParticipated,
  onSuccess,
  className,
}: ParticipateButtonProps) {
  const { isAuthenticated, isLoading: authLoading, token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);

  const isFull = RafflesAPI.isFull(raffle);
  const isExpired = RafflesAPI.isExpired(raffle);
  const isDisabled =
    isFull || isExpired || raffle.status !== "active" || hasParticipated;

  const handleClick = () => {
    if (authLoading) {
      return;
    }

    if (!authLoading && !isAuthenticated) {
      const currentPath = `/sorteos/${raffle.raffle_id}`;
      window.location.href = `/sign-in?redirect=${encodeURIComponent(
        currentPath
      )}`;
      return;
    }

    if (isAuthenticated) {
      setIsOpen(true);
    }
  };

  const handleParticipate = async () => {
    if (!token || !user) {
      toast.error("Error de autenticación", {
        description: "No se pudo obtener la información del usuario",
      });
      return;
    }

    setIsParticipating(true);

    try {
      await RafflesAPI.participateInRaffle(
        raffle.raffle_id,
        token,
        user.name,
        user.email
      );

      toast.success("¡Participación exitosa!", {
        description: `Ahora eres parte del sorteo "${raffle.title}"`,
      });

      setIsOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error participating:", error);
      toast.error("Error al participar", {
        description: error.message || "No se pudo completar tu participación",
      });
    } finally {
      setIsParticipating(false);
    }
  };

  const getButtonText = () => {
    if (authLoading) return "Cargando...";
    if (hasParticipated) return "Ya participaste";
    if (isFull) return "Sorteo lleno";
    if (isExpired) return "Sorteo finalizado";
    if (raffle.status !== "active") return "Sorteo no disponible";
    return "Participar Ahora";
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isDisabled || authLoading}
        className={className}
        size="lg"
      >
        {authLoading ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : (
          <TicketIcon className="size-5" />
        )}
        {getButtonText()}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar participación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas participar en el sorteo{" "}
              <strong>"{raffle.title}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Premio:</span>
              <span className="font-medium">{raffle.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Participantes actuales:
              </span>
              <span className="font-medium">
                {RafflesAPI.formatNumber(raffle.current_participants)} /{" "}
                {RafflesAPI.formatNumber(raffle.max_participants)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Finaliza:</span>
              <span className="font-medium">
                {RafflesAPI.formatDate(raffle.end_date)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isParticipating}
            >
              Cancelar
            </Button>
            <Button onClick={handleParticipate} disabled={isParticipating}>
              {isParticipating && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar participación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
