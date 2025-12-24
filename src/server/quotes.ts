import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAuth, getCurrentUser, hasRole, requireAdmin } from '@/lib/auth/session'
import { generateQuoteNumber } from '@/lib/utils'

export interface QuoteItem {
  productId: number
  quantity: number
  unitPriceHt: number
  discountRate?: number
}

export interface QuoteWithItems {
  id: number
  userId: number
  quoteNumber: string
  status: string
  validUntil: Date | null
  subtotalHt: number
  discountAmount: number | null
  taxAmount: number
  totalHt: number
  notes: string | null
  createdAt: Date | null
  items: Array<{
    id: number
    productId: number
    productName: string
    productSku: string
    quantity: number
    unitPriceHt: number
    discountRate: number | null
  }>
  customer?: {
    id: number
    email: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
  }
}

interface CreateQuoteInput {
  items: QuoteItem[]
  notes?: string
}

/**
 * Create a quote request from cart or product selection
 * Only for validated pro users
 */
export const createQuoteRequest = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateQuoteInput) => {
    if (!data.items || data.items.length === 0) {
      throw new Error('Quote must have at least one item')
    }
    return data
  })
  .handler(async ({ data }) => {
    const user = requireAuth()

    // Check if user is a validated pro
    if (user.role !== 'pro' || !user.isValidated) {
      throw new Error('Only validated pro accounts can request quotes')
    }

    const db = getDb()

    // Get product details to create quote items
    const productIds = data.items.map((item) => item.productId)
    const products = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.isActive, true))

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Calculate totals
    let subtotalHt = 0
    const quoteItems: Array<{
      productId: number
      productName: string
      productSku: string
      quantity: number
      unitPriceHt: number
      discountRate: number
    }> = []

    for (const item of data.items) {
      const product = productMap.get(item.productId)
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      const unitPriceHt = item.unitPriceHt || product.priceHt
      const discountRate = item.discountRate || 0
      const lineTotal = unitPriceHt * item.quantity * (1 - discountRate / 100)
      subtotalHt += lineTotal

      quoteItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPriceHt,
        discountRate,
      })
    }

    // Calculate tax (default 20%)
    const taxRate = 20
    const taxAmount = subtotalHt * (taxRate / 100)
    const totalHt = subtotalHt

    // Create quote
    const quoteNumber = generateQuoteNumber()
    const [quote] = await db
      .insert(schema.quotes)
      .values({
        userId: user.id,
        quoteNumber,
        status: 'draft',
        subtotalHt,
        discountAmount: 0,
        taxAmount,
        totalHt,
        notes: data.notes || null,
      })
      .returning()

    // Create quote items
    for (const item of quoteItems) {
      await db.insert(schema.quoteItems).values({
        quoteId: quote.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceHt: item.unitPriceHt,
        discountRate: item.discountRate,
      })
    }

    return { quoteId: quote.id, quoteNumber }
  })

/**
 * Get current user's quotes
 */
export const getMyQuotes = createServerFn({ method: 'GET' }).handler(async () => {
  const user = requireAuth()
  const db = getDb()

  const quotes = await db
    .select()
    .from(schema.quotes)
    .where(eq(schema.quotes.userId, user.id))
    .orderBy(desc(schema.quotes.createdAt))

  return quotes
})

/**
 * Get a specific quote by ID
 */
export const getQuoteById = createServerFn({ method: 'GET' })
  .inputValidator((quoteId: number | undefined) => {
    const id = Number(quoteId)
    if (!id || isNaN(id)) {
      throw new Error('Valid quote ID is required')
    }
    return id
  })
  .handler(async ({ data: quoteId }) => {
    const user = getCurrentUser()
    const db = getDb()

    const quote = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.id, quoteId))
      .limit(1)

    if (!quote[0]) {
      throw new Error('Quote not found')
    }

    // Check access - user owns the quote or is admin
    if (user?.role !== 'admin' && quote[0].userId !== user?.id) {
      throw new Error('Access denied')
    }

    // Get quote items with product info
    const items = await db
      .select({
        id: schema.quoteItems.id,
        productId: schema.quoteItems.productId,
        quantity: schema.quoteItems.quantity,
        unitPriceHt: schema.quoteItems.unitPriceHt,
        discountRate: schema.quoteItems.discountRate,
        productName: schema.products.name,
        productSku: schema.products.sku,
      })
      .from(schema.quoteItems)
      .innerJoin(
        schema.products,
        eq(schema.quoteItems.productId, schema.products.id)
      )
      .where(eq(schema.quoteItems.quoteId, quoteId))

    // Get customer info if admin
    let customer = undefined
    if (user?.role === 'admin') {
      const [customerData] = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          companyName: schema.users.companyName,
        })
        .from(schema.users)
        .where(eq(schema.users.id, quote[0].userId))
        .limit(1)

      customer = customerData
    }

    return {
      ...quote[0],
      items,
      customer,
    } as QuoteWithItems
  })

