import { createServerFn } from '@tanstack/react-start'
import { and, gte, lte, count, sql, desc, eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export type DateRange = '7d' | '30d' | '90d' | '12m'

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  id: number
  name: string
  sku: string
  quantity: number
  revenue: number
}

interface TopCategory {
  id: number
  name: string
  quantity: number
  revenue: number
}

interface CustomerTypeData {
  type: string
  count: number
  revenue: number
}

interface StatsSummary {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  newCustomers: number
  conversionRate: number
  repeatCustomerRate: number
}

function getDateRangeBounds(range: DateRange): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '12m':
      start.setMonth(start.getMonth() - 12)
      break
  }

  return { start, end }
}

/**
 * Get revenue data over time
 */
export const getRevenueOverTime = createServerFn({ method: 'GET' })
  .inputValidator((range: DateRange = '30d') => range)
  .handler(async ({ data: range }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(range)

    // Determine grouping based on range
    const isMonthly = range === '12m'
    const dateFormat = isMonthly ? '%Y-%m' : '%Y-%m-%d'

    const results = await db
      .select({
        date: sql<string>`strftime('${sql.raw(dateFormat)}', ${schema.orders.createdAt} / 1000, 'unixepoch')`.as('date'),
        revenue: sql<number>`COALESCE(SUM(${schema.orders.totalTtc}), 0)`.as('revenue'),
        orders: sql<number>`COUNT(*)`.as('orders'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`strftime('${sql.raw(dateFormat)}', ${schema.orders.createdAt} / 1000, 'unixepoch')`)
      .orderBy(sql`date ASC`)

    return results as RevenueDataPoint[]
  })

/**
 * Get top selling products
 */
export const getTopProducts = createServerFn({ method: 'GET' })
  .inputValidator((data: { range: DateRange; limit: number } = { range: '30d', limit: 10 }) => data)
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(data.range)

    const results = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        quantity: sql<number>`SUM(${schema.orderItems.quantity})`.as('quantity'),
        revenue: sql<number>`SUM(${schema.orderItems.unitPriceHt} * ${schema.orderItems.quantity} * (1 + ${schema.orderItems.taxRate} / 100))`.as('revenue'),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )
      .groupBy(schema.products.id)
      .orderBy(desc(sql`quantity`))
      .limit(data.limit)

    return results as TopProduct[]
  })

/**
 * Get top categories
 */
export const getTopCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { range: DateRange; limit: number } = { range: '30d', limit: 5 }) => data)
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(data.range)

    const results = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        quantity: sql<number>`SUM(${schema.orderItems.quantity})`.as('quantity'),
        revenue: sql<number>`SUM(${schema.orderItems.unitPriceHt} * ${schema.orderItems.quantity} * (1 + ${schema.orderItems.taxRate} / 100))`.as('revenue'),
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )
      .groupBy(schema.categories.id)
      .orderBy(desc(sql`revenue`))
      .limit(data.limit)

    return results as TopCategory[]
  })

/**
 * Get customer type distribution (B2C vs B2B)
 */
export const getCustomerTypeStats = createServerFn({ method: 'GET' })
  .inputValidator((range: DateRange = '30d') => range)
  .handler(async ({ data: range }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(range)

    const results = await db
      .select({
        type: sql<string>`CASE WHEN ${schema.users.role} = 'pro' THEN 'B2B' ELSE 'B2C' END`.as('type'),
        count: sql<number>`COUNT(DISTINCT ${schema.orders.id})`.as('count'),
        revenue: sql<number>`COALESCE(SUM(${schema.orders.totalTtc}), 0)`.as('revenue'),
      })
      .from(schema.orders)
      .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`CASE WHEN ${schema.users.role} = 'pro' THEN 'B2B' ELSE 'B2C' END`)

    return results as CustomerTypeData[]
  })

/**
 * Get order status distribution
 */
export const getOrderStatusStats = createServerFn({ method: 'GET' })
  .inputValidator((range: DateRange = '30d') => range)
  .handler(async ({ data: range }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(range)

    const results = await db
      .select({
        status: schema.orders.status,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end)
        )
      )
      .groupBy(schema.orders.status)

    return results as { status: string; count: number }[]
  })

/**
 * Get summary statistics
 */
export const getStatsSummary = createServerFn({ method: 'GET' })
  .inputValidator((range: DateRange = '30d') => range)
  .handler(async ({ data: range }) => {
    requireAdmin()
    const db = getDb()
    const { start, end } = getDateRangeBounds(range)

    // Total revenue and orders
    const totals = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.totalTtc}), 0)`.as('totalRevenue'),
        totalOrders: sql<number>`COUNT(*)`.as('totalOrders'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )

    // New customers in period
    const newCustomers = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        and(
          gte(schema.users.createdAt, start),
          lte(schema.users.createdAt, end),
          sql`${schema.users.role} IN ('customer', 'pro')`
        )
      )

    // Repeat customers (customers with more than 1 order in period)
    const repeatCustomers = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(
        db
          .select({
            userId: schema.orders.userId,
            orderCount: sql<number>`COUNT(*)`.as('orderCount'),
          })
          .from(schema.orders)
          .where(
            and(
              gte(schema.orders.createdAt, start),
              lte(schema.orders.createdAt, end),
              eq(schema.orders.paymentStatus, 'paid')
            )
          )
          .groupBy(schema.orders.userId)
          .having(sql`COUNT(*) > 1`)
          .as('repeat_orders')
      )

    // Total unique customers in period
    const totalCustomersInPeriod = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${schema.orders.userId})`.as('count'),
      })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, start),
          lte(schema.orders.createdAt, end),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )

    const totalRevenue = totals[0]?.totalRevenue || 0
    const totalOrders = totals[0]?.totalOrders || 0
    const uniqueCustomers = totalCustomersInPeriod[0]?.count || 0
    const repeatCount = repeatCustomers[0]?.count || 0

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      newCustomers: newCustomers[0]?.count || 0,
      conversionRate: 0, // Would need visitor data to calculate
      repeatCustomerRate: uniqueCustomers > 0 ? (repeatCount / uniqueCustomers) * 100 : 0,
    } as StatsSummary
  })
