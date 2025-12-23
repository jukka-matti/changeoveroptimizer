import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizationResult } from '@/types';

interface ResultsChartProps {
  result: OptimizationResult;
}

export function ResultsChart({ result }: ResultsChartProps) {
  // Chart data with both downtime and work time
  const chartData = [
    {
      name: 'Original',
      downtime: result.totalDowntimeBefore,
      workTime: result.totalBefore,
    },
    {
      name: 'Optimized',
      downtime: result.totalDowntimeAfter,
      workTime: result.totalAfter,
    },
  ];

  const attributeData = result.attributeStats.map(stat => ({
    name: stat.column,
    time: stat.totalTime,
    group: stat.parallelGroup,
  })).sort((a, b) => b.time - a.time);

  // Check if downtime differs from work time (parallel groups are in use)
  const hasParallelism = result.totalDowntimeBefore !== result.totalBefore ||
    result.totalDowntimeAfter !== result.totalAfter;

  return (
    <div className="grid grid-cols-1 normal:grid-cols-2 gap-6 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time Comparison</CardTitle>
          <CardDescription>
            {hasParallelism
              ? 'Downtime (production) vs Work time (labor)'
              : 'Minutes spent on changeovers'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              {hasParallelism && <Legend />}
              <Bar
                dataKey="downtime"
                name="Downtime"
                fill="oklch(0.55 0.20 250)"
                radius={[4, 4, 0, 0]}
                barSize={hasParallelism ? 30 : 60}
              />
              {hasParallelism && (
                <Bar
                  dataKey="workTime"
                  name="Work Time"
                  fill="oklch(0.70 0.10 250)"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time by Attribute</CardTitle>
          <CardDescription>Minutes per changeover type (work time)</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attributeData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="time" fill="oklch(0.66 0.16 250)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
