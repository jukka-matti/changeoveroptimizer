import { useMemo } from 'react';
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

  // Get sample values for each column (first 3 unique values)
  const sampleValues = useMemo(() => {
    if (!sourceFile?.rows) return {};

    const samples: Record<string, string[]> = {};
    sourceFile.columns.forEach(col => {
      const uniqueValues = new Set<string>();
      for (const row of sourceFile.rows) {
        const value = row[col];
        if (value && value.toString().trim()) {
          uniqueValues.add(value.toString().trim());
          if (uniqueValues.size >= 3) break;
        }
      }
      samples[col] = Array.from(uniqueValues);
    });
    return samples;
  }, [sourceFile]);

  if (!sourceFile) return null;

  // Get available columns for attribute selection (exclude Order ID)
  const availableColumns = sourceFile.columns.filter(c => c !== config.orderIdColumn);

  return (
    <div className="space-y-6">
      {/* Section 1: Order ID Column */}
      <Card>
        <CardHeader>
          <CardTitle>Order ID Column</CardTitle>
          <CardDescription>
            Which column uniquely identifies each production order?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={config.orderIdColumn || ''}
            onValueChange={setOrderIdColumn}
          >
            <SelectTrigger className="w-full max-w-[400px]">
              <SelectValue placeholder="Select the order identifier column..." />
            </SelectTrigger>
            <SelectContent>
              {sourceFile.columns.map((col) => (
                <SelectItem key={col} value={col}>
                  <span className="font-medium">{col}</span>
                  {sampleValues[col]?.length > 0 && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({sampleValues[col].slice(0, 2).join(', ')}{sampleValues[col].length > 2 ? '...' : ''})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Section 2: Changeover Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Changeover Attributes</CardTitle>
          <CardDescription>
            Select columns that affect changeover time. When these values differ between orders, a changeover is needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 normal:grid-cols-2 gap-3">
            {availableColumns.map((col) => {
              const isSelected = config.attributes.some(a => a.column === col);
              const samples = sampleValues[col] || [];
              const atLimit = !canAddAttribute(config.attributes.length) && !isSelected;

              return (
                <div
                  key={col}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                    atLimit && "opacity-50"
                  )}
                >
                  <Checkbox
                    id={`attr-${col}`}
                    checked={isSelected}
                    disabled={atLimit}
                    onCheckedChange={(checked) => {
                      if (checked) addAttribute(col, 0);
                      else removeAttribute(col);
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`attr-${col}`}
                      className={cn(
                        "text-base cursor-pointer block",
                        isSelected && "font-medium"
                      )}
                    >
                      {col}
                    </Label>
                    {samples.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {samples.join(', ')}{samples.length >= 3 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {availableColumns.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Select an Order ID column first to see available attributes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
