import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useDataStore, useIsConfigValid } from "@/stores/data-store";
import { ChangeoverConfigList } from "@/components/features/ChangeoverConfigList";
import { useOptimization } from "@/hooks/useOptimization";
import { ArrowLeft, Play } from "lucide-react";

export function ChangeoverConfigScreen() {
  const { navigateTo } = useAppStore();
  const { config } = useDataStore();
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

      <ChangeoverConfigList />

      {!isConfigValid && config.attributes.length > 0 && (
        <p className="text-sm text-destructive font-medium text-center">
          Please set a positive changeover time for all attributes.
        </p>
      )}
    </div>
  );
}
