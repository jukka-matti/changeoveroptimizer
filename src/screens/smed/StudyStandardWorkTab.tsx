import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSmedStore } from '@/stores/smed-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText } from 'lucide-react';
import { StandardCard } from '@/components/smed/StandardCard';
import { StandardPublishForm } from '@/components/smed/StandardPublishForm';
import type { Standard, StandardPublishData } from '@/types/smed';

interface StudyStandardWorkTabProps {
  studyId: string;
}

export function StudyStandardWorkTab({ studyId }: StudyStandardWorkTabProps) {
  const { t } = useTranslation();
  const {
    currentStandards,
    activeStandard,
    currentSteps,
    currentStatistics,
    loadStandards,
    createStandardFromSteps,
    publishStandard,
    deactivateStandard,
    currentStudy,
  } = useSmedStore();

  const [isPublishFormOpen, setIsPublishFormOpen] = useState(false);

  // Load standards when component mounts
  useEffect(() => {
    loadStandards(studyId);
  }, [studyId, loadStandards]);

  const handlePublish = async (data: StandardPublishData) => {
    await createStandardFromSteps(studyId, data);
  };

  const handleActivate = async (standardId: string) => {
    await publishStandard(standardId);
  };

  const handleDeactivate = async (standardId: string) => {
    await deactivateStandard(standardId);
  };

  const handleExportPDF = async (standard: Standard) => {
    try {
      // TODO: Implement PDF export in Phase 4
      console.log('Export PDF for standard:', standard);
      // await exportStandardWorkPDF(standard, { studyName: studyId });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // TODO: Show error toast
    }
  };

  const canPublish = currentSteps.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 normal:grid-cols-3 gap-4">
        {/* Active Standard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('smed.active_standard')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeStandard ? (
              <>
                <div className="text-2xl font-bold">
                  Version {activeStandard.version}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(activeStandard.standardTimeMinutes)} {t('smed.minutes')}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>

        {/* Total Versions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('smed.total_versions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStandards.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('smed.versions_history')}
            </p>
          </CardContent>
        </Card>

        {/* Current Steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('smed.current_steps')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentSteps.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStatistics && `${Math.round(currentStatistics.totalTimeSeconds / 60)} ${t('smed.minutes')}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      {!canPublish && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {t('smed.no_steps_to_publish')}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('smed.standard_work')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('smed.standard_work_description')}
          </p>
        </div>
        <Button
          onClick={() => setIsPublishFormOpen(true)}
          disabled={!canPublish}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('smed.publish_standard')}
        </Button>
      </div>

      {/* Standards List */}
      {currentStandards.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('smed.no_standards_yet')}
            </p>
            <Button
              onClick={() => setIsPublishFormOpen(true)}
              disabled={!canPublish}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('smed.publish_first_standard')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentStandards.map((standard) => (
            <StandardCard
              key={standard.id}
              standard={standard}
              onPublish={handleActivate}
              onDeactivate={handleDeactivate}
              onExportPDF={handleExportPDF}
            />
          ))}
        </div>
      )}

      {/* Publish Form Dialog */}
      <StandardPublishForm
        isOpen={isPublishFormOpen}
        onClose={() => setIsPublishFormOpen(false)}
        onSubmit={handlePublish}
        changeoverType={currentStudy?.changeoverType}
        newStandardTime={currentSteps.reduce((sum, step) => sum + (step.durationSeconds / 60), 0)}
      />
    </div>
  );
}
