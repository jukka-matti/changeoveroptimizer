import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OptimizationOverviewStats } from '@/types/analytics';
import { TrendingUp, ListChecks, Award, Clock } from 'lucide-react';

interface OptimizationOverviewCardsProps {
  stats: OptimizationOverviewStats | null;
}

export function OptimizationOverviewCards({ stats }: OptimizationOverviewCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 normal:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Runs',
      value: stats.totalRuns,
      icon: ListChecks,
      description: `${stats.totalOrdersOptimized} orders optimized`,
    },
    {
      title: 'Average Savings',
      value: `${stats.averageSavingsPercent.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Mean savings across all runs',
    },
    {
      title: 'Best Run',
      value: `${stats.bestSavingsPercent.toFixed(1)}%`,
      icon: Award,
      description: 'Highest savings achieved',
    },
    {
      title: 'Total Saved',
      value: `${stats.totalSavingsMinutes.toFixed(0)} min`,
      icon: Clock,
      description: `${stats.totalDowntimeSavingsMinutes.toFixed(0)} min downtime`,
    },
  ];

  return (
    <div className="grid grid-cols-2 normal:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
