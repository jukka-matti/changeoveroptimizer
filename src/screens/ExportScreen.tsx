import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDataStore } from '@/stores/data-store';
import { useConfigStore } from '@/stores/config-store';
import { configurationsIpc } from '@/lib/electron-ipc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { generateExport, ExportFormat } from '@/services/exporter';
import { saveFileDialog } from '@/lib/electron';
import { useToast } from '@/hooks/use-toast';
import { useLicenseStore } from '@/stores/license-store';
import { telemetry } from '@/services/telemetry';
import { ArrowLeft, Download, FileSpreadsheet, FileJson, Clipboard, FileText, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExportScreen() {
  const { navigateTo } = useAppStore();
  const { result, sourceFile } = useDataStore();
  const { activeConfigId } = useConfigStore();
  const { checkFeature } = useLicenseStore();
  const { toast } = useToast();

  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const canExportPDF = checkFeature('pdf-export');

  // Load saved export format preference
  useEffect(() => {
    if (activeConfigId) {
      configurationsIpc.getById(activeConfigId).then(config => {
        if (config?.lastExportFormat) {
          setFormat(config.lastExportFormat as ExportFormat);
        }
      }).catch(err => {
        console.warn('Failed to load export preference:', err);
      });
    }
  }, [activeConfigId]);

  if (!result || !sourceFile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No optimization results found.</p>
        <Button onClick={() => navigateTo('welcome')}>Start Over</Button>
      </div>
    );
  }

  const handleExport = async () => {
    if (format === 'pdf' && !canExportPDF) {
      toast({
        variant: "destructive",
        title: "Pro Feature",
        description: "PDF Export is only available in the Pro version.",
      });
      return;
    }

    try {
      setIsExporting(true);
      const exportResult = await generateExport(result, sourceFile.rows, {
        format,
        includeSummary,
        includeOriginal,
      });

      telemetry.trackEvent('export_started', { format });

      if (format === 'clipboard') {
        await navigator.clipboard.writeText(exportResult.data as string);
        toast({
          title: "Copied to Clipboard",
          description: "The optimized sequence has been copied in tab-separated format.",
        });
      } else {
        const path = await saveFileDialog(exportResult.filename, exportResult.data as Uint8Array);
        if (path) {
          toast({
            title: "Export Successful",
            description: `File saved to: ${path.split(/[/\\]/).pop()}`,
          });
        }
      }

      // Save export format preference for this configuration
      if (activeConfigId) {
        configurationsIpc.updateExportPreference(activeConfigId, format).catch(err => {
          console.warn('Failed to save export preference:', err);
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
      <div className="space-y-6 max-w-container-normal mx-auto px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-fluid-3xl font-bold tracking-tight">Export Schedule</h2>
          <p className="text-fluid-base text-muted-foreground">
            Choose your preferred format and download the optimized sequence.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigateTo('results')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Format</CardTitle>
            <CardDescription>Select the file type for your production schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={format} 
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-4 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Excel
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileJson className="h-4 w-4 text-blue-600" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="clipboard" id="clipboard" />
                <Label htmlFor="clipboard" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clipboard className="h-4 w-4 text-orange-600" />
                  Clipboard
                </Label>
              </div>
              <div className={cn(
                "flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors relative",
                !canExportPDF && "opacity-80"
              )}>
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4 text-red-600" />
                  PDF
                  {!canExportPDF && <Crown className="h-3 w-3 text-primary fill-current ml-auto" />}
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {format === 'xlsx' && (
          <Card>
            <CardHeader>
              <CardTitle>Excel Options</CardTitle>
              <CardDescription>Customize the content of your workbook.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeSummary" 
                  checked={includeSummary} 
                  onCheckedChange={(checked) => setIncludeSummary(!!checked)} 
                />
                <Label htmlFor="includeSummary" className="cursor-pointer">
                  Include Optimization Summary sheet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeOriginal" 
                  checked={includeOriginal} 
                  onCheckedChange={(checked) => setIncludeOriginal(!!checked)} 
                />
                <Label htmlFor="includeOriginal" className="cursor-pointer">
                  Include Original Schedule sheet
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              "Exporting..."
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                {format === 'clipboard' ? 'Copy to Clipboard' : 'Download File'}
              </>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground">
                Start New Optimization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start new optimization?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear your current results and return to the home screen.
                  Make sure you've exported or saved your schedule first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigateTo('welcome')}>
                  Yes, start new
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
