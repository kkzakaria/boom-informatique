import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { getResendClient, FROM_EMAIL, isEmailEnabled } from '@/lib/email/resend'
import {
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
} from '@/lib/email/templates/order-confirmation'
import {
  generateOrderStatusHtml,
  generateOrderStatusText,
} from '@/lib/email/templates/order-status'
import {
  generateQuoteSentHtml,
  generateQuoteSentText,
} from '@/lib/email/templates/quote-sent'
import {
  generateProValidationHtml,
  generateProValidationText,
} from '@/lib/email/templates/pro-validation'

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = createServerFn({ method: 'POST' })
  .inputValidator((orderId: number) => {
    if (!orderId) throw new Error('Order ID is required')
    return orderId
  })
  .handler(async ({ data: orderId }) => {
    if (!isEmailEnabled()) {
      console.log('[Email] Resend not configured, skipping order confirmation email')
      return { success: false, reason: 'Email not configured' }
    }

    const db = getDb()

    // Get order with items and user
    const order = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1)

    if (!order[0]) {
      throw new Error('Order not found')
    }

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, order[0].userId))
      .limit(1)

    if (!user[0]) {
      throw new Error('User not found')
    }

    const orderItems = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId))

    // Get shipping address if delivery
    let shippingAddress
    if (order[0].shippingMethod === 'delivery' && order[0].shippingAddressId) {
      const address = await db
        .select()
        .from(schema.addresses)
        .where(eq(schema.addresses.id, order[0].shippingAddressId))
        .limit(1)
      shippingAddress = address[0]
    }

    const emailData = {
      orderNumber: order[0].orderNumber,
      customerName: user[0].firstName
        ? `${user[0].firstName} ${user[0].lastName || ''}`
        : user[0].email,
      shippingMethod: order[0].shippingMethod,
      paymentMethod: order[0].paymentMethod,
      items: orderItems.map((item) => ({
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPriceHt: item.unitPriceHt,
        taxRate: item.taxRate,
      })),
      subtotalHt: order[0].subtotalHt,
      taxAmount: order[0].taxAmount,
      shippingCost: order[0].shippingCost,
      totalTtc: order[0].totalTtc,
      shippingAddress: shippingAddress
        ? {
            street: shippingAddress.street,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
          }
        : undefined,
      notes: order[0].notes || undefined,
    }

    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user[0].email,
        subject: `Confirmation de commande #${order[0].orderNumber} - Boom Informatique`,
        html: generateOrderConfirmationHtml(emailData),
        text: generateOrderConfirmationText(emailData),
      })

      console.log(`[Email] Order confirmation sent for order #${order[0].orderNumber}`)
      return { success: true }
    } catch (error) {
      console.error('[Email] Failed to send order confirmation:', error)
      return { success: false, reason: String(error) }
    }
  })

/**
 * Send order status update email
 */
export const sendOrderStatusEmail = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: number; comment?: string }) => {
    if (!data.orderId) throw new Error('Order ID is required')
    return data
  })
  .handler(async ({ data }) => {
    if (!isEmailEnabled()) {
      console.log('[Email] Resend not configured, skipping order status email')
      return { success: false, reason: 'Email not configured' }
    }

    const db = getDb()

    // Get order with user
    const order = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, data.orderId))
      .limit(1)

    if (!order[0]) {
      throw new Error('Order not found')
    }

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, order[0].userId))
      .limit(1)

    if (!user[0]) {
      throw new Error('User not found')
    }

    // Only send for certain status changes
    const statusesToNotify = ['confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']
    if (!statusesToNotify.includes(order[0].status)) {
      return { success: false, reason: 'Status does not require notification' }
    }

    const emailData = {
      orderNumber: order[0].orderNumber,
      customerName: user[0].firstName
        ? `${user[0].firstName} ${user[0].lastName || ''}`
        : user[0].email,
      status: order[0].status as 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled',
      shippingMethod: order[0].shippingMethod,
      comment: data.comment,
    }

    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user[0].email,
        subject: `Mise à jour de votre commande #${order[0].orderNumber} - Boom Informatique`,
        html: generateOrderStatusHtml(emailData),
        text: generateOrderStatusText(emailData),
      })

      console.log(`[Email] Status update sent for order #${order[0].orderNumber}`)
      return { success: true }
    } catch (error) {
      console.error('[Email] Failed to send order status:', error)
      return { success: false, reason: String(error) }
    }
  })

