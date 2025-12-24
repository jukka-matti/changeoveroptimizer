import { Improvement, ImprovementStatus } from "@/types/smed";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImprovementCardProps {
  improvement: Improvement;
  onEdit: (improvement: Improvement) => void;
  onDelete: (improvementId: string) => void;
  onStatusChange: (improvementId: string, status: ImprovementStatus) => void;
}

const IMPROVEMENT_STATUSES: ImprovementStatus[] = [
  "idea",
  "planned",
  "in_progress",
  "implemented",
  "verified",
];

export function ImprovementCard({
  improvement,
  onEdit,
  onDelete,
  onStatusChange,
}: ImprovementCardProps) {
  const { t } = useTranslation();

  // Format time from seconds to readable format
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) return "-";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Format currency
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "-";
    return `€${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (date: Date | null): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Check if overdue
  const isOverdue = (): boolean => {
    if (!improvement.dueDate || improvement.status === "verified") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(improvement.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Get status badge variant
  const getStatusVariant = (status: ImprovementStatus): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status) {
      case "idea":
        return "outline";
      case "planned":
        return "secondary";
      case "in_progress":
        return "default";
      case "implemented":
        return "default";
      case "verified":
        return "success";
      default:
        return "outline";
    }
  };

  // Get type badge variant
  const getTypeVariant = (): "default" | "destructive" | "outline" | "secondary" | "success" => {
    return "outline";
  };

  const overdue = isOverdue();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2 flex-wrap">
            <Badge variant={getTypeVariant()}>
              {t(`smed.improvement_types.${improvement.improvementType}`)}
            </Badge>
            <Badge variant={getStatusVariant(improvement.status)}>
              {t(`smed.improvement_status.${improvement.status}`)}
            </Badge>
            {overdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t("smed.overdue")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="font-medium text-sm line-clamp-2">
              {improvement.description}
            </p>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">
                {t("smed.estimated_savings")}
              </div>
              <div className="font-medium">
                {formatTime(improvement.estimatedSavingsSeconds)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                {t("smed.actual_savings")}
              </div>
              <div className="font-medium">
                {formatTime(improvement.actualSavingsSeconds)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                {t("smed.estimated_cost")}
              </div>
              <div className="font-medium">
                {formatCurrency(improvement.estimatedCost)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                {t("smed.actual_cost")}
              </div>
              <div className="font-medium">
                {formatCurrency(improvement.actualCost)}
              </div>
            </div>
          </div>

          {/* Assignment Row */}
          {(improvement.assignedTo || improvement.dueDate) && (
            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
              <div>
                <div className="text-muted-foreground text-xs">
                  {t("smed.assigned_to")}
                </div>
                <div className="font-medium">
                  {improvement.assignedTo || "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {t("smed.due_date")}
                </div>
                <div className={`font-medium ${overdue ? "text-destructive" : ""}`}>
                  {formatDate(improvement.dueDate)}
                </div>
              </div>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(improvement)}
            >
              <Edit className="h-3 w-3 mr-1" />
              {t("common.edit")}
            </Button>

            <Select
              value={improvement.status}
              onValueChange={(value) =>
                onStatusChange(improvement.id, value as ImprovementStatus)
              }
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPROVEMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`smed.improvement_status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(improvement.id)}
              className="ml-auto text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
