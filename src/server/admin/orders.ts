import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, like, sql, count } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export interface AdminOrderListItem {
  id: number
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalTtc: number
  createdAt: Date | null
  customerEmail: string
  customerName: string
  itemsCount: number
}

export interface AdminOrderDetail {
  id: number
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  shippingMethod: string
  subtotalHt: number
  taxAmount: number
  shippingCost: number
  totalTtc: number
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
  customer: {
    id: number
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    companyName: string | null
    role: string
  }
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  } | null
  billingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  } | null
  items: Array<{
    id: number
    productId: number
    productName: string
    productSku: string
    quantity: number
    unitPriceHt: number
    taxRate: number
    lineTotalHt: number
    lineTotalTtc: number
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    createdAt: Date | null
  }>
}

interface GetOrdersInput {
  page?: number
  limit?: number
  search?: string
  status?: string
}

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const

/**
 * Get all orders with pagination for admin
 */
export const getAdminOrders = createServerFn({ method: 'GET' })
  .inputValidator((input: GetOrdersInput | undefined) => {
    const safeInput = input || {}
    return {
      page: safeInput.page || 1,
      limit: safeInput.limit || 20,
      search: safeInput.search || '',
      status: safeInput.status || '',
    }
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { page, limit, search, status } = data
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []

    if (search) {
      conditions.push(
        sql`(${schema.orders.orderNumber} LIKE ${`%${search}%`} OR ${schema.users.email} LIKE ${`%${search}%`})`
      )
    }

    if (status && ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) {
      conditions.push(eq(schema.orders.status, status))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .where(whereClause)

    const total = totalResult[0]?.count || 0

    // Get orders with user info
    const orders = await db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        status: schema.orders.status,
        paymentMethod: schema.orders.paymentMethod,
        paymentStatus: schema.orders.paymentStatus,
        totalTtc: schema.orders.totalTtc,
        createdAt: schema.orders.createdAt,
        customerEmail: schema.users.email,
        customerFirstName: schema.users.firstName,
        customerLastName: schema.users.lastName,
        customerCompanyName: schema.users.companyName,
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit)
      .offset(offset)

    // Get items count for each order
    const orderIds = orders.map((o) => o.id)
    const itemsCounts =
      orderIds.length > 0
        ? await db
            .select({
              orderId: schema.orderItems.orderId,
              count: count(),
            })
            .from(schema.orderItems)
            .where(
              sql`${schema.orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`
            )
            .groupBy(schema.orderItems.orderId)
        : []

    const itemsCountMap = new Map(itemsCounts.map((ic) => [ic.orderId, ic.count]))

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        totalTtc: o.totalTtc,
        createdAt: o.createdAt,
        customerEmail: o.customerEmail || '',
        customerName: o.customerCompanyName ||
          [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') ||
          'Client anonyme',
        itemsCount: itemsCountMap.get(o.id) || 0,
      })) as AdminOrderListItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })

/**
 * Get order by ID for admin
 */
export const getAdminOrderById = createServerFn({ method: 'GET' })
  .inputValidator((id: number | undefined) => {
    const orderId = Number(id)
    if (!orderId || isNaN(orderId)) {
      throw new Error('Valid order ID is required')
    }
    return orderId
  })
  .handler(async ({ data: orderId }): Promise<AdminOrderDetail> => {
    requireAdmin()
    const db = getDb()

    // Get order with user
    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1)

    if (!orders[0]) {
      throw new Error('Order not found')
    }

    const order = orders[0]

    // Get customer
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, order.userId))
      .limit(1)

    const customer = users[0]

    // Get order items
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId))

    // Get order history
    const history = await db
      .select()
      .from(schema.orderHistory)
      .where(eq(schema.orderHistory.orderId, orderId))
      .orderBy(desc(schema.orderHistory.createdAt))

    // Get addresses
    const [shippingAddress, billingAddress] = await Promise.all([
      order.shippingAddressId
        ? db
            .select()
            .from(schema.addresses)
            .where(eq(schema.addresses.id, order.shippingAddressId))
            .limit(1)
        : Promise.resolve([]),
      order.billingAddressId
        ? db
            .select()
            .from(schema.addresses)
            .where(eq(schema.addresses.id, order.billingAddressId))
            .limit(1)
        : Promise.resolve([]),
    ])

    return {
      ...order,
      customer: customer
        ? {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            companyName: customer.companyName,
            role: customer.role,
          }
        : {
            id: 0,
            email: 'unknown',
            firstName: null,
            lastName: null,
            phone: null,
            companyName: null,
            role: 'customer',
          },
      shippingAddress: shippingAddress[0]
        ? {
            street: shippingAddress[0].street,
            city: shippingAddress[0].city,
            postalCode: shippingAddress[0].postalCode,
            country: shippingAddress[0].country,
          }
        : null,
      billingAddress: billingAddress[0]
        ? {
            street: billingAddress[0].street,
            city: billingAddress[0].city,
            postalCode: billingAddress[0].postalCode,
            country: billingAddress[0].country,
          }
        : null,
      items: items.map((item) => ({
        ...item,
        lineTotalHt: item.unitPriceHt * item.quantity,
        lineTotalTtc: item.unitPriceHt * item.quantity * (1 + item.taxRate / 100),
      })),
      history,
    }
  })

