import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, like, count, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export interface ProductListItem {
  id: number
  name: string
  slug: string
  sku: string
  priceHt: number
  priceTtc: number
  stockQuantity: number
  stockAlertThreshold: number | null
  isActive: boolean | null
  categoryName: string | null
  brandName: string | null
  mainImageUrl: string | null
  createdAt: Date | null
}

export interface ProductDetail {
  id: number
  name: string
  slug: string
  description: string | null
  sku: string
  ean: string | null
  brandId: number | null
  categoryId: number | null
  priceHt: number
  taxRate: number
  priceTtc: number
  stockQuantity: number
  stockAlertThreshold: number | null
  isActive: boolean | null
  featured: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
  images: Array<{
    id: number
    url: string
    position: number | null
    isMain: boolean | null
  }>
  attributes: Array<{
    id: number
    name: string
    value: string
  }>
  brand: { id: number; name: string } | null
  category: { id: number; name: string } | null
}

interface GetProductsInput {
  page?: number
  limit?: number
  search?: string
  categoryId?: number
  brandId?: number
  isActive?: boolean
}

/**
 * Get all products with pagination
 */
export const getAdminProducts = createServerFn({ method: 'GET' })
  .inputValidator((input: GetProductsInput | undefined) => {
    const safeInput = input || {}
    return {
      page: safeInput.page || 1,
      limit: safeInput.limit || 20,
      search: safeInput.search || '',
      categoryId: safeInput.categoryId,
      brandId: safeInput.brandId,
      isActive: safeInput.isActive,
    }
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { page, limit, search, categoryId, brandId, isActive } = data
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []

    if (search) {
      conditions.push(
        sql`(${schema.products.name} LIKE ${`%${search}%`} OR ${schema.products.sku} LIKE ${`%${search}%`})`
      )
    }

    if (categoryId) {
      conditions.push(eq(schema.products.categoryId, categoryId))
    }

    if (brandId) {
      conditions.push(eq(schema.products.brandId, brandId))
    }

    if (isActive !== undefined) {
      conditions.push(eq(schema.products.isActive, isActive))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.products)
      .where(whereClause)

    const total = totalResult[0]?.count || 0

    // Get products
    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        slug: schema.products.slug,
        sku: schema.products.sku,
        priceHt: schema.products.priceHt,
        priceTtc: schema.products.priceTtc,
        stockQuantity: schema.products.stockQuantity,
        stockAlertThreshold: schema.products.stockAlertThreshold,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        categoryName: schema.categories.name,
        brandName: schema.brands.name,
      })
      .from(schema.products)
      .leftJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id)
      )
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .where(whereClause)
      .orderBy(desc(schema.products.createdAt))
      .limit(limit)
      .offset(offset)

    // Get main images for products
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
      })) as ProductListItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })

/**
 * Get product by ID for editing
 */
export const getProductById = createServerFn({ method: 'GET' })
  .inputValidator((id: number | undefined) => {
    const productId = Number(id)
    if (!productId || isNaN(productId)) {
      throw new Error('Valid product ID is required')
    }
    return productId
  })
  .handler(async ({ data: productId }) => {
    requireAdmin()
    const db = getDb()

    const product = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1)

    if (!product[0]) {
      throw new Error('Product not found')
    }

    // Get images
    const images = await db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .orderBy(schema.productImages.position)

    // Get attributes
    const attributes = await db
      .select()
      .from(schema.productAttributes)
      .where(eq(schema.productAttributes.productId, productId))

    // Get brand
    let brand = null
    if (product[0].brandId) {
      const [brandData] = await db
        .select({ id: schema.brands.id, name: schema.brands.name })
        .from(schema.brands)
        .where(eq(schema.brands.id, product[0].brandId))
        .limit(1)
      brand = brandData || null
    }

    // Get category
    let category = null
    if (product[0].categoryId) {
      const [categoryData] = await db
        .select({ id: schema.categories.id, name: schema.categories.name })
        .from(schema.categories)
        .where(eq(schema.categories.id, product[0].categoryId))
        .limit(1)
      category = categoryData || null
    }

    return {
      ...product[0],
      images,
      attributes,
      brand,
      category,
    } as ProductDetail
  })

interface CreateProductInput {
  name: string
  slug: string
  description?: string
  sku: string
  ean?: string
  brandId?: number
  categoryId?: number
  priceHt: number
  taxRate?: number
  stockQuantity?: number
  stockAlertThreshold?: number
  isActive?: boolean
  featured?: boolean
  attributes?: Array<{ name: string; value: string }>
}

