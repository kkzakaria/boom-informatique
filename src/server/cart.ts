import { createServerFn } from '@tanstack/react-start'
import { eq, and, asc } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { getCurrentUser, getSessionCartId, setSessionCartId } from '@/lib/auth/session'
import type { CartItem } from '@/stores/cart'

export interface ServerCartItem extends CartItem {
  id: number
  cartId: number
}

interface CartWithItems {
  id: number
  items: ServerCartItem[]
}

/**
 * Get or create cart for current user/session
 */
async function getOrCreateCart(db: ReturnType<typeof getDb>): Promise<number> {
  const user = await getCurrentUser()

  if (user) {
    // Check for existing user cart
    const existingCart = await db
      .select()
      .from(schema.carts)
      .where(eq(schema.carts.userId, user.id))
      .limit(1)

    if (existingCart[0]) {
      return existingCart[0].id
    }

    // Create new cart for user
    const result = await db
      .insert(schema.carts)
      .values({ userId: user.id })
      .returning()

    return result[0].id
  }

  // Anonymous user - use session cart
  const sessionCartId = await getSessionCartId()

  if (sessionCartId) {
    // Verify cart still exists
    const existingCart = await db
      .select()
      .from(schema.carts)
      .where(eq(schema.carts.id, sessionCartId))
      .limit(1)

    if (existingCart[0]) {
      return existingCart[0].id
    }
  }

  // Create new anonymous cart
  const sessionId = crypto.randomUUID()
  const result = await db
    .insert(schema.carts)
    .values({ sessionId })
    .returning()

  await setSessionCartId(result[0].id)
  return result[0].id
}

/**
 * Get cart items with product details
 */
async function getCartItemsWithDetails(
  db: ReturnType<typeof getDb>,
  cartId: number
): Promise<ServerCartItem[]> {
  const items = await db
    .select()
    .from(schema.cartItems)
    .where(eq(schema.cartItems.cartId, cartId))

  const itemsWithDetails = await Promise.all(
    items.map(async (item) => {
      const product = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .limit(1)

      const image = await db
        .select()
        .from(schema.productImages)
        .where(
          and(
            eq(schema.productImages.productId, item.productId),
            eq(schema.productImages.isMain, true)
          )
        )
        .limit(1)

      const p = product[0]
      if (!p) {
        // Product no longer exists, skip it
        return null
      }

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: Math.min(item.quantity, p.stockQuantity), // Cap at available stock
        name: p.name,
        slug: p.slug,
        priceTtc: p.priceTtc,
        priceHt: p.priceHt,
        imageUrl: image[0]?.url || null,
        stockQuantity: p.stockQuantity,
      }
    })
  )

  return itemsWithDetails.filter((i): i is ServerCartItem => i !== null)
}

/**
 * Get current cart
 */
export const getCart = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CartWithItems | null> => {
    const db = getDb()
    const user = await getCurrentUser()
    const sessionCartId = await getSessionCartId()

    let cart = null

    if (user) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.userId, user.id))
        .limit(1)
      cart = carts[0]
    } else if (sessionCartId) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, sessionCartId))
        .limit(1)
      cart = carts[0]
    }

    if (!cart) {
      return null
    }

    const items = await getCartItemsWithDetails(db, cart.id)

    return {
      id: cart.id,
      items,
    }
  }
)

/**
 * Add item to cart
 */
export const addToCartServer = createServerFn({ method: 'POST' })
  .validator(
    (data: { productId: number; quantity: number }) => {
      if (!data.productId || data.quantity < 1) {
        throw new Error('Invalid product or quantity')
      }
      return data
    }
  )
  .handler(async ({ data }) => {
    const db = getDb()
    const cartId = await getOrCreateCart(db)

    // Check if product exists and has stock
    const product = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, data.productId))
      .limit(1)

    if (!product[0] || product[0].stockQuantity === 0) {
      throw new Error('Product not available')
    }

    // Check if item already in cart
    const existingItem = await db
      .select()
      .from(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.cartId, cartId),
          eq(schema.cartItems.productId, data.productId)
        )
      )
      .limit(1)

    if (existingItem[0]) {
      // Update quantity
      const newQuantity = Math.min(
        existingItem[0].quantity + data.quantity,
        product[0].stockQuantity
      )
      await db
        .update(schema.cartItems)
        .set({ quantity: newQuantity })
        .where(eq(schema.cartItems.id, existingItem[0].id))
    } else {
      // Add new item
      await db.insert(schema.cartItems).values({
        cartId,
        productId: data.productId,
        quantity: Math.min(data.quantity, product[0].stockQuantity),
      })
    }

    // Update cart timestamp
    await db
      .update(schema.carts)
      .set({ updatedAt: new Date() })
      .where(eq(schema.carts.id, cartId))

    return getCartItemsWithDetails(db, cartId)
  })