interface UpdateOrderStatusInput {
  orderId: number
  status: string
  comment?: string
}

/**
 * Update order status
 */
export const updateOrderStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateOrderStatusInput) => {
    if (!data.orderId) {
      throw new Error('Order ID is required')
    }
    if (!ORDER_STATUSES.includes(data.status as typeof ORDER_STATUSES[number])) {
      throw new Error('Invalid status')
    }
    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    // Get current order
    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, data.orderId))
      .limit(1)

    if (!orders[0]) {
      throw new Error('Order not found')
    }

    const currentStatus = orders[0].status

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    }

    if (!validTransitions[currentStatus]?.includes(data.status)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${data.status}`)
    }

    // If cancelling, restore stock
    if (data.status === 'cancelled' && currentStatus !== 'cancelled') {
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, data.orderId))

      for (const item of items) {
        const product = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .limit(1)

        if (product[0]) {
          await db
            .update(schema.products)
            .set({ stockQuantity: product[0].stockQuantity + item.quantity })
            .where(eq(schema.products.id, item.productId))

          await db.insert(schema.stockMovements).values({
            productId: item.productId,
            quantity: item.quantity,
            type: 'in',
            reference: orders[0].orderNumber,
            notes: `Annulation admin - Commande ${orders[0].orderNumber}`,
          })
        }
      }
    }

    // Update order status
    await db
      .update(schema.orders)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, data.orderId))

    // Add history entry
    await db.insert(schema.orderHistory).values({
      orderId: data.orderId,
      status: data.status,
      comment: data.comment || getStatusComment(data.status),
    })

    return { success: true }
  })

function getStatusComment(status: string): string {
  const comments: Record<string, string> = {
    confirmed: 'Commande confirmée',
    processing: 'En cours de préparation',
    shipped: 'Commande expédiée',
    delivered: 'Commande livrée',
    cancelled: 'Commande annulée par l\'administrateur',
  }
  return comments[status] || `Statut changé en ${status}`
}

/**
 * Get order statistics
 */
export const getOrderStats = createServerFn({ method: 'GET' }).handler(async () => {
  requireAdmin()
  const db = getDb()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get various stats
  const [
    pendingCount,
    todayOrders,
    todayRevenue,
  ] = await Promise.all([
    // Pending orders count
    db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'pending')),

    // Today's orders
    db
      .select({ count: count() })
      .from(schema.orders)
      .where(sql`${schema.orders.createdAt} >= ${today.toISOString()}`),

    // Today's revenue
    db
      .select({ total: sql<number>`COALESCE(SUM(${schema.orders.totalTtc}), 0)` })
      .from(schema.orders)
      .where(
        and(
          sql`${schema.orders.createdAt} >= ${today.toISOString()}`,
          sql`${schema.orders.status} != 'cancelled'`
        )
      ),
  ])

  return {
    pendingOrders: pendingCount[0]?.count || 0,
    todayOrders: todayOrders[0]?.count || 0,
    todayRevenue: todayRevenue[0]?.total || 0,
  }
})
