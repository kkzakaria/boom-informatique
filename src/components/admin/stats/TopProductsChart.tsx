'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

interface TopProduct {
  id: number
  name: string
  sku: string
  quantity: number
  revenue: number
}

interface TopProductsChartProps {
  data: TopProduct[]
  metric?: 'quantity' | 'revenue'
}

const COLORS = [
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#bfdbfe',
  '#dbeafe',
  '#eff6ff',
]

export function TopProductsChart({ data, metric = 'quantity' }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-[--text-muted]">
        Aucune donnée disponible
      </div>
    )
  }

  const chartData = data.map((product) => ({
    ...product,
    shortName: product.name.length > 20 ? product.name.slice(0, 20) + '...' : product.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value) =>
            metric === 'revenue' ? `${(value / 1000).toFixed(0)}k€` : value.toString()
          }
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          width={95}
        />
        <Tooltip
          formatter={(value) => {
            const numValue = value as number
            if (metric === 'revenue') return [formatPrice(numValue), 'CA']
            return [numValue, 'Quantité vendue']
          }}
          labelFormatter={(label) => label}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