/**
 * Send quote to client email
 */
export const sendQuoteEmail = createServerFn({ method: 'POST' })
  .inputValidator((quoteId: number) => {
    if (!quoteId) throw new Error('Quote ID is required')
    return quoteId
  })
  .handler(async ({ data: quoteId }) => {
    if (!isEmailEnabled()) {
      console.log('[Email] Resend not configured, skipping quote email')
      return { success: false, reason: 'Email not configured' }
    }

    const db = getDb()

    // Get quote with items and user
    const quote = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.id, quoteId))
      .limit(1)

    if (!quote[0]) {
      throw new Error('Quote not found')
    }

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, quote[0].userId))
      .limit(1)

    if (!user[0]) {
      throw new Error('User not found')
    }

    const quoteItems = await db
      .select({
        id: schema.quoteItems.id,
        quantity: schema.quoteItems.quantity,
        unitPriceHt: schema.quoteItems.unitPriceHt,
        discountRate: schema.quoteItems.discountRate,
        productName: schema.products.name,
        productSku: schema.products.sku,
      })
      .from(schema.quoteItems)
      .leftJoin(schema.products, eq(schema.quoteItems.productId, schema.products.id))
      .where(eq(schema.quoteItems.quoteId, quoteId))

    if (!quote[0].validUntil) {
      throw new Error('Quote validity date is not set')
    }

    const emailData = {
      quoteNumber: quote[0].quoteNumber,
      customerName: user[0].firstName
        ? `${user[0].firstName} ${user[0].lastName || ''}`
        : user[0].email,
      companyName: user[0].companyName || undefined,
      items: quoteItems.map((item) => ({
        productName: item.productName || 'Produit inconnu',
        productSku: item.productSku || '',
        quantity: item.quantity,
        unitPriceHt: item.unitPriceHt,
        discountRate: item.discountRate || 0,
      })),
      subtotalHt: quote[0].subtotalHt,
      discountAmount: quote[0].discountAmount || 0,
      taxAmount: quote[0].taxAmount,
      totalHt: quote[0].totalHt,
      validUntil: new Date(quote[0].validUntil),
      notes: quote[0].notes || undefined,
    }

    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user[0].email,
        subject: `Votre devis #${quote[0].quoteNumber} - Boom Informatique`,
        html: generateQuoteSentHtml(emailData),
        text: generateQuoteSentText(emailData),
      })

      console.log(`[Email] Quote sent for #${quote[0].quoteNumber}`)
      return { success: true }
    } catch (error) {
      console.error('[Email] Failed to send quote:', error)
      return { success: false, reason: String(error) }
    }
  })

/**
 * Send pro account validation email
 */
export const sendProValidationEmail = createServerFn({ method: 'POST' })
  .inputValidator((userId: number) => {
    if (!userId) throw new Error('User ID is required')
    return userId
  })
  .handler(async ({ data: userId }) => {
    if (!isEmailEnabled()) {
      console.log('[Email] Resend not configured, skipping pro validation email')
      return { success: false, reason: 'Email not configured' }
    }

    const db = getDb()

    // Get user
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)

    if (!user[0]) {
      throw new Error('User not found')
    }

    if (user[0].role !== 'pro') {
      throw new Error('User is not a pro account')
    }

    const emailData = {
      customerName: user[0].firstName
        ? `${user[0].firstName} ${user[0].lastName || ''}`
        : user[0].email,
      companyName: user[0].companyName || 'Votre entreprise',
      discountRate: user[0].discountRate || 0,
    }

    try {
      const resend = getResendClient()
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user[0].email,
        subject: 'Compte professionnel validé - Boom Informatique',
        html: generateProValidationHtml(emailData),
        text: generateProValidationText(emailData),
      })

      console.log(`[Email] Pro validation sent to ${user[0].email}`)
      return { success: true }
    } catch (error) {
      console.error('[Email] Failed to send pro validation:', error)
      return { success: false, reason: String(error) }
    }
  })
