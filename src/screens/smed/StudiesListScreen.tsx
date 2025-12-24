import { useEffect, useState } from "react";
import { useSmedStore, FREE_STUDY_LIMIT } from "@/stores/smed-store";
import { useLicenseStore } from "@/stores/license-store";
import { StudyCard } from "@/components/smed/StudyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StudyStatus, StudyFormData } from "@/types/smed";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StudyDetailScreen } from "./StudyDetailScreen";

export function StudiesListScreen() {
  const { t } = useTranslation();
  const { tier } = useLicenseStore();
  const {
    studies,
    loadStudies,
    createStudy,
    canCreateStudy,
    isLoading,
    error,
    clearError,
  } = useSmedStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudyStatus | "all">("all");
  const [isNewStudyDialogOpen, setIsNewStudyDialogOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

  // New study form state
  const [newStudyForm, setNewStudyForm] = useState<StudyFormData>({
    name: "",
    description: "",
    changeoverType: "",
    lineName: "",
    machineName: "",
    baselineMinutes: undefined,
    targetMinutes: undefined,
  });

  // Load studies on mount
  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  // Filter studies
  const filteredStudies = studies.filter((study) => {
    const matchesSearch =
      study.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.changeoverType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || study.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateStudy = async () => {
    if (!newStudyForm.name.trim()) return;

    try {
      await createStudy(newStudyForm);
      setIsNewStudyDialogOpen(false);
      setNewStudyForm({
        name: "",
        description: "",
        changeoverType: "",
        lineName: "",
        machineName: "",
        baselineMinutes: undefined,
        targetMinutes: undefined,
      });
    } catch (error) {
      console.error("Failed to create study:", error);
    }
  };

  const handleStudyClick = (studyId: string) => {
    setSelectedStudyId(studyId);
  };

  const handleBackToList = () => {
    setSelectedStudyId(null);
  };

  const canCreate = canCreateStudy(tier);
  const studiesUsed = studies.length;

  // Show study detail if one is selected
  if (selectedStudyId) {
    return (
      <StudyDetailScreen
        studyId={selectedStudyId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-container-wide mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-fluid-3xl font-bold tracking-tight">
                {t("smed.title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("smed.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {tier === "free" && (
                <Badge variant="outline" className="text-xs">
                  {t("smed.studies_used", { used: studiesUsed, limit: FREE_STUDY_LIMIT })}
                </Badge>
              )}
              <Button
                onClick={() => setIsNewStudyDialogOpen(true)}
                disabled={!canCreate}
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("smed.new_study")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-container-wide mx-auto px-6 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Free Tier Limit Warning */}
      {tier === "free" && !canCreate && (
        <div className="max-w-container-wide mx-auto px-6 pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("smed.free_limit_reached")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{t("smed.free_limit_message", { limit: FREE_STUDY_LIMIT })}</span>
              <Button variant="default" size="sm">
                {t("common.upgrade")}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Search and Filter */}
      <div className="border-b bg-muted/30">
        <div className="max-w-container-wide mx-auto px-6 py-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("smed.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StudyStatus | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">{t("smed.status.draft")}</SelectItem>
                <SelectItem value="analyzing">{t("smed.status.analyzing")}</SelectItem>
                <SelectItem value="improving">{t("smed.status.improving")}</SelectItem>
                <SelectItem value="standardized">{t("smed.status.standardized")}</SelectItem>
                <SelectItem value="archived">{t("smed.status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-container-wide mx-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">{t("common.loading")}</div>
            </div>
          ) : filteredStudies.length === 0 ? (
            studies.length === 0 ? (
              /* Empty State - No Studies */
              <Card className="border-dashed">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{t("smed.no_studies")}</CardTitle>
                  <CardDescription>{t("smed.create_first_study")}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <Button
                    onClick={() => setIsNewStudyDialogOpen(true)}
                    disabled={!canCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("smed.new_study")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Empty State - No Matches */
              <div className="text-center py-12 text-muted-foreground">
                No studies match your search criteria
              </div>
            )
          ) : (
            /* Study Cards Grid */
            <div className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-3 gap-6">
              {filteredStudies.map((study) => (
                <StudyCard
                  key={study.id}
                  study={study}
                  onClick={() => handleStudyClick(study.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Study Dialog */}
      <Dialog open={isNewStudyDialogOpen} onOpenChange={setIsNewStudyDialogOpen}>
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
                value={newStudyForm.name}
                onChange={(e) =>
                  setNewStudyForm({ ...newStudyForm, name: e.target.value })
                }
                placeholder="e.g., Color Changeover - Red to Blue"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("smed.description")}</Label>
              <Input
                id="description"
                value={newStudyForm.description}
                onChange={(e) =>
                  setNewStudyForm({ ...newStudyForm, description: e.target.value })
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
                  value={newStudyForm.baselineMinutes || ""}
                  onChange={(e) =>
                    setNewStudyForm({
                      ...newStudyForm,
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
                  value={newStudyForm.targetMinutes || ""}
                  onChange={(e) =>
                    setNewStudyForm({
                      ...newStudyForm,
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
                value={newStudyForm.changeoverType}
                onChange={(e) =>
                  setNewStudyForm({ ...newStudyForm, changeoverType: e.target.value })
                }
                placeholder="e.g., Product changeover, Color change"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lineName">{t("smed.line")}</Label>
                <Input
                  id="lineName"
                  value={newStudyForm.lineName}
                  onChange={(e) =>
                    setNewStudyForm({ ...newStudyForm, lineName: e.target.value })
                  }
                  placeholder="Line A"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="machineName">{t("smed.machine")}</Label>
                <Input
                  id="machineName"
                  value={newStudyForm.machineName}
                  onChange={(e) =>
                    setNewStudyForm({ ...newStudyForm, machineName: e.target.value })
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
              onClick={() => setIsNewStudyDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreateStudy}
              disabled={!newStudyForm.name.trim()}
            >
              Create Study
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
