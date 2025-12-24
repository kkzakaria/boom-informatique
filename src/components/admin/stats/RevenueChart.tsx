'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  isMonthly?: boolean
}

function formatDate(dateStr: string, isMonthly: boolean) {
  if (isMonthly) {
    const [year, month] = dateStr.split('-')
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function RevenueChart({ data, isMonthly = false }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-[--text-muted]">
        Aucune donnée disponible pour cette période
      </div>
    )
  }

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date, isMonthly),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          formatter={(value, name) => {
            const numValue = value as number
            if (name === 'revenue') return [formatPrice(numValue), 'CA']
            return [numValue, 'Commandes']
          }}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        />
        <Legend
          formatter={(value) => (value === 'revenue' ? 'Chiffre d\'affaires' : 'Commandes')}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#2563eb"
          fill="url(#revenueGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
