import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { OptimizationRun } from '@/types/analytics';

interface OptimizationRunsTableProps {
  runs: OptimizationRun[];
  onDelete?: (id: string) => void;
}

export function OptimizationRunsTable({ runs, onDelete }: OptimizationRunsTableProps) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Optimization Runs</CardTitle>
          <CardDescription>History of optimization executions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No optimization runs saved yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Optimization Runs</CardTitle>
        <CardDescription>History of optimization executions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Date</th>
                <th className="text-left py-3 px-2 font-medium">File</th>
                <th className="text-right py-3 px-2 font-medium">Orders</th>
                <th className="text-right py-3 px-2 font-medium">Savings</th>
                <th className="text-right py-3 px-2 font-medium">Downtime</th>
                {onDelete && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2">{formatDate(run.runAt)}</td>
                  <td className="py-3 px-2 max-w-[150px] truncate" title={run.fileName ?? undefined}>
                    {run.fileName ?? run.name ?? '-'}
                  </td>
                  <td className="py-3 px-2 text-right">{run.orderCount}</td>
                  <td className="py-3 px-2 text-right font-medium text-green-600">
                    {run.savingsPercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-right text-muted-foreground">
                    {run.downtimeSavingsPercent.toFixed(1)}%
                  </td>
                  {onDelete && (
                    <td className="py-3 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(run.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
