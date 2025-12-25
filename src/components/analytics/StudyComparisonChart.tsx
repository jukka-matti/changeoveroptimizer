import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudyComparisonData } from '@/types/analytics';

interface StudyComparisonChartProps {
  data: StudyComparisonData[];
}

export function StudyComparisonChart({ data }: StudyComparisonChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Study Comparison</CardTitle>
          <CardDescription>Baseline vs Current vs Target times</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No study data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 10).map((study) => ({
    name: study.name.length > 15 ? study.name.slice(0, 15) + '...' : study.name,
    baseline: study.baselineMinutes ?? 0,
    current: study.currentMinutes ?? 0,
    target: study.targetMinutes ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study Comparison</CardTitle>
        <CardDescription>Baseline vs Current vs Target times (minutes)</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="baseline" name="Baseline" fill="oklch(0.70 0.10 15)" radius={[0, 4, 4, 0]} barSize={8} />
            <Bar dataKey="current" name="Current" fill="oklch(0.55 0.20 250)" radius={[0, 4, 4, 0]} barSize={8} />
            <Bar dataKey="target" name="Target" fill="oklch(0.65 0.20 145)" radius={[0, 4, 4, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
