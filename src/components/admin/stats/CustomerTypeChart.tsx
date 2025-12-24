'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'
import { formatPrice } from '@/lib/utils'

interface CustomerTypeData {
  type: string
  count: number
  revenue: number
}

interface CustomerTypeChartProps {
  data: CustomerTypeData[]
  metric?: 'count' | 'revenue'
}

const COLORS = {
  B2C: '#2563eb',
  B2B: '#10b981',
}

export function CustomerTypeChart({ data, metric = 'count' }: CustomerTypeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-[--text-muted]">
        Aucune donnée disponible
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    value: metric === 'count' ? item.count : item.revenue,
    label: item.type === 'B2B' ? 'Professionnels' : 'Particuliers',
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          nameKey="label"
          label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.type}`}
              fill={COLORS[entry.type as keyof typeof COLORS] || '#6b7280'}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const numValue = value as number
            if (metric === 'revenue') return [formatPrice(numValue), 'CA']
            return [numValue, 'Commandes']
          }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-[--text-secondary]">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
