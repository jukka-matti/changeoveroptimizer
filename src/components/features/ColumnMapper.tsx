import { useDataStore } from '@/stores/data-store';
import { useLicenseStore } from '@/stores/license-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ColumnMapper() {
  const { sourceFile, config, setOrderIdColumn, addAttribute, removeAttribute } = useDataStore();
  const { canAddAttribute } = useLicenseStore();

  if (!sourceFile) return null;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Identify Order ID</CardTitle>
          <CardDescription>
            Select the column that uniquely identifies each production order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="order-id-select">Order ID Column</Label>
            <Select 
              value={config.orderIdColumn || ''} 
              onValueChange={setOrderIdColumn}
            >
              <SelectTrigger id="order-id-select" className="w-[300px]">
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent>
                {sourceFile.columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Optimization Attributes</CardTitle>
          <CardDescription>
            Choose the columns that affect changeover time (e.g., Color, Material, Size).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-3 gap-4">
            {sourceFile.columns.map((col) => {
              const isOrderId = col === config.orderIdColumn;
              const isSelected = config.attributes.some(a => a.column === col);
              const limitHit = !isSelected && !canAddAttribute(config.attributes.length);
              
              return (
                <div key={col} className={cn(
                  "flex items-center space-x-2 p-2 rounded-md transition-colors",
                  !isOrderId && !limitHit && "hover:bg-muted/50"
                )}>
                  <Checkbox 
                    id={`attr-${col}`} 
                    checked={isSelected}
                    disabled={isOrderId || limitHit}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        addAttribute(col, 0); 
                      } else {
                        removeAttribute(col);
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`attr-${col}`}
                    className={cn(
                      "flex-1 cursor-pointer",
                      (isOrderId || limitHit) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {col}
                    {isOrderId && <span className="ml-2 text-xs text-muted-foreground">(Order ID)</span>}
                    {limitHit && <span className="ml-2 text-xs text-destructive">(Limit Reached)</span>}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

