import { createServerFn } from '@tanstack/react-start'
import { eq, and, gte, lte, count, sum, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export interface DashboardStats {
  ordersToday: number
  ordersPending: number
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  lowStockCount: number
  pendingProValidations: number
  totalProducts: number
  totalClients: number
}

export interface RecentOrder {
  id: number
  orderNumber: string
  status: string
  totalTtc: number
  createdAt: Date | null
  customerName: string
  customerEmail: string
}

export interface LowStockProduct {
  id: number
  name: string
  sku: string
  stockQuantity: number
  stockAlertThreshold: number | null
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireAdmin()
    const db = getDb()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Orders today
    const ordersToday = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, todayStart))

    // Pending orders
    const ordersPending = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'pending'))

    // Revenue today
    const revenueToday = await db
      .select({ total: sum(schema.orders.totalTtc) })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, todayStart),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )

    // Revenue this week
    const revenueWeek = await db
      .select({ total: sum(schema.orders.totalTtc) })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, weekStart),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )

    // Revenue this month
    const revenueMonth = await db
      .select({ total: sum(schema.orders.totalTtc) })
      .from(schema.orders)
      .where(
        and(
          gte(schema.orders.createdAt, monthStart),
          eq(schema.orders.paymentStatus, 'paid')
        )
      )

    // Low stock products
    const lowStock = await db
      .select({ count: count() })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          sql`${schema.products.stockQuantity} <= ${schema.products.stockAlertThreshold}`
        )
      )

    // Pending pro validations
    const pendingPro = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.role, 'pro'),
          eq(schema.users.isValidated, false)
        )
      )

    // Total products
    const totalProducts = await db
      .select({ count: count() })
      .from(schema.products)
      .where(eq(schema.products.isActive, true))

    // Total clients
    const totalClients = await db
      .select({ count: count() })
      .from(schema.users)
      .where(
        sql`${schema.users.role} IN ('customer', 'pro')`
      )

    return {
      ordersToday: ordersToday[0]?.count || 0,
      ordersPending: ordersPending[0]?.count || 0,
      revenueToday: revenueToday[0]?.total || 0,
      revenueWeek: revenueWeek[0]?.total || 0,
      revenueMonth: revenueMonth[0]?.total || 0,
      lowStockCount: lowStock[0]?.count || 0,
      pendingProValidations: pendingPro[0]?.count || 0,
      totalProducts: totalProducts[0]?.count || 0,
      totalClients: totalClients[0]?.count || 0,
    } as DashboardStats
  }
)

/**
 * Get recent orders for dashboard
 */
export const getRecentOrders = createServerFn({ method: 'GET' })
  .inputValidator((limit: number = 5) => limit)
  .handler(async ({ data: limit }) => {
    requireAdmin()
    const db = getDb()

    const orders = await db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        status: schema.orders.status,
        totalTtc: schema.orders.totalTtc,
        createdAt: schema.orders.createdAt,
        customerFirstName: schema.users.firstName,
        customerLastName: schema.users.lastName,
        customerEmail: schema.users.email,
      })
      .from(schema.orders)
      .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .orderBy(sql`${schema.orders.createdAt} DESC`)
      .limit(limit)

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalTtc: order.totalTtc,
      createdAt: order.createdAt,
      customerName: `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim() || 'Client',
      customerEmail: order.customerEmail,
    })) as RecentOrder[]
  })

/**
 * Get low stock products for dashboard
 */
export const getLowStockProducts = createServerFn({ method: 'GET' })
  .inputValidator((limit: number = 5) => limit)
  .handler(async ({ data: limit }) => {
    requireAdmin()
    const db = getDb()

    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        stockQuantity: schema.products.stockQuantity,
        stockAlertThreshold: schema.products.stockAlertThreshold,
      })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          sql`${schema.products.stockQuantity} <= ${schema.products.stockAlertThreshold}`
        )
      )
      .orderBy(schema.products.stockQuantity)
      .limit(limit)

    return products as LowStockProduct[]
  })
