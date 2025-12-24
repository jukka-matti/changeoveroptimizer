import { calculateVariance, formatElapsedTime, formatVariance } from '@/lib/timer-utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimerProgressProps {
  actualSeconds: number;
  standardSeconds: number;
}

export function TimerProgress({ actualSeconds, standardSeconds }: TimerProgressProps) {
  const { t } = useTranslation();
  const { varianceSeconds, variancePercent, status } = calculateVariance(actualSeconds, standardSeconds);

  // Calculate progress percentage
  const progressPercent = standardSeconds > 0
    ? Math.min((actualSeconds / standardSeconds) * 100, 100)
    : 0;

  // Color classes based on status
  const statusColors = {
    ahead: 'text-green-600',
    on_track: 'text-yellow-600',
    behind: 'text-red-600',
  };

  const statusIcons = {
    ahead: <CheckCircle2 className="h-4 w-4" />,
    on_track: <AlertTriangle className="h-4 w-4" />,
    behind: <XCircle className="h-4 w-4" />,
  };

  const statusText = {
    ahead: t('timer.ahead'),
    on_track: t('timer.on_track'),
    behind: t('timer.behind'),
  };

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="text-right text-sm text-muted-foreground">
          {Math.round(progressPercent)}%
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">{t('timer.total_time')}: </span>
          <span className="font-medium">{formatElapsedTime(actualSeconds)}</span>
        </div>
        <div className="text-muted-foreground">|</div>
        <div>
          <span className="text-muted-foreground">{t('timer.standard_time')}: </span>
          <span className="font-medium">{formatElapsedTime(standardSeconds)}</span>
        </div>
        <div className="text-muted-foreground">|</div>
        <div className={`flex items-center gap-1 ${statusColors[status]}`}>
          {statusIcons[status]}
          <span className="font-medium">
            {t('timer.variance')}: {formatVariance(varianceSeconds)} ({Math.abs(Math.round(variancePercent))}% {statusText[status]})
          </span>
        </div>
      </div>
    </div>
  );
}
