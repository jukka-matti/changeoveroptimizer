import { Step } from '@/types/smed';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface StepIndicatorProps {
  currentStep: Step;
  currentStepIndex: number;
  totalSteps: number;
  stepElapsedSeconds: number;
}

export function StepIndicator({
  currentStep,
  currentStepIndex,
  totalSteps,
  stepElapsedSeconds,
}: StepIndicatorProps) {
  const { t } = useTranslation();

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Determine if step is on track
  const isOverTime = stepElapsedSeconds > currentStep.durationSeconds;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Step Number */}
          <div className="text-sm text-muted-foreground">
            {t('timer.step_x_of_y', {
              current: currentStepIndex + 1,
              total: totalSteps,
            })}
          </div>

          {/* Step Description */}
          <div className="text-lg font-semibold line-clamp-2">
            {currentStep.description}
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {t(`smed.categories.${currentStep.category}`)}
            </Badge>
            <Badge variant={currentStep.operationType === 'internal' ? 'destructive' : 'default'}>
              {t(`smed.${currentStep.operationType}`)}
            </Badge>
          </div>

          {/* Time Comparison */}
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <div className="text-muted-foreground text-xs">
                {t('timer.standard_time')}
              </div>
              <div className="font-medium">
                {formatTime(currentStep.durationSeconds)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                Actual Time
              </div>
              <div className={`font-medium ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(stepElapsedSeconds)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
