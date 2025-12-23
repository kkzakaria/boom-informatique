import { createServerFn } from '@tanstack/react-start'
import { eq, like, and, desc, asc, sql, or } from 'drizzle-orm'
import { getDb, schema } from '@/db'

export interface ProductWithDetails {
  id: number
  name: string
  slug: string
  description: string | null
  sku: string
  ean: string | null
  priceHt: number
  taxRate: number
  priceTtc: number
  stockQuantity: number
  stockAlertThreshold: number | null
  isActive: boolean | null
  featured: boolean | null
  createdAt: Date | null
  brand: {
    id: number
    name: string
    slug: string
    logoUrl: string | null
  } | null
  category: {
    id: number
    name: string
    slug: string
    parentId: number | null
  } | null
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
}

export interface CategoryWithProducts {
  id: number
  name: string
  slug: string
  parentId: number | null
  imageUrl: string | null
  position: number | null
  children: Array<{
    id: number
    name: string
    slug: string
    position: number | null
  }>
  productCount: number
}

interface GetProductsInput {
  categorySlug?: string
  brandSlug?: string
  search?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'price-asc' | 'price-desc' | 'name' | 'newest'
  page?: number
  limit?: number
}

interface GetProductsResult {
  products: ProductWithDetails[]
  total: number
  page: number
  totalPages: number
}

/**
 * Get paginated products with filters
 */
export const getProducts = createServerFn({ method: 'GET' })
  .inputValidator((data?: GetProductsInput) => data || {})
  .handler(async ({ data }): Promise<GetProductsResult> => {
    const db = getDb()
    const {
      categorySlug,
      brandSlug,
      search,
      featured,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = data

    // Build where conditions
    const conditions = [eq(schema.products.isActive, true)]

    if (categorySlug) {
      const category = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, categorySlug))
        .limit(1)

      if (category[0]) {
        conditions.push(eq(schema.products.categoryId, category[0].id))
      }
    }

    if (brandSlug) {
      const brand = await db
        .select()
        .from(schema.brands)
        .where(eq(schema.brands.slug, brandSlug))
        .limit(1)

      if (brand[0]) {
        conditions.push(eq(schema.products.brandId, brand[0].id))
      }
    }

    if (search) {
      conditions.push(
        or(
          like(schema.products.name, `%${search}%`),
          like(schema.products.description, `%${search}%`),
          like(schema.products.sku, `%${search}%`)
        )!
      )
    }

    if (featured) {
      conditions.push(eq(schema.products.featured, true))
    }

    if (minPrice !== undefined) {
      conditions.push(sql`${schema.products.priceTtc} >= ${minPrice}`)
    }

    if (maxPrice !== undefined) {
      conditions.push(sql`${schema.products.priceTtc} <= ${maxPrice}`)
    }

    if (inStock) {
      conditions.push(sql`${schema.products.stockQuantity} > 0`)
    }

    // Build order by
    let orderBy
    switch (sortBy) {
      case 'price-asc':
        orderBy = asc(schema.products.priceTtc)
        break
      case 'price-desc':
        orderBy = desc(schema.products.priceTtc)
        break
      case 'name':
        orderBy = asc(schema.products.name)
        break
      case 'newest':
      default:
        orderBy = desc(schema.products.createdAt)
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(and(...conditions))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Get products
    const products = await db
      .select()
      .from(schema.products)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // Get related data for each product
    const productsWithDetails: ProductWithDetails[] = await Promise.all(
      products.map(async (product) => {
        const [brand, category, images, attributes] = await Promise.all([
          product.brandId
            ? db
                .select()
                .from(schema.brands)
                .where(eq(schema.brands.id, product.brandId))
                .limit(1)
            : Promise.resolve([]),
          product.categoryId
            ? db
                .select()
                .from(schema.categories)
                .where(eq(schema.categories.id, product.categoryId))
                .limit(1)
            : Promise.resolve([]),
          db
            .select()
            .from(schema.productImages)
            .where(eq(schema.productImages.productId, product.id))
            .orderBy(asc(schema.productImages.position)),
          db
            .select()
            .from(schema.productAttributes)
            .where(eq(schema.productAttributes.productId, product.id)),
        ])

        return {
          ...product,
          brand: brand[0] || null,
          category: category[0] || null,
          images,
          attributes,
        }
      })
    )

    return {
      products: productsWithDetails,
      total,
      page,
      totalPages,
    }
  })

