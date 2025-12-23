import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAuth, getCurrentUser } from '@/lib/auth/session'
import { generateOrderNumber } from '@/lib/utils'

export interface OrderWithItems {
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
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    createdAt: Date | null
  }>
}

interface CreateOrderInput {
  shippingAddressId: number
  billingAddressId: number
  shippingMethod: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'check' | 'transfer'
  notes?: string
}

/**
 * Create a new order from cart
 */
export const createOrder = createServerFn({ method: 'POST' })
  .validator((data: CreateOrderInput) => {
    if (!data.shippingAddressId || !data.billingAddressId) {
      throw new Error('Addresses required')
    }
    if (!['pickup', 'delivery'].includes(data.shippingMethod)) {
      throw new Error('Invalid shipping method')
    }
    if (!['cash', 'check', 'transfer'].includes(data.paymentMethod)) {
      throw new Error('Invalid payment method')
    }
    return data
  })
  .handler(async ({ data }) => {
    const db = getDb()
    const user = await requireAuth()

    // Get user's cart
    const cart = await db
      .select()
      .from(schema.carts)
      .where(eq(schema.carts.userId, user.id))
      .limit(1)

    if (!cart[0]) {
      throw new Error('Cart not found')
    }

    // Get cart items
    const cartItems = await db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.cartId, cart[0].id))

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Get product details and verify stock
    const orderItems: Array<{
      productId: number
      productName: string
      productSku: string
      quantity: number
      unitPriceHt: number
      taxRate: number
    }> = []

    let subtotalHt = 0

    for (const item of cartItems) {
      const product = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1)

      if (!product[0]) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product[0].stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product[0].name}`)
      }

      orderItems.push({
        productId: product[0].id,
        productName: product[0].name,
        productSku: product[0].sku,
        quantity: item.quantity,
        unitPriceHt: product[0].priceHt,
        taxRate: product[0].taxRate,
      })

      subtotalHt += product[0].priceHt * item.quantity
    }

    // Calculate totals
    const taxAmount = orderItems.reduce(
      (sum, item) =>
        sum + item.unitPriceHt * item.quantity * (item.taxRate / 100),
      0
    )
    const shippingCost = data.shippingMethod === 'delivery' ? 5.9 : 0
    const totalTtc = subtotalHt + taxAmount + shippingCost

    // Create order
    const orderNumber = generateOrderNumber()

    const order = await db
      .insert(schema.orders)
      .values({
        userId: user.id,
        orderNumber,
        status: 'pending',
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
        shippingMethod: data.shippingMethod,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        subtotalHt,
        taxAmount,
        shippingCost,
        totalTtc,
        notes: data.notes || null,
      })
      .returning()

    const orderId = order[0].id

    // Create order items
    for (const item of orderItems) {
      await db.insert(schema.orderItems).values({
        orderId,
        ...item,
      })

      // Update stock
      const product = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1)

      if (product[0]) {
        await db
          .update(schema.products)
          .set({ stockQuantity: product[0].stockQuantity - item.quantity })
          .where(eq(schema.products.id, item.productId))

        // Log stock movement
        await db.insert(schema.stockMovements).values({
          productId: item.productId,
          quantity: -item.quantity,
          type: 'out',
          reference: orderNumber,
          notes: `Vente - Commande ${orderNumber}`,
        })
      }
    }

    // Add order history entry
    await db.insert(schema.orderHistory).values({
      orderId,
      status: 'pending',
      comment: 'Commande créée',
    })

    // Clear cart
    await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cart[0].id))

    return { orderId, orderNumber }
  })

/**
 * Get user's orders
 */
export const getUserOrders = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = getDb()
    const user = await requireAuth()

    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt))

    return orders
  }
)

/**
 * Get a specific order by ID
 */
export const getOrder = createServerFn({ method: 'GET' })
  .validator((orderId: number) => {
    if (!orderId) throw new Error('Order ID required')
    return orderId
  })
  .handler(async ({ data: orderId }): Promise<OrderWithItems | null> => {
    const db = getDb()
    const user = await requireAuth()

    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(eq(schema.orders.id, orderId), eq(schema.orders.userId, user.id))
      )
      .limit(1)

    if (!orders[0]) {
      return null
    }

    const order = orders[0]

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
      items,
      history,
    }
  })

/**
 * Cancel an order (only if pending)
 */
export const cancelOrder = createServerFn({ method: 'POST' })
  .validator((orderId: number) => {
    if (!orderId) throw new Error('Order ID required')
    return orderId
  })
  .handler(async ({ data: orderId }) => {
    const db = getDb()
    const user = await requireAuth()

    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(eq(schema.orders.id, orderId), eq(schema.orders.userId, user.id))
      )
      .limit(1)

    if (!orders[0]) {
      throw new Error('Order not found')
    }

    if (orders[0].status !== 'pending') {
      throw new Error('Only pending orders can be cancelled')
    }

    // Get order items to restore stock
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId))

    // Restore stock
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
          notes: `Annulation - Commande ${orders[0].orderNumber}`,
        })
      }
    }

    // Update order status
    await db
      .update(schema.orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId))

    // Add history entry
    await db.insert(schema.orderHistory).values({
      orderId,
      status: 'cancelled',
      comment: 'Commande annulée par le client',
    })

    return { success: true }
  })
