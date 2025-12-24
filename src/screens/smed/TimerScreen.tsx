import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTimerStore } from '@/stores/timer-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TimerDisplay } from '@/components/smed/TimerDisplay';
import { TimerProgress } from '@/components/smed/TimerProgress';
import { StepIndicator } from '@/components/smed/StepIndicator';
import { StepNotes } from '@/components/smed/StepNotes';
import { useTimerShortcuts } from '@/hooks/useTimerShortcuts';

interface TimerScreenProps {
  onBack: () => void;
}

export function TimerScreen({ onBack }: TimerScreenProps) {
  const { t } = useTranslation();
  const {
    isRunning,
    isPaused,
    currentStepIndex,
    steps,
    stepNotes,
    pause,
    resume,
    nextStep,
    completeTimer,
    cancelTimer,
    getTotalElapsedSeconds,
    getCurrentStepElapsedSeconds,
    updateStepNote,
  } = useTimerStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Handler functions
  const handleComplete = useCallback(async (): Promise<void> => {
    try {
      await completeTimer();
      onBack();
    } catch (error) {
      console.error('Failed to complete timer:', error);
      // TODO: Show error toast
    }
  }, [completeTimer, onBack]);

  const handlePauseResume = useCallback((): void => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, resume, pause]);

  const handleNextStep = useCallback((): void => {
    if (currentStepIndex >= steps.length - 1) {
      // Last step - complete timer
      handleComplete();
    } else {
      nextStep();
    }
  }, [currentStepIndex, steps.length, handleComplete, nextStep]);

  const handleExit = useCallback((): void => {
    setShowExitDialog(true);
  }, []);

  // Keyboard shortcuts
  useTimerShortcuts({
    enabled: isRunning && !showExitDialog,
    isPaused,
    onPauseResume: handlePauseResume,
    onNextStep: handleNextStep,
    onExit: handleExit,
  });

  // Update timer display every 100ms
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds(getTotalElapsedSeconds());
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, getTotalElapsedSeconds]);

  const confirmExit = (): void => {
    cancelTimer();
    setShowExitDialog(false);
    onBack();
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex >= steps.length - 1;

  // Calculate total standard time
  const totalStandardSeconds = useMemo(() => {
    return steps.reduce((sum, step) => sum + step.durationSeconds, 0);
  }, [steps]);

  if (!isRunning) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">No active timer session</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-container-wide mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-fluid-2xl font-bold tracking-tight">
                {t('timer.title')}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
            >
              {t('timer.exit')}
            </Button>
          </div>
        </div>
      </div>

      {/* Timer Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-container-wide mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Large Time Display */}
            <div className="flex justify-center">
              <TimerDisplay elapsedSeconds={elapsedSeconds} />
            </div>

            {/* Progress Info */}
            <TimerProgress
              actualSeconds={elapsedSeconds}
              standardSeconds={totalStandardSeconds}
            />

            {/* Current Step */}
            {currentStep && (
              <StepIndicator
                currentStep={currentStep}
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                stepElapsedSeconds={getCurrentStepElapsedSeconds()}
              />
            )}

            {/* Step Notes */}
            {currentStep && (
              <StepNotes
                stepId={currentStep.id}
                initialNote={stepNotes[currentStep.id] || ''}
                onNoteChange={updateStepNote}
              />
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant={isPaused ? 'default' : 'secondary'}
                onClick={handlePauseResume}
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    {t('timer.resume')} (Space)
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    {t('timer.pause')} (Space)
                  </>
                )}
              </Button>

              <Button
                size="lg"
                onClick={handleNextStep}
                disabled={isPaused}
              >
                {isLastStep ? t('timer.complete') : t('timer.next_step')} (Enter)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('timer.exit_confirmation')}</DialogTitle>
            <DialogDescription>
              {t('timer.exit_message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
            >
              {t('timer.exit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
