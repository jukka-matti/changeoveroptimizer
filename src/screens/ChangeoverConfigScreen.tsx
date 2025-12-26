import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { useDataStore, useIsConfigValid } from "@/stores/data-store";
import { ChangeoverConfigList } from "@/components/features/ChangeoverConfigList";
import { useOptimization } from "@/hooks/useOptimization";
import { FirstTimeHint } from "@/components/ui/first-time-hint";
import { ArrowLeft, Play, Grid3X3 } from "lucide-react";

export function ChangeoverConfigScreen() {
  const { navigateTo } = useAppStore();
  const { config, setUseMatrixLookup } = useDataStore();
  const isConfigValid = useIsConfigValid();
  const { runOptimization } = useOptimization();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Configure Changeovers</h2>
          <p className="text-muted-foreground">
            Set the time costs for changing between different values.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateTo("column-mapping")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={runOptimization}
            disabled={!isConfigValid}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            Run Optimization
          </Button>
        </div>
      </div>

      <FirstTimeHint
        hintKey="changeover-config"
        message="Enter how long each type of change takes in minutes. Higher values for attributes that are harder to change will help the optimizer prioritize those sequences."
      />

      <ChangeoverConfigList />

      {/* Matrix Lookup Toggle */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="matrix-toggle" className="text-sm font-medium cursor-pointer">
                Use Changeover Matrix
              </Label>
              <p className="text-xs text-muted-foreground">
                Use value-specific changeover times instead of defaults
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="matrix-toggle"
              checked={config.useMatrixLookup}
              onCheckedChange={setUseMatrixLookup}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo("changeover-matrix")}
            >
              Edit Matrix
            </Button>
          </div>
        </div>
      </div>

      {!isConfigValid && config.attributes.length > 0 && (
        <p className="text-sm text-destructive font-medium text-center">
          Please set a positive changeover time for all attributes.
        </p>
      )}
    </div>
  );
}
