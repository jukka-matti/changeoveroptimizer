import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SmedOverviewStats } from '@/types/analytics';
import { BarChart3, TrendingUp, FileText, Activity } from 'lucide-react';

interface SmedOverviewCardsProps {
  stats: SmedOverviewStats | null;
}

export function SmedOverviewCards({ stats }: SmedOverviewCardsProps) {
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
      title: 'Total Studies',
      value: stats.totalStudies,
      icon: FileText,
      description: `${stats.activeStudies} active`,
    },
    {
      title: 'Total Baseline',
      value: `${stats.totalBaselineMinutes.toFixed(0)} min`,
      icon: BarChart3,
      description: 'Sum of all baseline times',
    },
    {
      title: 'Current Total',
      value: `${stats.totalCurrentMinutes.toFixed(0)} min`,
      icon: Activity,
      description: 'Sum of current times',
    },
    {
      title: 'Savings Achieved',
      value: `${stats.totalSavingsPercent.toFixed(1)}%`,
      icon: TrendingUp,
      description: `${stats.totalSavingsMinutes.toFixed(0)} min saved`,
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