/**
 * Accept a quote and convert to order
 */
export const acceptQuote = createServerFn({ method: 'POST' })
  .inputValidator((quoteId: number) => quoteId)
  .handler(async ({ data: quoteId }) => {
    const user = requireAuth()
    const db = getDb()

    const quote = await db
      .select()
      .from(schema.quotes)
      .where(
        and(eq(schema.quotes.id, quoteId), eq(schema.quotes.userId, user.id))
      )
      .limit(1)

    if (!quote[0]) {
      throw new Error('Quote not found')
    }

    if (quote[0].status !== 'sent') {
      throw new Error('Quote cannot be accepted - invalid status')
    }

    // Check if quote is still valid
    if (quote[0].validUntil && new Date(quote[0].validUntil) < new Date()) {
      await db
        .update(schema.quotes)
        .set({ status: 'expired' })
        .where(eq(schema.quotes.id, quoteId))
      throw new Error('Quote has expired')
    }

    // Update quote status
    await db
      .update(schema.quotes)
      .set({ status: 'accepted' })
      .where(eq(schema.quotes.id, quoteId))

    return { success: true, quoteId }
  })

/**
 * Reject a quote (client side)
 */
export const rejectQuote = createServerFn({ method: 'POST' })
  .inputValidator((quoteId: number) => quoteId)
  .handler(async ({ data: quoteId }) => {
    const user = requireAuth()
    const db = getDb()

    const quote = await db
      .select()
      .from(schema.quotes)
      .where(
        and(eq(schema.quotes.id, quoteId), eq(schema.quotes.userId, user.id))
      )
      .limit(1)

    if (!quote[0]) {
      throw new Error('Quote not found')
    }

    if (quote[0].status !== 'sent') {
      throw new Error('Quote cannot be rejected - invalid status')
    }

    await db
      .update(schema.quotes)
      .set({ status: 'rejected' })
      .where(eq(schema.quotes.id, quoteId))

    return { success: true }
  })

// ============ ADMIN FUNCTIONS ============

/**
 * Get all quotes (admin)
 */
export const getAllQuotes = createServerFn({ method: 'GET' })
  .inputValidator(
    (filters: { status?: string; page?: number; limit?: number } | undefined) => {
      const safeFilters = filters || {}
      return {
        status: safeFilters.status,
        page: safeFilters.page || 1,
        limit: safeFilters.limit || 20,
      }
    }
  )
  .handler(async ({ data: filters }) => {
    requireAdmin()
    const db = getDb()

    const page = filters.page
    const limit = filters.limit
    const offset = (page - 1) * limit

    let query = db
      .select({
        id: schema.quotes.id,
        quoteNumber: schema.quotes.quoteNumber,
        status: schema.quotes.status,
        validUntil: schema.quotes.validUntil,
        totalHt: schema.quotes.totalHt,
        createdAt: schema.quotes.createdAt,
        customerEmail: schema.users.email,
        customerFirstName: schema.users.firstName,
        customerLastName: schema.users.lastName,
        customerCompany: schema.users.companyName,
      })
      .from(schema.quotes)
      .innerJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset)

    const quotes = await query

    return quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      validUntil: q.validUntil,
      totalHt: q.totalHt,
      createdAt: q.createdAt,
      customer: {
        email: q.customerEmail,
        name: `${q.customerFirstName || ''} ${q.customerLastName || ''}`.trim(),
        company: q.customerCompany,
      },
    }))
  })

/**
 * Update quote status (admin)
 */
