import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { OptimizedImage } from "@/components/optimized-image";
import { CalendarIcon, TicketIcon, OctagonAlertIcon } from "lucide-react";
import { RafflesAPI } from "../api/raffles-api";
import type { Raffle } from "../types";
import { RaffleCountdown } from "./raffle-countdown";

interface RaffleDetailProps {
  raffleId: string;
}

export function RaffleDetail({ raffleId }: RaffleDetailProps) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadRaffle();
  }, [raffleId]);

  const loadRaffle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RafflesAPI.getRaffleById(raffleId);
      setRaffle(data);
    } catch (err) {
      console.error("Error loading raffle:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar el sorteo"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="max-w-7xl mx-auto">
        <Alert variant="destructive">
          <OctagonAlertIcon className="h-4 w-4" />
          <AlertDescription>
            {error || "Sorteo no encontrado"}
            <a href="/sorteos" className="ml-2 underline hover:no-underline">
              Volver a sorteos
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const images =
    raffle.prize_images && raffle.prize_images.length > 0
      ? raffle.prize_images
      : ["/placeholder.jpg"];

  const progress = RafflesAPI.getProgress(raffle);
  const isFull = RafflesAPI.isFull(raffle);
  const isExpired = RafflesAPI.isExpired(raffle);
  const formattedCurrent = RafflesAPI.formatNumber(raffle.current_participants);
  const formattedMax = RafflesAPI.formatNumber(raffle.max_participants);

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="font-semibold text-muted-foreground"
              href="/"
            >
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              className="font-semibold text-muted-foreground"
              href="/sorteos"
            >
              Sorteos
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold line-clamp-1">
              {raffle.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-lg">
            <OptimizedImage
              src={images[selectedImage]}
              alt={`${raffle.title} - Imagen ${selectedImage + 1}`}
              className="object-cover w-full h-full"
              priority={true}
              width={1200}
              height={800}
              quality={90}
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-video overflow-hidden rounded-md border-2 transition-all hover:opacity-80 ${
                    selectedImage === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="object-cover w-full h-full"
                    priority={false}
                    width={200}
                    height={150}
                    quality={75}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge
              className="bg-emerald-50 backdrop-blur-md text-emerald-800 font-semibold border-emerald-600"
              variant="default"
            >
              {raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)}
            </Badge>
            {isFull && <Badge variant="destructive">Lleno</Badge>}
            {isExpired && <Badge variant="secondary">Finalizado</Badge>}
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold">{raffle.title}</h1>

          <div className="bg-muted/50 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">Termina en:</p>
            <RaffleCountdown endDate={raffle.end_date} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Participantes</span>
              <span className="text-sm font-bold">
                {formattedCurrent} / {formattedMax}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <Button
            className="w-full h-12 text-lg"
            size="lg"
            disabled={isFull || isExpired}
          >
            <TicketIcon className="mr-2 h-5 w-5" />
            {isFull
              ? "Sorteo Lleno"
              : isExpired
              ? "Sorteo Finalizado"
              : "Participar Ahora"}
          </Button>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Descripción</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {raffle.description}
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold">Detalles del Sorteo</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                <div className="p-2 bg-emerald-500/10 rounded-md">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Fecha de Inicio:</p>
                  <p className="text-sm text-muted-foreground">
                    {RafflesAPI.formatDate(raffle.start_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                <div className="p-2 bg-emerald-500/10 rounded-md">
                  <CalendarIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Fecha de Fin:</p>
                  <p className="text-sm text-muted-foreground">
                    {RafflesAPI.formatDate(raffle.end_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                <div className="p-2 bg-emerald-500/10 rounded-md">
                  <TicketIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Costo por participación:
                  </p>
                  <p className="text-sm text-muted-foreground">Gratis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
