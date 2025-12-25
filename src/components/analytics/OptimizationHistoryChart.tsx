import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OptimizationTrendData } from '@/types/analytics';

interface OptimizationHistoryChartProps {
  data: OptimizationTrendData[];
}

export function OptimizationHistoryChart({ data }: OptimizationHistoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Savings Over Time</CardTitle>
          <CardDescription>Monthly optimization savings trend</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No optimization history available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Savings Over Time</CardTitle>
        <CardDescription>Monthly average savings percentage and total saved</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" unit="%" />
            <YAxis yAxisId="right" orientation="right" unit=" min" />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Average Savings') return `${value.toFixed(1)}%`;
                return `${value.toFixed(0)} min`;
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="averageSavingsPercent"
              name="Average Savings"
              stroke="oklch(0.55 0.20 250)"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.55 0.20 250)' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalSavingsMinutes"
              name="Total Saved"
              stroke="oklch(0.65 0.20 145)"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.65 0.20 145)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}
