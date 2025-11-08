import { useState, useEffect } from "react";
import { intervalToDuration } from "date-fns";

interface RaffleCountdownProps {
  endDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function RaffleCountdown({ endDate }: RaffleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate);
      const now = new Date();

      if (end <= now) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const duration = intervalToDuration({
        start: now,
        end: end,
      });

      setTimeLeft({
        days: duration.days || 0,
        hours: duration.hours || 0,
        minutes: duration.minutes || 0,
        seconds: duration.seconds || 0,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-4xl lg:text-5xl font-bold tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <div className="flex items-center justify-between gap-4">
      <TimeBlock value={timeLeft.days} label="Días" />
      <TimeBlock value={timeLeft.hours} label="Horas" />
      <TimeBlock value={timeLeft.minutes} label="Minutos" />
      <TimeBlock value={timeLeft.seconds} label="Segundos" />
    </div>
  );
}