/**
 * Create a new product
 */
export const createProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateProductInput) => {
    if (!data.name || !data.slug || !data.sku || !data.priceHt) {
      throw new Error('Name, slug, SKU and price are required')
    }
    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    const taxRate = data.taxRate || 20
    const priceTtc = data.priceHt * (1 + taxRate / 100)

    const [product] = await db
      .insert(schema.products)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        sku: data.sku,
        ean: data.ean || null,
        brandId: data.brandId || null,
        categoryId: data.categoryId || null,
        priceHt: data.priceHt,
        taxRate,
        priceTtc,
        stockQuantity: data.stockQuantity || 0,
        stockAlertThreshold: data.stockAlertThreshold || 5,
        isActive: data.isActive ?? true,
        featured: data.featured ?? false,
      })
      .returning()

    // Add attributes
    if (data.attributes && data.attributes.length > 0) {
      for (const attr of data.attributes) {
        await db.insert(schema.productAttributes).values({
          productId: product.id,
          name: attr.name,
          value: attr.value,
        })
      }
    }

    return { productId: product.id }
  })

interface UpdateProductInput extends Partial<CreateProductInput> {
  productId: number
}

/**
 * Update a product
 */
export const updateProduct = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateProductInput) => {
    if (!data.productId) {
      throw new Error('Product ID is required')
    }
    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.ean !== undefined) updateData.ean = data.ean
    if (data.brandId !== undefined) updateData.brandId = data.brandId
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.stockAlertThreshold !== undefined)
      updateData.stockAlertThreshold = data.stockAlertThreshold
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.featured !== undefined) updateData.featured = data.featured

    if (data.priceHt !== undefined) {
      const taxRate = data.taxRate || 20
      updateData.priceHt = data.priceHt
      updateData.taxRate = taxRate
      updateData.priceTtc = data.priceHt * (1 + taxRate / 100)
    }

    await db
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, data.productId))

    // Update attributes if provided
    if (data.attributes) {
      // Delete existing
      await db
        .delete(schema.productAttributes)
        .where(eq(schema.productAttributes.productId, data.productId))

      // Insert new
      for (const attr of data.attributes) {
        await db.insert(schema.productAttributes).values({
          productId: data.productId,
          name: attr.name,
          value: attr.value,
        })
      }
    }

    return { success: true }
  })

/**
 * Delete (deactivate) a product
 */
export const deleteProduct = createServerFn({ method: 'POST' })
  .inputValidator((productId: number | undefined) => {
    const id = Number(productId)
    if (!id || isNaN(id)) {
      throw new Error('Valid product ID is required')
    }
    return id
  })
  .handler(async ({ data: productId }) => {
    requireAdmin()
    const db = getDb()

    // Soft delete - just deactivate
    await db
      .update(schema.products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, productId))

    return { success: true }
  })

/**
 * Update product stock
 */
export const updateProductStock = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      productId: number
      quantity: number
      type: 'in' | 'out' | 'adjustment'
      notes?: string
    }) => data
  )
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    // Get current stock
    const [product] = await db
      .select({ stockQuantity: schema.products.stockQuantity })
      .from(schema.products)
      .where(eq(schema.products.id, data.productId))
      .limit(1)

    if (!product) {
      throw new Error('Product not found')
    }

    // Calculate new stock
    let newStock = product.stockQuantity
    if (data.type === 'adjustment') {
      newStock = data.quantity
    } else if (data.type === 'in') {
      newStock += data.quantity
    } else {
      newStock -= data.quantity
    }

    if (newStock < 0) {
      throw new Error('Stock cannot be negative')
    }

    // Update stock
    await db
      .update(schema.products)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, data.productId))

    // Log movement
    await db.insert(schema.stockMovements).values({
      productId: data.productId,
      quantity: data.type === 'adjustment' ? newStock - product.stockQuantity : data.quantity,
      type: data.type,
      reference: 'ADMIN',
      notes: data.notes || null,
    })

    return { success: true, newStock }
  })

/**
 * Get all categories for dropdown
 */
export const getCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireAdmin()
    const db = getDb()

    const categories = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.categories)
      .orderBy(schema.categories.name)

    return categories
  }
)

/**
 * Get all brands for dropdown
 */
export const getBrands = createServerFn({ method: 'GET' }).handler(async () => {
  requireAdmin()
  const db = getDb()

  const brands = await db
    .select({
      id: schema.brands.id,
      name: schema.brands.name,
      slug: schema.brands.slug,
    })
    .from(schema.brands)
    .orderBy(schema.brands.name)

  return brands
})
