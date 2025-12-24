import { useState } from "react";
import { useSmedStore } from "@/stores/smed-store";
import { useTimerStore } from "@/stores/timer-store";
import { useAppStore } from "@/stores/app-store";
import { Step } from "@/types/smed";
import { StepList } from "@/components/smed/StepList";
import { StepForm, StepFormData } from "@/components/smed/StepForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Info, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StudyStepsTabProps {
  studyId: string;
}

export function StudyStepsTab({ studyId }: StudyStepsTabProps) {
  const { t } = useTranslation();
  const {
    currentSteps,
    currentStatistics,
    createStep,
    updateStep,
    deleteStep,
  } = useSmedStore();
  const { startTimer } = useTimerStore();
  const { navigateTo } = useAppStore();

  const [isStepFormOpen, setIsStepFormOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleAddStep = () => {
    setFormMode("create");
    setEditingStep(undefined);
    setIsStepFormOpen(true);
  };

  const handleEditStep = (step: Step) => {
    setFormMode("edit");
    setEditingStep(step);
    setIsStepFormOpen(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Are you sure you want to delete this step?")) return;
    try {
      await deleteStep(stepId);
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleSubmitStep = async (data: StepFormData) => {
    if (formMode === "create") {
      await createStep(studyId, data);
    } else if (editingStep) {
      await updateStep(editingStep.id, data);
    }
  };

  const handleCloseForm = () => {
    setIsStepFormOpen(false);
    setEditingStep(undefined);
  };

  const handleStartTimer = () => {
    if (currentSteps.length === 0) {
      alert("Please add steps before starting the timer");
      return;
    }
    // Start timer and navigate to timer screen
    startTimer(studyId, currentSteps);
    navigateTo("timer");
  };

  // Calculate improvement suggestion
  const getImprovementSuggestion = (): string | null => {
    if (!currentStatistics) return null;

    const internalPercent = currentStatistics.internalPercentage;
    if (internalPercent > 70) {
      return "High internal time (machine stopped). Focus on converting internal steps to external operations.";
    } else if (internalPercent > 50) {
      return "Moderate internal time. Look for opportunities to streamline and parallelize internal operations.";
    } else if (internalPercent > 0) {
      return "Good external time balance. Continue optimizing remaining internal steps.";
    }
    return null;
  };

  const improvementSuggestion = getImprovementSuggestion();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {currentStatistics && currentStatistics.totalSteps > 0 && (
        <div className="grid grid-cols-1 normal:grid-cols-4 gap-4">
          {/* Total Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.statistics.total_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(currentStatistics.totalTimeSeconds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentStatistics.totalSteps} steps
              </p>
            </CardContent>
          </Card>

          {/* Internal Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.statistics.internal_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatTime(currentStatistics.internalTimeSeconds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(currentStatistics.internalPercentage)}% of total
              </p>
            </CardContent>
          </Card>

          {/* External Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.statistics.external_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">
                {formatTime(currentStatistics.externalTimeSeconds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(currentStatistics.externalPercentage)}% of total
              </p>
            </CardContent>
          </Card>

          {/* Internal Steps Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Internal Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentStatistics.internalSteps}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentStatistics.externalSteps} external steps
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Improvement Suggestion */}
      {improvementSuggestion && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{improvementSuggestion}</AlertDescription>
        </Alert>
      )}

      {/* Steps List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Changeover Steps</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Break down the changeover into individual steps and classify as internal
            (machine stopped) or external (machine running)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleStartTimer}
            disabled={currentSteps.length === 0}
          >
            <Timer className="h-4 w-4 mr-2" />
            {t("timer.start_timer")}
          </Button>
          <Button onClick={handleAddStep}>
            <Plus className="h-4 w-4 mr-2" />
            {t("smed.add_step")}
          </Button>
        </div>
      </div>

      {/* Steps List */}
      <StepList
        steps={currentSteps}
        onEdit={handleEditStep}
        onDelete={handleDeleteStep}
      />

      {/* Step Form Dialog */}
      <StepForm
        isOpen={isStepFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitStep}
        initialData={editingStep}
        mode={formMode}
      />
    </div>
  );
}
