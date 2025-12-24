import { formatPrice } from '@/lib/utils'
import { TrendingUp, ShoppingCart, Users, Repeat } from 'lucide-react'

interface StatsSummaryProps {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  newCustomers: number
  repeatCustomerRate: number
}

export function StatsSummary({
  totalRevenue,
  totalOrders,
  averageOrderValue,
  newCustomers,
  repeatCustomerRate,
}: StatsSummaryProps) {
  const stats = [
    {
      label: 'Chiffre d\'affaires',
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      color: 'text-success-dark bg-success-light',
    },
    {
      label: 'Commandes',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-primary-700 bg-primary-100',
    },
    {
      label: 'Panier moyen',
      value: formatPrice(averageOrderValue),
      icon: ShoppingCart,
      color: 'text-info-dark bg-info-light',
    },
    {
      label: 'Nouveaux clients',
      value: newCustomers.toString(),
      icon: Users,
      color: 'text-warning-dark bg-warning-light',
    },
    {
      label: 'Taux de fidélisation',
      value: `${repeatCustomerRate.toFixed(1)}%`,
      icon: Repeat,
      color: 'text-purple-700 bg-purple-100',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-[--text-muted]">{stat.label}</p>
              <p className="text-xl font-bold text-[--text-primary]">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
