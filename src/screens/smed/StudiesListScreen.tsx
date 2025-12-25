import { useEffect, useState } from "react";
import { useSmedStore, FREE_STUDY_LIMIT } from "@/stores/smed-store";
import { useLicenseStore } from "@/stores/license-store";
import { StudyCard } from "@/components/smed/StudyCard";
import { NewStudyDialog } from "@/components/smed/NewStudyDialog";
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
import { StudyStatus } from "@/types/smed";
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
      <NewStudyDialog
        isOpen={isNewStudyDialogOpen}
        onClose={() => setIsNewStudyDialogOpen(false)}
        onSubmit={createStudy}
      />
    </div>
  );
}
