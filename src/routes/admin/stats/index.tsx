import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getRevenueOverTime,
  getTopProducts,
  getTopCategories,
  getCustomerTypeStats,
  getStatsSummary,
  type DateRange,
} from '@/server/admin/stats'
import {
  DateRangeFilter,
  StatsSummary,
  RevenueChart,
  TopProductsChart,
  CustomerTypeChart,
} from '@/components/admin/stats'
import { formatPrice } from '@/lib/utils'
import { PieChart, TrendingUp, Package, Tag } from 'lucide-react'

export const Route = createFileRoute('/admin/stats/')({
  component: AdminStatsPage,
})

function AdminStatsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [productMetric, setProductMetric] = useState<'quantity' | 'revenue'>('quantity')

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin', 'stats', 'summary', dateRange],
    queryFn: () => getStatsSummary({ data: dateRange }),
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'stats', 'revenue', dateRange],
    queryFn: () => getRevenueOverTime({ data: dateRange }),
  })

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'stats', 'top-products', dateRange],
    queryFn: () => getTopProducts({ data: { range: dateRange, limit: 7 } }),
  })

  const { data: topCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin', 'stats', 'top-categories', dateRange],
    queryFn: () => getTopCategories({ data: { range: dateRange, limit: 5 } }),
  })

  const { data: customerTypes, isLoading: customerTypesLoading } = useQuery({
    queryKey: ['admin', 'stats', 'customer-types', dateRange],
    queryFn: () => getCustomerTypeStats({ data: dateRange }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
            Statistiques
          </h1>
          <p className="mt-1 text-[--text-muted]">
            Analysez les performances de votre boutique
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary KPIs */}
      {summaryLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-[--radius-lg] border border-[--border-default] bg-[--bg-muted]"
              />
            ))}
        </div>
      ) : summary ? (
        <StatsSummary
          totalRevenue={summary.totalRevenue}
          totalOrders={summary.totalOrders}
          averageOrderValue={summary.averageOrderValue}
          newCustomers={summary.newCustomers}
          repeatCustomerRate={summary.repeatCustomerRate}
        />
      ) : null}

      {/* Revenue Chart */}
      <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-[--text-primary]">Évolution du chiffre d'affaires</h2>
        </div>
        {revenueLoading ? (
          <div className="h-[300px] animate-pulse rounded bg-[--bg-muted]" />
        ) : (
          <RevenueChart data={revenueData || []} isMonthly={dateRange === '12m'} />
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              <h2 className="font-semibold text-[--text-primary]">Meilleures ventes</h2>
            </div>
            <div className="flex rounded-lg border border-[--border-default] bg-[--bg-card] p-0.5">
              <button
                onClick={() => setProductMetric('quantity')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  productMetric === 'quantity'
                    ? 'bg-primary-600 text-white'
                    : 'text-[--text-secondary] hover:bg-[--bg-muted]'
                }`}
              >
                Quantité
              </button>
              <button
                onClick={() => setProductMetric('revenue')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  productMetric === 'revenue'
                    ? 'bg-primary-600 text-white'
                    : 'text-[--text-secondary] hover:bg-[--bg-muted]'
                }`}
              >
                Revenus
              </button>
            </div>
          </div>
          {productsLoading ? (
            <div className="h-[300px] animate-pulse rounded bg-[--bg-muted]" />
          ) : (
            <TopProductsChart data={topProducts || []} metric={productMetric} />
          )}
        </div>

        {/* Customer Types */}
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-[--text-primary]">Répartition clients</h2>
          </div>
          {customerTypesLoading ? (
            <div className="h-[250px] animate-pulse rounded bg-[--bg-muted]" />
          ) : (
            <>
              <CustomerTypeChart data={customerTypes || []} />
              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[--border-default] pt-4">
                {customerTypes?.map((type) => (
                  <div key={type.type} className="text-center">
                    <p className="text-sm text-[--text-muted]">
                      {type.type === 'B2B' ? 'Professionnels' : 'Particuliers'}
                    </p>
                    <p className="text-lg font-bold text-[--text-primary]">
                      {formatPrice(type.revenue)}
                    </p>
                    <p className="text-xs text-[--text-muted]">{type.count} commandes</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Categories */}
      <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-[--text-primary]">Catégories les plus vendues</h2>
        </div>
        {categoriesLoading ? (
          <div className="h-24 animate-pulse rounded bg-[--bg-muted]" />
        ) : topCategories && topCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[--border-default] text-left text-sm text-[--text-muted]">
                  <th className="pb-3 font-medium">Catégorie</th>
                  <th className="pb-3 font-medium text-right">Quantité</th>
                  <th className="pb-3 font-medium text-right">Chiffre d'affaires</th>
                  <th className="pb-3 font-medium text-right">Part du CA</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalRevenue = topCategories.reduce((sum, c) => sum + c.revenue, 0)
                  return topCategories.map((category, index) => (
                    <tr key={category.id} className="border-b border-[--border-default] last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: `hsl(${220 - index * 30}, 70%, 55%)` }}
                          />
                          <span className="font-medium text-[--text-primary]">{category.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono text-[--text-secondary]">
                        {category.quantity}
                      </td>
                      <td className="py-3 text-right font-mono text-[--text-primary]">
                        {formatPrice(category.revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[--bg-muted]">
                            <div
                              className="h-full rounded-full bg-primary-600"
                              style={{ width: `${(category.revenue / totalRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-sm text-[--text-muted]">
                            {((category.revenue / totalRevenue) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-[--text-muted]">Aucune donnée disponible</p>
        )}
      </div>
    </div>
  )
}
