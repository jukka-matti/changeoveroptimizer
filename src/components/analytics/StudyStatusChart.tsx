import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SmedOverviewStats } from '@/types/analytics';

interface StudyStatusChartProps {
  stats: SmedOverviewStats | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'oklch(0.70 0.10 250)',
  analyzing: 'oklch(0.65 0.20 35)',
  improving: 'oklch(0.60 0.20 145)',
  standardized: 'oklch(0.55 0.20 250)',
  archived: 'oklch(0.50 0.05 250)',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  analyzing: 'Analyzing',
  improving: 'Improving',
  standardized: 'Standardized',
  archived: 'Archived',
};

export function StudyStatusChart({ stats }: StudyStatusChartProps) {
  if (!stats || Object.keys(stats.studiesByStatus).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Studies by Status</CardTitle>
          <CardDescription>Distribution of study statuses</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-muted-foreground">No studies available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(stats.studiesByStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || 'oklch(0.60 0.10 250)',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Studies by Status</CardTitle>
        <CardDescription>Distribution of study statuses</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
