import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Clock, Check, AlertCircle } from "lucide-react";

interface SmedStudy {
  id: string;
  name: string;
  changeoverType: string | null;
  currentMinutes: number | null;
  status: string;
}

interface SmedImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  onImport: (data: {
    fromValue: string;
    toValue: string;
    timeMinutes: number;
    smedStudyId: string;
    notes?: string;
  }) => Promise<void>;
}

export function SmedImportDialog({
  open,
  onOpenChange,
  attributeName,
  onImport,
}: SmedImportDialogProps) {
  const [studies, setStudies] = useState<SmedStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<SmedStudy | null>(null);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadStudies();
    } else {
      // Reset state when closing
      setSelectedStudy(null);
      setFromValue("");
      setToValue("");
      setError(null);
    }
  }, [open]);

  const loadStudies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await (window as any).electron.invoke("smed:get_all_studies");
      // Filter to only show standardized studies with a current time
      const standardized = result.filter(
        (s: SmedStudy) => s.status === "standardized" && s.currentMinutes != null
      );
      setStudies(standardized);
    } catch (err) {
      console.error("Failed to load SMED studies:", err);
      setError("Failed to load SMED studies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedStudy || !fromValue.trim() || !toValue.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (selectedStudy.currentMinutes == null) {
      setError("Selected study has no time data");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      await onImport({
        fromValue: fromValue.trim(),
        toValue: toValue.trim(),
        timeMinutes: selectedStudy.currentMinutes,
        smedStudyId: selectedStudy.id,
        notes: `Imported from SMED study: ${selectedStudy.name}`,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to import:", err);
      setError("Failed to import changeover time");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Import from SMED Study
          </DialogTitle>
          <DialogDescription>
            Import a standardized changeover time into the {attributeName} matrix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Study Selection */}
          <div className="space-y-2">
            <Label>Select SMED Study</Label>
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading studies...
              </div>
            ) : studies.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No standardized SMED studies available.</p>
                <p className="text-xs mt-1">
                  Complete and standardize a SMED study first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {studies.map((study) => (
                  <div
                    key={study.id}
                    onClick={() => setSelectedStudy(study)}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                      selectedStudy?.id === study.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{study.name}</div>
                      {study.changeoverType && (
                        <div className="text-xs text-muted-foreground">
                          {study.changeoverType}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {study.currentMinutes} min
                      </div>
                      {selectedStudy?.id === study.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Value Mapping */}
          {selectedStudy && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Map this time to a specific transition:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-value">From Value</Label>
                    <Input
                      id="from-value"
                      placeholder="e.g., Red"
                      value={fromValue}
                      onChange={(e) => setFromValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-value">To Value</Label>
                    <Input
                      id="to-value"
                      placeholder="e.g., Blue"
                      value={toValue}
                      onChange={(e) => setToValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Will create: </span>
                <span className="font-medium">
                  {fromValue || "?"} → {toValue || "?"} = {selectedStudy.currentMinutes} min
                </span>
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedStudy || !fromValue || !toValue || isImporting}
          >
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
