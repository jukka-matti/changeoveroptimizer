import { useEffect } from 'react';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCw, AlertCircle, BarChart3, History } from 'lucide-react';
import {
  SmedOverviewCards,
  StudyStatusChart,
  StudyComparisonChart,
  ImprovementTrendChart,
  OptimizationOverviewCards,
  OptimizationHistoryChart,
  OptimizationRunsTable,
} from '@/components/analytics';
import type { AnalyticsTab } from '@/types/analytics';

export function AnalyticsDashboardScreen() {
  const { navigateTo } = useAppStore();
  const {
    activeTab,
    setActiveTab,
    smedOverview,
    studyComparison,
    improvementTrends,
    optimizationRuns,
    optimizationTrends,
    optimizationOverview,
    isLoading,
    error,
    clearError,
    loadAllAnalytics,
    deleteOptimizationRun,
  } = useAnalyticsStore();

  // Load analytics data on mount
  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  const handleRefresh = () => {
    loadAllAnalytics();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this optimization run?')) {
      await deleteOptimizationRun(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateTo('welcome')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track optimization savings and SMED improvements
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as AnalyticsTab)}
        className="flex-1 mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="smed" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            SMED Analytics
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Optimization History
          </TabsTrigger>
        </TabsList>

        {/* SMED Analytics Tab */}
        <TabsContent value="smed" className="mt-6 space-y-6">
          <SmedOverviewCards stats={smedOverview} />

          <div className="grid grid-cols-1 normal:grid-cols-2 gap-6">
            <StudyStatusChart stats={smedOverview} />
            <StudyComparisonChart data={studyComparison} />
          </div>

          <ImprovementTrendChart data={improvementTrends} />
        </TabsContent>

        {/* Optimization History Tab */}
        <TabsContent value="optimization" className="mt-6 space-y-6">
          <OptimizationOverviewCards stats={optimizationOverview} />

          <OptimizationHistoryChart data={optimizationTrends} />

          <OptimizationRunsTable runs={optimizationRuns} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
