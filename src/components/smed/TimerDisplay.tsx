import { formatElapsedTime } from '@/lib/timer-utils';

interface TimerDisplayProps {
  elapsedSeconds: number;
}

export function TimerDisplay({ elapsedSeconds }: TimerDisplayProps) {
  return (
    <div className="text-8xl font-mono font-bold tracking-tight">
      {formatElapsedTime(elapsedSeconds)}
    </div>
  );
}
