import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";
import { useLicenseStore } from "@/stores/license-store";
import { ColumnMapper } from "@/components/features/ColumnMapper";
import { UpgradePrompt } from "@/components/features/UpgradePrompt";
import { TemplateManager } from "@/components/features/TemplateManager";
import { FirstTimeHint } from "@/components/ui/first-time-hint";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function ColumnMappingScreen() {
  const { navigateTo } = useAppStore();
  const { config, sourceFile } = useDataStore();
  const { canOptimizeOrders } = useLicenseStore();

  const isStepValid = !!(config.orderIdColumn && config.attributes.length > 0);
  const orderCount = sourceFile?.rowCount || 0;
  const isOrderLimitHit = !canOptimizeOrders(orderCount);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Column Mapping</h2>
          <p className="text-muted-foreground">
            Define how your data should be interpreted.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TemplateManager />
          <Button variant="outline" onClick={() => navigateTo("data-preview")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={() => navigateTo("changeover-config")}
            disabled={!isStepValid || isOrderLimitHit}
          >
            Next: Configure Times
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOrderLimitHit && (
        <UpgradePrompt
          title="Order Limit Reached"
          description={`Your production schedule has ${orderCount} orders, but the free tier only supports 50.`}
        />
      )}

      <FirstTimeHint
        hintKey="column-mapping"
        message="Select the column that identifies each order, then choose which attributes affect changeover time (e.g., Color, Material, Size)."
      />

      <ColumnMapper />

      {!isStepValid && (
        <p className="text-sm text-destructive font-medium text-center">
          Please select an Order ID column and at least one attribute.
        </p>
      )}
    </div>
  );
}
