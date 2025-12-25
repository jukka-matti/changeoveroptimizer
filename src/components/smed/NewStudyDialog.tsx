import { useState, useEffect } from "react";
import { StudyFormData } from "@/types/smed";
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
import { useTranslation } from "react-i18next";

interface NewStudyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudyFormData) => Promise<unknown>;
}

const INITIAL_FORM_STATE: StudyFormData = {
  name: "",
  description: "",
  changeoverType: "",
  lineName: "",
  machineName: "",
  baselineMinutes: undefined,
  targetMinutes: undefined,
};

export function NewStudyDialog({ isOpen, onClose, onSubmit }: NewStudyDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<StudyFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create study:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("smed.new_study")}</DialogTitle>
          <DialogDescription>
            Create a new SMED study to start tracking changeover improvements
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("smed.study_name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Color Changeover - Red to Blue"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t("smed.description")}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="baselineMinutes">{t("smed.baseline_time")}</Label>
              <Input
                id="baselineMinutes"
                type="number"
                min="0"
                step="0.1"
                value={formData.baselineMinutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baselineMinutes: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="45"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetMinutes">{t("smed.target_time")}</Label>
              <Input
                id="targetMinutes"
                type="number"
                min="0"
                step="0.1"
                value={formData.targetMinutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetMinutes: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="changeoverType">{t("smed.changeover_type")}</Label>
            <Input
              id="changeoverType"
              value={formData.changeoverType}
              onChange={(e) =>
                setFormData({ ...formData, changeoverType: e.target.value })
              }
              placeholder="e.g., Product changeover, Color change"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lineName">{t("smed.line")}</Label>
              <Input
                id="lineName"
                value={formData.lineName}
                onChange={(e) =>
                  setFormData({ ...formData, lineName: e.target.value })
                }
                placeholder="Line A"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="machineName">{t("smed.machine")}</Label>
              <Input
                id="machineName"
                value={formData.machineName}
                onChange={(e) =>
                  setFormData({ ...formData, machineName: e.target.value })
                }
                placeholder="Machine 1"
              />
            </div>
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
          >
            {isSubmitting ? t("common.loading") : "Create Study"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