/**
 * Update cart item quantity
 */
export const updateCartItem = createServerFn({ method: 'POST' })
  .validator(
    (data: { productId: number; quantity: number }) => {
      if (!data.productId || data.quantity < 0) {
        throw new Error('Invalid product or quantity')
      }
      return data
    }
  )
  .handler(async ({ data }) => {
    const db = getDb()
    const user = await getCurrentUser()
    const sessionCartId = await getSessionCartId()

    let cart = null

    if (user) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.userId, user.id))
        .limit(1)
      cart = carts[0]
    } else if (sessionCartId) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, sessionCartId))
        .limit(1)
      cart = carts[0]
    }

    if (!cart) {
      throw new Error('Cart not found')
    }

    if (data.quantity === 0) {
      // Remove item
      await db
        .delete(schema.cartItems)
        .where(
          and(
            eq(schema.cartItems.cartId, cart.id),
            eq(schema.cartItems.productId, data.productId)
          )
        )
    } else {
      // Update quantity
      const product = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, data.productId))
        .limit(1)

      if (product[0]) {
        await db
          .update(schema.cartItems)
          .set({
            quantity: Math.min(data.quantity, product[0].stockQuantity),
          })
          .where(
            and(
              eq(schema.cartItems.cartId, cart.id),
              eq(schema.cartItems.productId, data.productId)
            )
          )
      }
    }

    // Update cart timestamp
    await db
      .update(schema.carts)
      .set({ updatedAt: new Date() })
      .where(eq(schema.carts.id, cart.id))

    return getCartItemsWithDetails(db, cart.id)
  })

/**
 * Remove item from cart
 */
export const removeFromCartServer = createServerFn({ method: 'POST' })
  .validator((productId: number) => {
    if (!productId) throw new Error('Product ID required')
    return productId
  })
  .handler(async ({ data: productId }) => {
    const db = getDb()
    const user = await getCurrentUser()
    const sessionCartId = await getSessionCartId()

    let cart = null

    if (user) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.userId, user.id))
        .limit(1)
      cart = carts[0]
    } else if (sessionCartId) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, sessionCartId))
        .limit(1)
      cart = carts[0]
    }

    if (!cart) {
      throw new Error('Cart not found')
    }

    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.cartId, cart.id),
          eq(schema.cartItems.productId, productId)
        )
      )

    return getCartItemsWithDetails(db, cart.id)
  })

/**
 * Clear cart
 */
export const clearCartServer = createServerFn({ method: 'POST' }).handler(
  async () => {
    const db = getDb()
    const user = await getCurrentUser()
    const sessionCartId = await getSessionCartId()

    let cart = null

    if (user) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.userId, user.id))
        .limit(1)
      cart = carts[0]
    } else if (sessionCartId) {
      const carts = await db
        .select()
        .from(schema.carts)
        .where(eq(schema.carts.id, sessionCartId))
        .limit(1)
      cart = carts[0]
    }

    if (cart) {
      await db
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.cartId, cart.id))
    }

    return []
  }
)

/**
 * Merge anonymous cart into user cart on login
 */
export const mergeCartsOnLogin = createServerFn({ method: 'POST' }).handler(
  async () => {
    const db = getDb()
    const user = await getCurrentUser()
    const sessionCartId = await getSessionCartId()

    if (!user || !sessionCartId) {
      return
    }

    // Get or create user cart
    let userCart = await db
      .select()
      .from(schema.carts)
      .where(eq(schema.carts.userId, user.id))
      .limit(1)

    let userCartId: number

    if (!userCart[0]) {
      const result = await db
        .insert(schema.carts)
        .values({ userId: user.id })
        .returning()
      userCartId = result[0].id
    } else {
      userCartId = userCart[0].id
    }

    // Get items from anonymous cart
    const anonymousItems = await db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.cartId, sessionCartId))

    // Merge items
    for (const item of anonymousItems) {
      const existing = await db
        .select()
        .from(schema.cartItems)
        .where(
          and(
            eq(schema.cartItems.cartId, userCartId),
            eq(schema.cartItems.productId, item.productId)
          )
        )
        .limit(1)

      if (existing[0]) {
        // Add quantities
        await db
          .update(schema.cartItems)
          .set({ quantity: existing[0].quantity + item.quantity })
          .where(eq(schema.cartItems.id, existing[0].id))
      } else {
        // Move item to user cart
        await db.insert(schema.cartItems).values({
          cartId: userCartId,
          productId: item.productId,
          quantity: item.quantity,
        })
      }
    }

    // Delete anonymous cart
    await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, sessionCartId))
    await db.delete(schema.carts).where(eq(schema.carts.id, sessionCartId))

    return getCartItemsWithDetails(db, userCartId)
  }
)
