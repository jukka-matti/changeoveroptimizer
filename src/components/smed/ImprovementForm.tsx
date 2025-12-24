import { useState, useEffect } from "react";
import { Improvement, ImprovementType } from "@/types/smed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface ImprovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ImprovementFormData) => Promise<void>;
  initialData?: Improvement;
  mode: "create" | "edit";
}

export interface ImprovementFormData {
  description: string;
  improvementType: ImprovementType;
  estimatedSavingsMinutes?: number;
  estimatedSavingsSeconds?: number;
  estimatedCost?: number;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
}

const IMPROVEMENT_TYPES: ImprovementType[] = [
  "convert_to_external",
  "streamline_internal",
  "parallelize",
  "eliminate",
  "standardize",
  "quick_release",
  "other",
];

export function ImprovementForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ImprovementFormProps) {
  const { t } = useTranslation();

  // Convert estimatedSavingsSeconds to minutes and seconds
  const convertSavings = (savingsSeconds?: number | null) => {
    if (!savingsSeconds) return { minutes: 0, seconds: 0 };
    const minutes = Math.floor(savingsSeconds / 60);
    const seconds = savingsSeconds % 60;
    return { minutes, seconds };
  };

  const initialSavings = initialData
    ? convertSavings(initialData.estimatedSavingsSeconds)
    : { minutes: 0, seconds: 0 };

  const [formData, setFormData] = useState<ImprovementFormData>({
    description: initialData?.description || "",
    improvementType: initialData?.improvementType || "convert_to_external",
    estimatedSavingsMinutes: initialSavings.minutes,
    estimatedSavingsSeconds: initialSavings.seconds,
    estimatedCost: initialData?.estimatedCost || undefined,
    assignedTo: initialData?.assignedTo || "",
    dueDate: initialData?.dueDate || undefined,
    notes: initialData?.notes || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      const savings = initialData
        ? convertSavings(initialData.estimatedSavingsSeconds)
        : { minutes: 0, seconds: 0 };

      setFormData({
        description: initialData?.description || "",
        improvementType: initialData?.improvementType || "convert_to_external",
        estimatedSavingsMinutes: savings.minutes,
        estimatedSavingsSeconds: savings.seconds,
        estimatedCost: initialData?.estimatedCost || undefined,
        assignedTo: initialData?.assignedTo || "",
        dueDate: initialData?.dueDate || undefined,
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to submit improvement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberInput = (
    field: "estimatedSavingsMinutes" | "estimatedSavingsSeconds",
    value: string
  ) => {
    const num = parseInt(value) || 0;
    const max = field === "estimatedSavingsSeconds" ? 59 : 999;
    setFormData({
      ...formData,
      [field]: Math.min(Math.max(num, 0), max),
    });
  };

  const handleCostInput = (value: string) => {
    const num = parseFloat(value) || undefined;
    setFormData({
      ...formData,
      estimatedCost: num,
    });
  };

  const handleDateInput = (value: string) => {
    const date = value ? new Date(value) : undefined;
    setFormData({
      ...formData,
      dueDate: date,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? t("smed.add_improvement") : t("smed.edit_improvement")}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new improvement idea to this study"
                : "Edit the improvement details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t("smed.description")}
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Convert tooling setup to external operation"
                required
              />
            </div>

            {/* Improvement Type */}
            <div className="grid gap-2">
              <Label htmlFor="improvementType">{t("smed.improvement_type")}</Label>
              <Select
                value={formData.improvementType}
                onValueChange={(value) =>
                  setFormData({ ...formData, improvementType: value as ImprovementType })
                }
              >
                <SelectTrigger id="improvementType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPROVEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`smed.improvement_types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Savings */}
            <div className="grid gap-2">
              <Label>{t("smed.estimated_savings")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="savingsMinutes" className="text-xs text-muted-foreground">
                    {t("smed.minutes")}
                  </Label>
                  <Input
                    id="savingsMinutes"
                    type="number"
                    min="0"
                    max="999"
                    value={formData.estimatedSavingsMinutes}
                    onChange={(e) => handleNumberInput("estimatedSavingsMinutes", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="savingsSeconds" className="text-xs text-muted-foreground">
                    {t("smed.seconds")}
                  </Label>
                  <Input
                    id="savingsSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.estimatedSavingsSeconds}
                    onChange={(e) => handleNumberInput("estimatedSavingsSeconds", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="grid gap-2">
              <Label htmlFor="estimatedCost">
                {t("smed.estimated_cost")}
              </Label>
              <Input
                id="estimatedCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedCost || ""}
                onChange={(e) => handleCostInput(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Assigned To */}
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">
                {t("smed.assigned_to")}
              </Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                placeholder="Person or team responsible"
              />
            </div>

            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="dueDate">
                {t("smed.due_date")}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ""}
                onChange={(e) => handleDateInput(e.target.value)}
              />
            </div>

            {/* Notes (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="notes">{t("smed.notes")}</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes or details"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
