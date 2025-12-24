import { Step } from "@/types/smed";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepListProps {
  steps: Step[];
  onEdit: (step: Step) => void;
  onDelete: (stepId: string) => void;
}

export function StepList({ steps, onEdit, onDelete }: StepListProps) {
  const { t } = useTranslation();

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Get operation type badge variant
  const getOperationTypeVariant = (type: Step["operationType"]) => {
    return type === "internal" ? "destructive" : "success";
  };

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
        <p className="text-muted-foreground mb-2">
          {t("smed.no_steps")}
        </p>
        <p className="text-sm text-muted-foreground">
          Click "Add Step" to create your first changeover step
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>{t("smed.step_description")}</TableHead>
            <TableHead className="w-24">{t("smed.duration")}</TableHead>
            <TableHead className="w-32">{t("smed.category")}</TableHead>
            <TableHead className="w-32">{t("smed.operation_type")}</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {steps.map((step) => (
            <TableRow key={step.id}>
              {/* Sequence Number */}
              <TableCell className="font-mono text-muted-foreground">
                {step.sequenceNumber}
              </TableCell>

              {/* Description */}
              <TableCell>
                <div className="max-w-md">
                  <div className="font-medium truncate">
                    {step.description}
                  </div>
                  {step.notes && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {step.notes}
                    </div>
                  )}
                  {step.videoTimestamp && (
                    <div className="text-xs text-primary mt-1">
                      Video: {step.videoTimestamp}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Duration */}
              <TableCell className="font-mono">
                {formatDuration(step.durationSeconds)}
              </TableCell>

              {/* Category */}
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {t(`smed.categories.${step.category}`)}
                </Badge>
              </TableCell>

              {/* Operation Type */}
              <TableCell>
                <Badge variant={getOperationTypeVariant(step.operationType)}>
                  {t(`smed.${step.operationType}`)}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(step)}
                    title={t("smed.edit_step")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(step.id)}
                    title={t("smed.delete_step")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