export const updateQuoteStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { quoteId: number; status: string; validDays?: number }) => data
  )
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    const updateData: {
      status: string
      validUntil?: Date
    } = {
      status: data.status,
    }

    // If sending the quote, set validity period
    if (data.status === 'sent' && data.validDays) {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + data.validDays)
      updateData.validUntil = validUntil
    }

    await db
      .update(schema.quotes)
      .set(updateData)
      .where(eq(schema.quotes.id, data.quoteId))

    return { success: true }
  })

/**
 * Update quote items (admin)
 */
export const updateQuoteItems = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      quoteId: number
      items: Array<{
        id?: number
        productId: number
        quantity: number
        unitPriceHt: number
        discountRate: number
      }>
    }) => data
  )
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    // Delete existing items
    await db
      .delete(schema.quoteItems)
      .where(eq(schema.quoteItems.quoteId, data.quoteId))

    // Recalculate totals and insert new items
    let subtotalHt = 0

    for (const item of data.items) {
      const lineTotal =
        item.unitPriceHt * item.quantity * (1 - item.discountRate / 100)
      subtotalHt += lineTotal

      await db.insert(schema.quoteItems).values({
        quoteId: data.quoteId,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceHt: item.unitPriceHt,
        discountRate: item.discountRate,
      })
    }

    // Update quote totals
    const taxRate = 20
    const taxAmount = subtotalHt * (taxRate / 100)

    await db
      .update(schema.quotes)
      .set({
        subtotalHt,
        taxAmount,
        totalHt: subtotalHt,
      })
      .where(eq(schema.quotes.id, data.quoteId))

    return { success: true }
  })

/**
 * Send quote to client (admin)
 */
export const sendQuote = createServerFn({ method: 'POST' })
  .inputValidator((data: { quoteId: number; validDays: number }) => data)
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + data.validDays)

    await db
      .update(schema.quotes)
      .set({
        status: 'sent',
        validUntil,
      })
      .where(eq(schema.quotes.id, data.quoteId))

    // TODO: Send email notification to client

    return { success: true }
  })

/**
 * Convert accepted quote to order (admin)
 */
export const convertQuoteToOrder = createServerFn({ method: 'POST' })
  .inputValidator((quoteId: number) => quoteId)
  .handler(async ({ data: quoteId }) => {
    requireAdmin()
    const db = getDb()

    const quote = await getQuoteById(quoteId)

    if (quote.status !== 'accepted') {
      throw new Error('Only accepted quotes can be converted to orders')
    }

    // Get user's default addresses
    const addresses = await db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.userId, quote.userId))

    const shippingAddress = addresses.find(
      (a) => a.type === 'shipping' && a.isDefault
    )
    const billingAddress = addresses.find(
      (a) => a.type === 'billing' && a.isDefault
    )

    if (!shippingAddress || !billingAddress) {
      throw new Error('Customer has no default addresses')
    }

    // Create order from quote
    const { generateOrderNumber } = await import('@/lib/utils')
    const orderNumber = generateOrderNumber()

    const [order] = await db
      .insert(schema.orders)
      .values({
        userId: quote.userId,
        orderNumber,
        status: 'confirmed',
        paymentMethod: 'transfer',
        paymentStatus: 'pending',
        shippingMethod: 'delivery',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        subtotalHt: quote.subtotalHt,
        taxAmount: quote.taxAmount,
        shippingCost: 0,
        totalTtc: quote.totalHt * 1.2, // Add tax
        notes: `Créée depuis le devis ${quote.quoteNumber}`,
      })
      .returning()

    // Create order items from quote items
    for (const item of quote.items) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPriceHt: item.unitPriceHt * (1 - (item.discountRate || 0) / 100),
        taxRate: 20,
      })

      // Update stock
      await db
        .update(schema.products)
        .set({
          stockQuantity: schema.products.stockQuantity,
        })
        .where(eq(schema.products.id, item.productId))
    }

    // Add order history entry
    await db.insert(schema.orderHistory).values({
      orderId: order.id,
      status: 'confirmed',
      comment: `Commande créée depuis le devis ${quote.quoteNumber}`,
    })

    return { orderId: order.id, orderNumber }
  })
