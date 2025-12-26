import { useEffect, useState } from 'react';
import { useDataStore } from '@/stores/data-store';
import { useLicenseStore } from '@/stores/license-store';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { changeoverIpc } from '@/lib/electron-ipc';
import { useToast } from "@/hooks/use-toast";
import type { ChangeoverAttribute } from '@/shared-types';

export function ColumnMapper() {
  const { sourceFile, config, setOrderIdColumn, addAttribute, removeAttribute, setAttributeParallelGroup } = useDataStore();
  const { canAddAttribute } = useLicenseStore();
  const { toast } = useToast();
  const [standards, setStandards] = useState<ChangeoverAttribute[]>([]);

  // Fetch known standards on mount
  useEffect(() => {
    changeoverIpc.getAllAttributes().then((attrs) => setStandards(attrs as any)).catch(console.error);
  }, []);

  if (!sourceFile) return null;

  // Helper to find which column is mapped to a specific standard name
  // In V1, we don't store the link explicitly, so we just check if a column with the SAME NAME exists,
  // OR if a column is selected that matches.
  // Actually, for this UI, we need to know: "Is 'Color' standard mapped to 'Col_A'?"
  // We can track this locally in UI state, or just deduce it.
  // For V1 "Smart Mapper", let's keep it simple:
  // We show a dropdown for "Color". Value = whichever column is currently an attribute.
  // BUT multiple attributes exist.

  // Let's invert: We find which columns are currently selected attributes.
  const selectedColumns = config.attributes.map(a => a.column);
  const unmappedColumns = sourceFile.columns.filter(c => c !== config.orderIdColumn && !selectedColumns.includes(c));

  const handleStandardMapping = (standard: ChangeoverAttribute, column: string) => {
    // 1. Remove standard's name if it was previously auto-added (edge case)
    // 2. Add the NEW column
    addAttribute(column, standard.defaultMinutes);
    setAttributeParallelGroup(column, standard.parallelGroup);

    toast({
      title: "Standard Applied",
      description: `Mapped "${column}" to standard "${standard.displayName}" (${standard.defaultMinutes}m).`,
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Identity */}
      <Card>
        <CardHeader>
          <CardTitle>1. Identify Order ID</CardTitle>
          <CardDescription>
            Select the unique identifier for your production orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Order ID Column</Label>
            <Select
              value={config.orderIdColumn || ''}
              onValueChange={setOrderIdColumn}
            >
              <SelectTrigger className="w-full max-w-[300px]">
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent>
                {sourceFile.columns.map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 2. Map Constants (Standards) */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            2. Map to Standards
            <Badge variant="secondary" className="font-normal text-xs">Process-First</Badge>
          </CardTitle>
          <CardDescription>
            Match your file's columns to your known Changeover Standards.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {standards.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No saved standards yet. Run an optimization to teach the system!</p>
          )}

          {standards.map((std) => {
            // Find if any currently selected attribute matches this standard's intent? 
            // Hard to know intent without explicit link. 
            // For now, we just show a "Map to..." dropdown. 
            // If the column name MATCHES the standard name, we pre-select it.
            const matchingCol = config.attributes.find(a => a.column === std.name)?.column || '';

            return (
              <div key={std.id} className="grid grid-cols-[200px_1fr] gap-4 items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium">{std.displayName}</div>
                  <div className="text-xs text-muted-foreground">Default: {std.defaultMinutes} min</div>
                </div>
                <Select
                  value={matchingCol}
                  onValueChange={(val) => handleStandardMapping(std, val)}
                  disabled={matchingCol !== ''} // Lock it if mapped? Or allow switching? Allow switching is complex via `addAttribute`. Let's assume once mapped, you unmap via the "X".
                >
                  <SelectTrigger className={cn("w-full", matchingCol && "border-green-500 bg-green-50/50")}>
                    <SelectValue placeholder="Select column from file..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceFile.columns
                      .filter(c => c !== config.orderIdColumn) // Don't show ID
                      .map((col) => (
                        <SelectItem key={col} value={col} disabled={config.attributes.some(a => a.column === col && a.column !== matchingCol)}>
                          {col}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3. New Attributes */}
      {unmappedColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. New Attributes</CardTitle>
            <CardDescription>
              Select any other columns that affect changeovers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-3 gap-4">
              {sourceFile.columns.map((col) => {
                const isOrderId = col === config.orderIdColumn;
                const isSelected = config.attributes.some(a => a.column === col);
                // Only show rows that are NOT effectively managed above? 
                // Actually show all for completeness, but highlight the logic.
                // Or just show checkboxes like before.

                return (
                  <div key={col} className={cn(
                    "flex items-center space-x-2 p-2 rounded-md",
                    isSelected ? "bg-accent" : "hover:bg-muted/50"
                  )}>
                    <Checkbox
                      id={`attr-${col}`}
                      checked={isSelected}
                      disabled={isOrderId || !canAddAttribute(config.attributes.length)}
                      onCheckedChange={(checked) => {
                        if (checked) addAttribute(col, 0);
                        else removeAttribute(col);
                      }}
                    />
                    <Label htmlFor={`attr-${col}`} className="flex-1 cursor-pointer">
                      {col}
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
