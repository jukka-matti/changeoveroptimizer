import { useEffect, useState } from "react";
import { useSmedStore } from "@/stores/smed-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StudyStepsTab } from "./StudyStepsTab";
import { StudyImprovementsTab } from "./StudyImprovementsTab";

interface StudyDetailScreenProps {
  studyId: string;
  onBack: () => void;
}

type TabType = "steps" | "improvements" | "standard" | "history";

export function StudyDetailScreen({ studyId, onBack }: StudyDetailScreenProps) {
  const { t } = useTranslation();
  const {
    currentStudy,
    currentStatistics,
    loadStudyById,
    isLoading,
  } = useSmedStore();

  const [activeTab, setActiveTab] = useState<TabType>("steps");

  // Load study on mount
  useEffect(() => {
    loadStudyById(studyId);
  }, [studyId, loadStudyById]);

  // Format time display
  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return "-";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "outline";
      case "analyzing":
        return "secondary";
      case "improving":
        return "default";
      case "standardized":
        return "success";
      case "archived":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading || !currentStudy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-container-wide mx-auto px-6 py-6">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-fluid-3xl font-bold tracking-tight truncate">
                    {currentStudy.name}
                  </h1>
                  {currentStudy.description && (
                    <p className="text-muted-foreground mt-1">
                      {currentStudy.description}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusVariant(currentStudy.status)}>
                  {t(`smed.status.${currentStudy.status}`)}
                </Badge>
              </div>

              {/* Study Metadata */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {currentStudy.changeoverType && (
                  <span>
                    {t("smed.changeover_type")}: {currentStudy.changeoverType}
                  </span>
                )}
                {currentStudy.lineName && (
                  <span>
                    {t("smed.line")}: {currentStudy.lineName}
                  </span>
                )}
                {currentStudy.machineName && (
                  <span>
                    {t("smed.machine")}: {currentStudy.machineName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Time Metrics Cards */}
          <div className="grid grid-cols-1 normal:grid-cols-3 gap-4 mt-6">
            {/* Baseline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {t("smed.baseline")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(currentStudy.baselineMinutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Original changeover time
                </p>
              </CardContent>
            </Card>

            {/* Current */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t("smed.current")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatTime(currentStudy.currentMinutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current measured time
                </p>
              </CardContent>
            </Card>

            {/* Target */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-success-600" />
                  {t("smed.target")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success-600">
                  {formatTime(currentStudy.targetMinutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target improvement goal
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-muted/30">
        <div className="max-w-container-wide mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("steps")}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "steps"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("smed.steps")}
              {currentStatistics && (
                <span className="ml-2 text-xs">({currentStatistics.totalSteps})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("improvements")}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "improvements"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("smed.improvements")}
            </button>

            <button
              onClick={() => setActiveTab("standard")}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "standard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              disabled
              title="Coming in Phase 4"
            >
              {t("smed.standard_work")}
              <span className="ml-2 text-xs opacity-50">(Phase 4)</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              disabled
              title="Coming in Phase 4"
            >
              {t("smed.history")}
              <span className="ml-2 text-xs opacity-50">(Phase 4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-container-wide mx-auto px-6 py-6">
          {activeTab === "steps" && <StudyStepsTab studyId={studyId} />}
          {activeTab === "improvements" && <StudyImprovementsTab studyId={studyId} />}
          {activeTab === "standard" && (
            <div className="text-center py-12 text-muted-foreground">
              Standard Work tab coming in Phase 4
            </div>
          )}
          {activeTab === "history" && (
            <div className="text-center py-12 text-muted-foreground">
              History tab coming in Phase 4
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
