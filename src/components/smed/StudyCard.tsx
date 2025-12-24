import { Study } from "@/types/smed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StudyCardProps {
  study: Study;
  onClick: () => void;
}

export function StudyCard({ study, onClick }: StudyCardProps) {
  const { t } = useTranslation();

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!study.baselineMinutes || !study.targetMinutes || !study.currentMinutes) {
      return 0;
    }

    const totalReduction = study.baselineMinutes - study.targetMinutes;
    const currentReduction = study.baselineMinutes - study.currentMinutes;

    if (totalReduction <= 0) return 0;

    const progress = (currentReduction / totalReduction) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Get status badge variant
  const getStatusVariant = (status: Study["status"]) => {
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

  // Format time display
  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return "-";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const progress = calculateProgress();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{study.name}</CardTitle>
            {study.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {study.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={getStatusVariant(study.status)}>
            {t(`smed.status.${study.status}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {study.baselineMinutes && study.targetMinutes && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("smed.progress")}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Time Metrics */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {/* Baseline */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              {t("smed.baseline")}
            </span>
            <div className="flex items-center gap-1 font-medium mt-0.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {formatTime(study.baselineMinutes)}
            </div>
          </div>

          {/* Current */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              {t("smed.current")}
            </span>
            <div className="flex items-center gap-1 font-medium mt-0.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {formatTime(study.currentMinutes)}
            </div>
          </div>

          {/* Target */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">
              {t("smed.target")}
            </span>
            <div className="flex items-center gap-1 font-medium mt-0.5">
              <TrendingDown className="h-3.5 w-3.5 text-success-600" />
              {formatTime(study.targetMinutes)}
            </div>
          </div>
        </div>

        {/* Changeover Info */}
        {(study.changeoverType || study.lineName || study.machineName) && (
          <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t">
            {study.changeoverType && (
              <div className="truncate">
                {t("smed.changeover_type")}: {study.changeoverType}
              </div>
            )}
            {study.lineName && (
              <div className="truncate">
                {t("smed.line")}: {study.lineName}
              </div>
            )}
            {study.machineName && (
              <div className="truncate">
                {t("smed.machine")}: {study.machineName}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
