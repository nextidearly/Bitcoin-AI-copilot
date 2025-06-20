'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BitcoinChartProps {
  data: Array<{
    timestamp: string;
    price: number;
  }>;
}

export function BitcoinChart({ data }: BitcoinChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    price: item.price
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F7931A" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis 
          domain={['auto', 'auto']}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tick={{ fontSize: 12 }}
          tickMargin={8}
          width={80}
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Price']}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: 'white',
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#F7931A"
          fillOpacity={1}
          fill="url(#colorPrice)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}