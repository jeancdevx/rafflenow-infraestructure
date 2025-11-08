import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { CalendarIcon, UsersIcon } from "lucide-react";
import { OptimizedImage } from "@/components/optimized-image";
import type { Raffle } from "../types";
import { RafflesAPI } from "../api/raffles-api";

interface RaffleCardProps {
  raffle: Raffle;
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const progress = RafflesAPI.getProgress(raffle);
  const daysRemaining = RafflesAPI.getDaysRemaining(raffle);
  const isFull = RafflesAPI.isFull(raffle);
  const isExpired = RafflesAPI.isExpired(raffle);

  const images =
    raffle.prize_images && raffle.prize_images.length > 0
      ? raffle.prize_images
      : ["/placeholder.jpg"];

  const formattedCurrent = RafflesAPI.formatNumber(raffle.current_participants);
  const formattedMax = RafflesAPI.formatNumber(raffle.max_participants);

  return (
    <Card className="overflow-hidden rounded-md shadow-none border-none border-0 p-0 max-w-sm flex flex-col">
      <div className="flex flex-col gap-y-3 flex-1">
        <Carousel
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-video max-h-60 w-full overflow-hidden bg-muted rounded-lg cursor-pointer">
                  <OptimizedImage
                    src={image}
                    alt={`${raffle.title} - Imagen ${index + 1}`}
                    className="object-cover w-full h-full"
                    priority={index === 0}
                    width={600}
                    height={400}
                    quality={85}
                  />
                  {index === 0 && (
                    <Badge
                      className="absolute top-2 left-2 bg-emerald-600/50 backdrop-blur-md border-emerald-600 text-xs"
                      variant="default"
                    >
                      {raffle.status.charAt(0).toUpperCase() +
                        raffle.status.slice(1)}
                    </Badge>
                  )}
                  {index === 0 && isFull && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="destructive"
                    >
                      Lleno
                    </Badge>
                  )}
                  {index === 0 && isExpired && !isFull && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      Finalizado
                    </Badge>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <CardHeader className="px-4 shrink-0">
          <h3 className="font-semibold text-lg line-clamp-2">{raffle.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {raffle.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-4 flex-1">
          {/* Progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participantes</span>
              <span className="font-medium">
                {formattedCurrent} / {formattedMax}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Información */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {daysRemaining === 0
                  ? "Último día"
                  : daysRemaining === 1
                  ? "1 día restante"
                  : `${daysRemaining} días restantes`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              <span>{formattedCurrent}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 shrink-0">
          <Button
            className="w-full"
            disabled={isFull || isExpired}
            asChild={!isFull && !isExpired}
          >
            {isFull ? (
              <span>Sorteo lleno</span>
            ) : isExpired ? (
              <span>Sorteo finalizado</span>
            ) : (
              <a href={`/sorteos/${raffle.raffle_id}`}>Ver detalles</a>
            )}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
