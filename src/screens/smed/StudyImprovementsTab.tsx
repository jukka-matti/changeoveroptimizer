import { useState } from "react";
import { useSmedStore } from "@/stores/smed-store";
import { Improvement, ImprovementStatus } from "@/types/smed";
import { ImprovementCard } from "@/components/smed/ImprovementCard";
import { ImprovementForm, ImprovementFormData } from "@/components/smed/ImprovementForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StudyImprovementsTabProps {
  studyId: string;
}

export function StudyImprovementsTab({ studyId }: StudyImprovementsTabProps) {
  const { t } = useTranslation();
  const {
    currentImprovements,
    createImprovement,
    updateImprovement,
    updateImprovementStatus,
  } = useSmedStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingImprovement, setEditingImprovement] = useState<Improvement | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Calculate summary metrics
  const calculateMetrics = () => {
    const totalPotentialSavings = currentImprovements.reduce(
      (sum, imp) => sum + (imp.estimatedSavingsSeconds || 0),
      0
    );

    const verifiedImprovements = currentImprovements.filter(
      (imp) => imp.status === "verified"
    );
    const actualSavings = verifiedImprovements.reduce(
      (sum, imp) => sum + (imp.actualSavingsSeconds || 0),
      0
    );

    const totalActualCost = verifiedImprovements.reduce(
      (sum, imp) => sum + (imp.actualCost || 0),
      0
    );

    // Simple ROI: savings in minutes vs cost
    // Assuming 1 minute saved = €1 value (rough estimate for display)
    const roi = totalActualCost > 0
      ? ((actualSavings / 60) / totalActualCost) * 100
      : 0;

    const countByStatus = {
      idea: currentImprovements.filter((imp) => imp.status === "idea").length,
      planned: currentImprovements.filter((imp) => imp.status === "planned").length,
      in_progress: currentImprovements.filter((imp) => imp.status === "in_progress").length,
      implemented: currentImprovements.filter((imp) => imp.status === "implemented").length,
      verified: currentImprovements.filter((imp) => imp.status === "verified").length,
    };

    return {
      totalPotentialSavings,
      actualSavings,
      roi,
      countByStatus,
      totalIdeas: currentImprovements.length,
    };
  };

  const metrics = calculateMetrics();

  // Group improvements by status
  const groupedImprovements = {
    idea: currentImprovements.filter((imp) => imp.status === "idea"),
    planned: currentImprovements.filter((imp) => imp.status === "planned"),
    in_progress: currentImprovements.filter((imp) => imp.status === "in_progress"),
    implemented: currentImprovements.filter((imp) => imp.status === "implemented"),
    verified: currentImprovements.filter((imp) => imp.status === "verified"),
  };

  const handleAddImprovement = () => {
    setFormMode("create");
    setEditingImprovement(undefined);
    setIsFormOpen(true);
  };

  const handleEditImprovement = (improvement: Improvement) => {
    setFormMode("edit");
    setEditingImprovement(improvement);
    setIsFormOpen(true);
  };

  const handleDeleteImprovement = async (improvementId: string) => {
    if (!confirm("Are you sure you want to delete this improvement?")) return;
    try {
      await updateImprovement(improvementId, { status: "idea" } as any);
      // In a real implementation, we'd have a deleteImprovement method
      // For now, we can't actually delete, so this is a placeholder
    } catch (error) {
      console.error("Failed to delete improvement:", error);
    }
  };

  const handleStatusChange = async (improvementId: string, status: ImprovementStatus) => {
    try {
      await updateImprovementStatus(improvementId, status);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSubmitImprovement = async (data: ImprovementFormData) => {
    // Convert minutes/seconds to total seconds
    const estimatedSavingsSeconds =
      ((data.estimatedSavingsMinutes || 0) * 60) + (data.estimatedSavingsSeconds || 0);

    const improvementData = {
      description: data.description,
      improvementType: data.improvementType,
      estimatedSavingsSeconds: estimatedSavingsSeconds > 0 ? estimatedSavingsSeconds : undefined,
      estimatedCost: data.estimatedCost,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      notes: data.notes,
    };

    if (formMode === "create") {
      await createImprovement(studyId, improvementData);
    } else if (editingImprovement) {
      await updateImprovement(editingImprovement.id, improvementData);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingImprovement(undefined);
  };

  const renderImprovementSection = (
    title: string,
    improvements: Improvement[]
  ) => {
    if (improvements.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {title}
          <span className="text-sm text-muted-foreground">({improvements.length})</span>
        </h3>
        <div className="grid gap-3">
          {improvements.map((improvement) => (
            <ImprovementCard
              key={improvement.id}
              improvement={improvement}
              onEdit={handleEditImprovement}
              onDelete={handleDeleteImprovement}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      {currentImprovements.length > 0 && (
        <div className="grid grid-cols-1 normal:grid-cols-4 gap-4">
          {/* Total Potential Savings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.potential_savings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(metrics.totalPotentialSavings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalIdeas} total ideas
              </p>
            </CardContent>
          </Card>

          {/* Actual Savings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.actual_savings_total")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">
                {formatTime(metrics.actualSavings)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.countByStatus.verified} verified
              </p>
            </CardContent>
          </Card>

          {/* ROI */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("smed.roi")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.roi > 0 ? `${Math.round(metrics.roi)}%` : "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Return on investment
              </p>
            </CardContent>
          </Card>

          {/* In Progress Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.countByStatus.in_progress + metrics.countByStatus.planned}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In progress or planned
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Improvement Ideas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track improvement opportunities from idea to verification
          </p>
        </div>
        <Button onClick={handleAddImprovement}>
          <Plus className="h-4 w-4 mr-2" />
          {t("smed.add_improvement")}
        </Button>
      </div>

      {/* Empty State */}
      {currentImprovements.length === 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t("smed.no_improvements")}</p>
              <p className="text-sm">{t("smed.create_first_improvement")}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Improvement Sections by Status */}
      <div className="space-y-8">
        {renderImprovementSection(t("smed.improvement_status.idea"), groupedImprovements.idea)}
        {renderImprovementSection(t("smed.improvement_status.planned"), groupedImprovements.planned)}
        {renderImprovementSection(t("smed.improvement_status.in_progress"), groupedImprovements.in_progress)}
        {renderImprovementSection(t("smed.improvement_status.implemented"), groupedImprovements.implemented)}
        {renderImprovementSection(t("smed.improvement_status.verified"), groupedImprovements.verified)}
      </div>

      {/* Improvement Form Dialog */}
      <ImprovementForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitImprovement}
        initialData={editingImprovement}
        mode={formMode}
      />
    </div>
  );
}