/**
 * Get a single product by slug
 */
export const getProductBySlug = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => {
    if (!slug) throw new Error('Slug is required')
    return slug
  })
  .handler(async ({ data: slug }): Promise<ProductWithDetails | null> => {
    const db = getDb()

    const products = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, slug))
      .limit(1)

    if (products.length === 0) {
      return null
    }

    const product = products[0]

    const [brand, category, images, attributes] = await Promise.all([
      product.brandId
        ? db
            .select()
            .from(schema.brands)
            .where(eq(schema.brands.id, product.brandId))
            .limit(1)
        : Promise.resolve([]),
      product.categoryId
        ? db
            .select()
            .from(schema.categories)
            .where(eq(schema.categories.id, product.categoryId))
            .limit(1)
        : Promise.resolve([]),
      db
        .select()
        .from(schema.productImages)
        .where(eq(schema.productImages.productId, product.id))
        .orderBy(asc(schema.productImages.position)),
      db
        .select()
        .from(schema.productAttributes)
        .where(eq(schema.productAttributes.productId, product.id)),
    ])

    return {
      ...product,
      brand: brand[0] || null,
      category: category[0] || null,
      images,
      attributes,
    }
  })

/**
 * Get all categories with children and product count
 */
export const getCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryWithProducts[]> => {
    const db = getDb()

    // Get all categories
    const categories = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.position))

    // Get product count per category
    const productCounts = await db
      .select({
        categoryId: schema.products.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(schema.products)
      .where(eq(schema.products.isActive, true))
      .groupBy(schema.products.categoryId)

    const countMap = new Map(
      productCounts.map((pc) => [pc.categoryId, pc.count])
    )

    // Build tree structure (only root categories with children)
    const rootCategories = categories.filter((c) => !c.parentId)

    return rootCategories.map((cat) => ({
      ...cat,
      children: categories
        .filter((c) => c.parentId === cat.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          position: child.position,
        })),
      productCount: countMap.get(cat.id) || 0,
    }))
  }
)

/**
 * Get a single category by slug with products
 */
export const getCategoryBySlug = createServerFn({ method: 'GET' })
  .inputValidator((slug: string) => {
    if (!slug) throw new Error('Slug is required')
    return slug
  })
  .handler(async ({ data: slug }) => {
    const db = getDb()

    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1)

    if (categories.length === 0) {
      return null
    }

    const category = categories[0]

    // Get children
    const children = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.parentId, category.id))
      .orderBy(asc(schema.categories.position))

    // Get parent if exists
    const parent = category.parentId
      ? await db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.id, category.parentId))
          .limit(1)
      : []

    return {
      ...category,
      children,
      parent: parent[0] || null,
    }
  })

/**
 * Get all brands
 */
export const getBrands = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()

  return db.select().from(schema.brands).orderBy(asc(schema.brands.name))
})

/**
 * Search products
 */
export const searchProducts = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => {
    if (!query || query.length < 2) {
      throw new Error('Query must be at least 2 characters')
    }
    return query
  })
  .handler(async ({ data: query }) => {
    const db = getDb()

    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        slug: schema.products.slug,
        priceTtc: schema.products.priceTtc,
        stockQuantity: schema.products.stockQuantity,
      })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          or(
            like(schema.products.name, `%${query}%`),
            like(schema.products.sku, `%${query}%`)
          )
        )
      )
      .limit(10)

    // Get main image for each product
    const productsWithImage = await Promise.all(
      products.map(async (product) => {
        const image = await db
          .select()
          .from(schema.productImages)
          .where(
            and(
              eq(schema.productImages.productId, product.id),
              eq(schema.productImages.isMain, true)
            )
          )
          .limit(1)

        return {
          ...product,
          imageUrl: image[0]?.url || null,
        }
      })
    )

    return productsWithImage
  })

/**
 * Get featured products for homepage
 */
export const getFeaturedProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await getProducts({
      data: {
        featured: true,
        limit: 8,
      },
    })
    return result.products
  }
)

/**
 * Get new arrivals for homepage
 */
export const getNewArrivals = createServerFn({ method: 'GET' }).handler(
  async () => {
    const result = await getProducts({
      data: {
        sortBy: 'newest',
        limit: 8,
      },
    })
    return result.products
  }
)
