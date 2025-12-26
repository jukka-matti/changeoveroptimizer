import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";
import { useConfigStore } from "@/stores/config-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { ConfigRecognitionPrompt } from "@/components/features/ConfigRecognitionPrompt";

export function DataPreviewScreen() {
  const { navigateTo } = useAppStore();
  const { sourceFile } = useDataStore();
  const { checkForMatchingConfig, reset: resetConfig } = useConfigStore();

  // Check for matching configuration when file is loaded
  useEffect(() => {
    if (sourceFile?.columns) {
      checkForMatchingConfig(sourceFile.columns);
    }

    // Cleanup on unmount
    return () => {
      resetConfig();
    };
  }, [sourceFile?.columns, checkForMatchingConfig, resetConfig]);

  if (!sourceFile) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="text-muted-foreground">No data imported yet.</p>
        <Button onClick={() => navigateTo("welcome")}>Go Back</Button>
      </div>
    );
  }

  const previewRows = sourceFile.rows.slice(0, 15);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Data Preview</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {sourceFile.name} ({sourceFile.rowCount} rows detected)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateTo("welcome")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => navigateTo("column-mapping")}>
            Next: Map Columns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Auto-configuration recognition prompt */}
      <ConfigRecognitionPrompt
        onReviewSettings={() => navigateTo("column-mapping")}
      />

      <Card>
        <CardHeader>
          <CardTitle>First {previewRows.length} rows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {sourceFile.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {sourceFile.columns.map((col) => (
                      <TableCell key={`${i}-${col}`}>
                        {String(row[col] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {sourceFile.rowCount > 15 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Showing 15 of {sourceFile.rowCount} rows.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
