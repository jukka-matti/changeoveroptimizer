import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Download, Info, TrendingDown, Clock, Layers, Timer, Save, Check } from "lucide-react";
import { ResultsChart } from "@/components/features/ResultsChart";

export function ResultsScreen() {
  const { navigateTo } = useAppStore();
  const { result, config, sourceFile } = useDataStore();
  const { saveOptimizationRun } = useAnalyticsStore();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToHistory = async () => {
    if (!result || isSaved) return;

    setIsSaving(true);
    try {
      await saveOptimizationRun({
        fileName: sourceFile?.name || undefined,
        orderCount: result.sequence.length,
        attributeCount: config.attributes.length,
        totalBefore: result.totalBefore,
        totalAfter: result.totalAfter,
        savings: result.savings,
        savingsPercent: result.savingsPercent,
        totalDowntimeBefore: result.totalDowntimeBefore,
        totalDowntimeAfter: result.totalDowntimeAfter,
        downtimeSavings: result.downtimeSavings,
        downtimeSavingsPercent: result.downtimeSavingsPercent,
        attributes: config.attributes,
        attributeStats: result.attributeStats,
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save optimization run:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No optimization results found.</p>
        <Button onClick={() => navigateTo("welcome")}>Start Over</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-container-normal mx-auto px-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-fluid-3xl font-bold tracking-tight">Optimization Results</h2>
          <p className="text-fluid-base text-muted-foreground">
            Sequence optimized to minimize changeover time.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateTo("changeover-config")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveToHistory}
            disabled={isSaved || isSaving}
          >
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save to History'}
              </>
            )}
          </Button>
          <Button onClick={() => navigateTo("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Summary Cards - Primary: Downtime (Production Impact) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span className="font-medium">Downtime</span>
          <span>(Production line stopped)</span>
        </div>
        <div className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Original Downtime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.totalDowntimeBefore} min</div>
              <p className="text-xs text-muted-foreground">Work time: {result.totalBefore} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimized Downtime</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.totalDowntimeAfter} min</div>
              <p className="text-xs text-muted-foreground">Work time: {result.totalAfter} min</p>
            </CardContent>
          </Card>
          <Card className="border-success-500/50 bg-success-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downtime Saved</CardTitle>
              <TrendingDown className="h-4 w-4 text-success-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">-{result.downtimeSavings} min</div>
              <p className="text-xs text-success-600 font-medium">
                {result.downtimeSavingsPercent}% reduction
                {result.savings !== result.downtimeSavings && (
                  <span className="text-muted-foreground font-normal"> (Work: {result.savingsPercent}%)</span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{result.sequence.length}</div>
              <p className="text-xs text-muted-foreground">Total orders sequenced</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Visual Charts */}
        <ResultsChart result={result} />

        {/* Attribute Breakdown Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Attribute Impact</CardTitle>
            <CardDescription>Breakdown of changeover costs by attribute and parallel group.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 normal:grid-cols-2 wide:grid-cols-3 gap-4">
              {result.attributeStats.map((stat) => (
                <div
                  key={stat.column}
                  className={`flex items-center justify-between p-4 border border-l-4 rounded-lg bg-muted/20 ${
                    stat.parallelGroup === 'A' ? 'border-l-blue-500' :
                    stat.parallelGroup === 'B' ? 'border-l-green-500' :
                    stat.parallelGroup === 'C' ? 'border-l-orange-500' :
                    stat.parallelGroup === 'D' ? 'border-l-purple-500' :
                    'border-l-gray-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{stat.column}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.changeoverCount} changes
                      {stat.parallelGroup !== 'default' && (
                        <span className="ml-2 text-muted-foreground/70">
                          Group {stat.parallelGroup}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{stat.totalTime} min</p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round((stat.totalTime / result.totalAfter) * 100) || 0}% of work
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sequence Table */}
        <Card>
          <CardHeader>
            <CardTitle>Optimized Sequence</CardTitle>
            <CardDescription>
              Detailed step-by-step production schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>{config.orderIdColumn || 'Order ID'}</TableHead>
                    {config.attributes.map(attr => (
                      <TableHead key={attr.column}>{attr.column}</TableHead>
                    ))}
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end">
                        <span>Downtime</span>
                        <span className="text-[10px] font-normal text-muted-foreground">Work</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                    {result.sequence.map((order) => (
                      <TableRow key={order.sequenceNumber}>
                        <TableCell className="font-medium text-muted-foreground">
                          {order.sequenceNumber}
                        </TableCell>
                        <TableCell className="font-semibold">{order.id}</TableCell>
                        {config.attributes.map(attr => (
                          <TableCell key={`${order.id}-${attr.column}`}>
                            {order.values[attr.column]}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {order.downtime > 0 || order.workTime > 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex flex-col items-end gap-0.5">
                                <Badge variant="secondary" className="font-mono">
                                  +{order.downtime}m
                                </Badge>
                                {order.workTime !== order.downtime && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    +{order.workTime}m
                                  </span>
                                )}
                              </div>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium mb-1">Attributes changed:</p>
                                  <ul className="list-disc list-inside">
                                    {order.changeoverReasons.map(reason => (
                                      <li key={reason}>{reason}</li>
                                    ))}
                                  </ul>
                                  {order.workTime !== order.downtime && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Downtime: {order.downtime}m (parallel activities)
                                      <br />
                                      Work time: {order.workTime}m (total labor)
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
