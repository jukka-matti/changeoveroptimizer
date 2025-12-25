import { useState, useEffect } from "react";
import { Step, StepCategory, OperationType } from "@/types/smed";
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
import { DurationInput } from "@/components/ui/duration-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { secondsToMinSec } from "@/lib/timer-utils";

interface StepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StepFormData) => Promise<void>;
  initialData?: Step;
  mode: "create" | "edit";
}

export interface StepFormData {
  description: string;
  minutes: number;
  seconds: number;
  category: StepCategory;
  operationType: OperationType;
  notes?: string;
  videoTimestamp?: string;
}

const CATEGORIES: StepCategory[] = [
  "preparation",
  "removal",
  "installation",
  "adjustment",
  "cleanup",
  "other",
];

export function StepForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: StepFormProps) {
  const { t } = useTranslation();

  const initialDuration = initialData?.durationSeconds
    ? secondsToMinSec(initialData.durationSeconds)
    : { minutes: 0, seconds: 0 };

  const [formData, setFormData] = useState<StepFormData>({
    description: initialData?.description || "",
    minutes: initialDuration.minutes,
    seconds: initialDuration.seconds,
    category: initialData?.category || "preparation",
    operationType: initialData?.operationType || "internal",
    notes: initialData?.notes || "",
    videoTimestamp: initialData?.videoTimestamp || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      const duration = initialData?.durationSeconds
        ? secondsToMinSec(initialData.durationSeconds)
        : { minutes: 0, seconds: 0 };

      setFormData({
        description: initialData?.description || "",
        minutes: duration.minutes,
        seconds: duration.seconds,
        category: initialData?.category || "preparation",
        operationType: initialData?.operationType || "internal",
        notes: initialData?.notes || "",
        videoTimestamp: initialData?.videoTimestamp || "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.description.trim()) return;
    if (formData.minutes === 0 && formData.seconds === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to submit step:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? t("smed.add_step") : t("smed.edit_step")}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new changeover step to this study"
                : "Edit the changeover step details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t("smed.step_description")}
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Remove old tooling from machine"
                required
              />
            </div>

            {/* Duration */}
            <DurationInput
              label={t("smed.duration")}
              minutes={formData.minutes}
              seconds={formData.seconds}
              onMinutesChange={(value) =>
                setFormData({ ...formData, minutes: value })
              }
              onSecondsChange={(value) =>
                setFormData({ ...formData, seconds: value })
              }
              required
            />

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">{t("smed.category")}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as StepCategory })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`smed.categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operation Type */}
            <div className="grid gap-2">
              <Label htmlFor="operationType">{t("smed.operation_type")}</Label>
              <Select
                value={formData.operationType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    operationType: value as OperationType,
                  })
                }
              >
                <SelectTrigger id="operationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">
                    {t("smed.internal")} (Machine stopped)
                  </SelectItem>
                  <SelectItem value="external">
                    {t("smed.external")} (Machine running)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Video Timestamp (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="videoTimestamp">
                {t("smed.video_timestamp")}
              </Label>
              <Input
                id="videoTimestamp"
                value={formData.videoTimestamp}
                onChange={(e) =>
                  setFormData({ ...formData, videoTimestamp: e.target.value })
                }
                placeholder="00:05:30"
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
                placeholder="Additional notes or observations"
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
