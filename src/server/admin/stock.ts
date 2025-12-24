import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, sql, lte, count } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export interface LowStockProduct {
  id: number
  name: string
  sku: string
  stockQuantity: number
  stockAlertThreshold: number | null
  categoryName: string | null
  brandName: string | null
  mainImageUrl: string | null
}

export interface StockMovementWithProduct {
  id: number
  productId: number | null
  productName: string
  productSku: string
  quantity: number
  type: string
  reference: string | null
  notes: string | null
  createdAt: Date | null
}

export interface StockStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalMovementsToday: number
}

/**
 * Get stock statistics
 */
export const getStockStats = createServerFn({ method: 'GET' }).handler(async () => {
  requireAdmin()
  const db = getDb()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    todayMovements,
  ] = await Promise.all([
    // Total active products
    db
      .select({ count: count() })
      .from(schema.products)
      .where(eq(schema.products.isActive, true)),

    // Low stock (below threshold but not 0)
    db
      .select({ count: count() })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          sql`${schema.products.stockQuantity} > 0`,
          sql`${schema.products.stockQuantity} <= COALESCE(${schema.products.stockAlertThreshold}, 5)`
        )
      ),

    // Out of stock
    db
      .select({ count: count() })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          eq(schema.products.stockQuantity, 0)
        )
      ),

    // Today's movements
    db
      .select({ count: count() })
      .from(schema.stockMovements)
      .where(sql`${schema.stockMovements.createdAt} >= ${today.toISOString()}`),
  ])

  return {
    totalProducts: totalProducts[0]?.count || 0,
    lowStockCount: lowStockProducts[0]?.count || 0,
    outOfStockCount: outOfStockProducts[0]?.count || 0,
    totalMovementsToday: todayMovements[0]?.count || 0,
  } as StockStats
})

interface GetLowStockInput {
  page?: number
  limit?: number
  includeOutOfStock?: boolean
}

/**
 * Get products with low stock
 */
export const getLowStockProducts = createServerFn({ method: 'GET' })
  .inputValidator((input: GetLowStockInput | undefined) => {
    const safeInput = input || {}
    return {
      page: safeInput.page || 1,
      limit: safeInput.limit || 20,
      includeOutOfStock: safeInput.includeOutOfStock ?? true,
    }
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { page, limit, includeOutOfStock } = data
    const offset = (page - 1) * limit

    // Build condition for low stock
    const stockCondition = includeOutOfStock
      ? sql`${schema.products.stockQuantity} <= COALESCE(${schema.products.stockAlertThreshold}, 5)`
      : and(
          sql`${schema.products.stockQuantity} > 0`,
          sql`${schema.products.stockQuantity} <= COALESCE(${schema.products.stockAlertThreshold}, 5)`
        )

    // Get count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          stockCondition
        )
      )

    const total = totalResult[0]?.count || 0

    // Get products
    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        stockQuantity: schema.products.stockQuantity,
        stockAlertThreshold: schema.products.stockAlertThreshold,
        categoryName: schema.categories.name,
        brandName: schema.brands.name,
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(
        and(
          eq(schema.products.isActive, true),
          stockCondition
        )
      )
      .orderBy(schema.products.stockQuantity)
      .limit(limit)
      .offset(offset)

    // Get main images
    const productIds = products.map((p) => p.id)
    const mainImages =
      productIds.length > 0
        ? await db
            .select({
              productId: schema.productImages.productId,
              url: schema.productImages.url,
            })
            .from(schema.productImages)
            .where(
              and(
                eq(schema.productImages.isMain, true),
                sql`${schema.productImages.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`
              )
            )
        : []

    const imageMap = new Map(mainImages.map((img) => [img.productId, img.url]))

    return {
      products: products.map((p) => ({
        ...p,
        mainImageUrl: imageMap.get(p.id) || null,
      })) as LowStockProduct[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })

interface GetRecentMovementsInput {
  page?: number
  limit?: number
  type?: 'all' | 'in' | 'out' | 'adjustment'
}

/**
 * Get recent stock movements across all products
 */
export const getRecentStockMovements = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRecentMovementsInput | undefined) => {
    const safeInput = input || {}
    return {
      page: safeInput.page || 1,
      limit: safeInput.limit || 50,
      type: safeInput.type || 'all',
    }
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { page, limit, type } = data
    const offset = (page - 1) * limit

    // Build condition
    const typeCondition = type !== 'all'
      ? eq(schema.stockMovements.type, type)
      : undefined

    // Get count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.stockMovements)
      .where(typeCondition)

    const total = totalResult[0]?.count || 0

    // Get movements with product info
    const movements = await db
      .select({
        id: schema.stockMovements.id,
        productId: schema.stockMovements.productId,
        productName: schema.products.name,
        productSku: schema.products.sku,
        quantity: schema.stockMovements.quantity,
        type: schema.stockMovements.type,
        reference: schema.stockMovements.reference,
        notes: schema.stockMovements.notes,
        createdAt: schema.stockMovements.createdAt,
      })
      .from(schema.stockMovements)
      .leftJoin(schema.products, eq(schema.stockMovements.productId, schema.products.id))
      .where(typeCondition)
      .orderBy(desc(schema.stockMovements.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      movements: movements.map((m) => ({
        ...m,
        productName: m.productName || 'Produit supprimé',
        productSku: m.productSku || 'N/A',
      })) as StockMovementWithProduct[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })

interface BulkStockUpdateInput {
  updates: Array<{
    productId: number
    quantity: number
    type: 'in' | 'out' | 'adjustment'
    notes?: string
  }>
}

/**
 * Bulk update stock for multiple products
 */
export const bulkUpdateStock = createServerFn({ method: 'POST' })
  .inputValidator((data: BulkStockUpdateInput) => {
    if (!data.updates || data.updates.length === 0) {
      throw new Error('At least one update is required')
    }
    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const results: Array<{ productId: number; success: boolean; newStock?: number; error?: string }> = []

    for (const update of data.updates) {
      try {
        // Get current stock
        const [product] = await db
          .select({ stockQuantity: schema.products.stockQuantity, name: schema.products.name })
          .from(schema.products)
          .where(eq(schema.products.id, update.productId))
          .limit(1)

        if (!product) {
          results.push({ productId: update.productId, success: false, error: 'Produit non trouvé' })
          continue
        }

        // Calculate new stock
        let newStock = product.stockQuantity
        if (update.type === 'adjustment') {
          newStock = update.quantity
        } else if (update.type === 'in') {
          newStock += update.quantity
        } else {
          newStock -= update.quantity
        }

        if (newStock < 0) {
          results.push({ productId: update.productId, success: false, error: 'Stock ne peut pas être négatif' })
          continue
        }

        // Update stock
        await db
          .update(schema.products)
          .set({
            stockQuantity: newStock,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, update.productId))

        // Log movement
        await db.insert(schema.stockMovements).values({
          productId: update.productId,
          quantity: update.type === 'adjustment' ? newStock - product.stockQuantity : update.quantity,
          type: update.type,
          reference: 'ADMIN_BULK',
          notes: update.notes || null,
        })

        results.push({ productId: update.productId, success: true, newStock })
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    return { results }
  })
