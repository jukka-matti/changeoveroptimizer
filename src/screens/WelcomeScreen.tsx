import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsStore } from "@/stores/settings-store";
import { FileSpreadsheet, Clock, ChevronRight } from "lucide-react";
import { FileDropzone } from "@/components/features/FileDropzone";
import { useFileImport } from "@/hooks/useFileImport";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Welcome screen - focused on file import.
 *
 * With sidebar navigation handling module access (SMED, Analytics, etc.),
 * this screen focuses on the primary action: importing production data.
 */
export function WelcomeScreen() {
  const { t } = useTranslation();
  const { importFile, importBuffer, importFromPath, loadSampleData: importSample } = useFileImport();
  const { recentFiles } = useSettingsStore();

  return (
    <ScreenLayout className="flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-fluid-4xl font-extrabold tracking-tight text-primary">
          {t('welcome.title')}
        </h1>
        <p className="text-fluid-xl text-muted-foreground max-w-2xl mx-auto">
          {t('welcome.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 normal:grid-cols-2 gap-fluid-8 w-full max-w-4xl">
        <div className="space-y-6">
          <FileDropzone
            onBrowse={importFile}
            onFileDrop={importBuffer}
          />

          <Card className="hover:border-primary cursor-pointer transition-colors" onClick={importSample}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                {t('welcome.sample_card_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); importSample(); }}>
                Load Example Schedule
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {t('welcome.recent_files_title')}
              </CardTitle>
              <CardDescription>{t('welcome.recent_files_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFiles.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t('welcome.no_recent_files')}
                  description="Files you open will appear here for quick access."
                  variant="compact"
                  className="opacity-70"
                />
              ) : (
                <div className="space-y-2">
                  {recentFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => importFromPath(file.path)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Opened {new Date(file.lastOpened).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  );
}
