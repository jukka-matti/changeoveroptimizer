import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImprovementTrendData } from '@/types/analytics';

interface ImprovementTrendChartProps {
  data: ImprovementTrendData[];
}

export function ImprovementTrendChart({ data }: ImprovementTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Improvement Trends</CardTitle>
          <CardDescription>Monthly improvement activity</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No improvement data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format month labels
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Improvement Trends</CardTitle>
        <CardDescription>Ideas created vs implemented vs verified over time</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="ideasCreated"
              name="Ideas"
              stroke="oklch(0.60 0.15 250)"
              fill="oklch(0.85 0.10 250)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="implementedCount"
              name="Implemented"
              stroke="oklch(0.60 0.15 145)"
              fill="oklch(0.85 0.10 145)"
              stackId="2"
            />
            <Area
              type="monotone"
              dataKey="verifiedCount"
              name="Verified"
              stroke="oklch(0.60 0.20 35)"
              fill="oklch(0.85 0.15 35)"
              stackId="3"
            />
          </AreaChart>
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
