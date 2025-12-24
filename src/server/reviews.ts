import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { getCurrentUser } from '@/lib/auth'

export interface ReviewWithUser {
  id: number
  rating: number
  title: string | null
  content: string | null
  isVerifiedPurchase: boolean | null
  createdAt: Date | null
  user: {
    firstName: string | null
    lastName: string | null
  }
}

export interface RatingStats {
  average: number
  count: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface GetReviewsInput {
  productId: number
  page?: number
  limit?: number
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest'
}

interface GetReviewsResult {
  reviews: ReviewWithUser[]
  total: number
  page: number
  totalPages: number
}

/**
 * Get reviews for a product with pagination
 */
export const getProductReviews = createServerFn({ method: 'GET' })
  .inputValidator((data: GetReviewsInput) => {
    if (!data.productId) throw new Error('Product ID is required')
    return data
  })
  .handler(async ({ data }): Promise<GetReviewsResult> => {
    const db = getDb()
    const { productId, page = 1, limit = 10, sortBy = 'newest' } = data

    // Build order by
    let orderBy
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(schema.reviews.createdAt)
        break
      case 'highest':
        orderBy = desc(schema.reviews.rating)
        break
      case 'lowest':
        orderBy = asc(schema.reviews.rating)
        break
      case 'newest':
      default:
        orderBy = desc(schema.reviews.createdAt)
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.productId, productId),
          eq(schema.reviews.isApproved, true)
        )
      )

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Get reviews with user info
    const reviews = await db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        title: schema.reviews.title,
        content: schema.reviews.content,
        isVerifiedPurchase: schema.reviews.isVerifiedPurchase,
        createdAt: schema.reviews.createdAt,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
      })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
      .where(
        and(
          eq(schema.reviews.productId, productId),
          eq(schema.reviews.isApproved, true)
        )
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        user: {
          firstName: r.userFirstName,
          lastName: r.userLastName,
        },
      })),
      total,
      page,
      totalPages,
    }
  })

/**
 * Get rating stats for a product
 */
export const getProductRatingStats = createServerFn({ method: 'GET' })
  .inputValidator((productId: number) => {
    if (!productId) throw new Error('Product ID is required')
    return productId
  })
  .handler(async ({ data: productId }): Promise<RatingStats> => {
    const db = getDb()

    // Get average and count
    const stats = await db
      .select({
        average: sql<number>`COALESCE(AVG(rating), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.productId, productId),
          eq(schema.reviews.isApproved, true)
        )
      )

    // Get distribution
    const distribution = await db
      .select({
        rating: schema.reviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.productId, productId),
          eq(schema.reviews.isApproved, true)
        )
      )
      .groupBy(schema.reviews.rating)

    const distributionMap: RatingStats['distribution'] = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    distribution.forEach((d) => {
      if (d.rating >= 1 && d.rating <= 5) {
        distributionMap[d.rating as 1 | 2 | 3 | 4 | 5] = d.count
      }
    })

    return {
      average: Math.round((stats[0]?.average || 0) * 10) / 10,
      count: stats[0]?.count || 0,
      distribution: distributionMap,
    }
  })

/**
 * Check if user has purchased a product
 */
const checkVerifiedPurchase = async (
  db: ReturnType<typeof getDb>,
  userId: number,
  productId: number
): Promise<boolean> => {
  const result = await db
    .select({ id: schema.orderItems.id })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orderItems.productId, productId),
        eq(schema.orders.status, 'delivered')
      )
    )
    .limit(1)

  return result.length > 0
}

/**
 * Check if user already reviewed a product
 */
export const getUserReviewForProduct = createServerFn({ method: 'GET' })
  .inputValidator((productId: number) => {
    if (!productId) throw new Error('Product ID is required')
    return productId
  })
  .handler(async ({ data: productId }) => {
    const user = await getCurrentUser()
    if (!user) return null

    const db = getDb()

    const reviews = await db
      .select()
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.userId, user.id),
          eq(schema.reviews.productId, productId)
        )
      )
      .limit(1)

    return reviews[0] || null
  })

interface CreateReviewInput {
  productId: number
  rating: number
  title?: string
  content?: string
}

/**
 * Create a review for a product
 */
export const createReview = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateReviewInput) => {
    if (!data.productId) throw new Error('Product ID is required')
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    return data
  })
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Vous devez être connecté pour laisser un avis')
    }

    const db = getDb()

    // Check if user already reviewed this product
    const existingReview = await db
      .select()
      .from(schema.reviews)
      .where(
        and(
          eq(schema.reviews.userId, user.id),
          eq(schema.reviews.productId, data.productId)
        )
      )
      .limit(1)

    if (existingReview.length > 0) {
      throw new Error('Vous avez déjà laissé un avis pour ce produit')
    }

    // Check if user purchased the product
    const isVerifiedPurchase = await checkVerifiedPurchase(
      db,
      user.id,
      data.productId
    )

    // Create review
    const result = await db
      .insert(schema.reviews)
      .values({
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title || null,
        content: data.content || null,
        isVerifiedPurchase,
        isApproved: true,
      })
      .returning()

    return result[0]
  })

interface UpdateReviewInput {
  reviewId: number
  rating?: number
  title?: string
  content?: string
}

/**
 * Update user's own review
 */
export const updateReview = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateReviewInput) => {
    if (!data.reviewId) throw new Error('Review ID is required')
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5')
    }
    return data
  })
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Vous devez être connecté')
    }

    const db = getDb()

    // Check ownership
    const existingReview = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, data.reviewId))
      .limit(1)

    if (!existingReview[0] || existingReview[0].userId !== user.id) {
      throw new Error('Vous ne pouvez modifier que vos propres avis')
    }

    // Update review
    const result = await db
      .update(schema.reviews)
      .set({
        rating: data.rating ?? existingReview[0].rating,
        title: data.title !== undefined ? data.title : existingReview[0].title,
        content:
          data.content !== undefined ? data.content : existingReview[0].content,
      })
      .where(eq(schema.reviews.id, data.reviewId))
      .returning()

    return result[0]
  })

/**
 * Delete user's own review
 */
export const deleteReview = createServerFn({ method: 'POST' })
  .inputValidator((reviewId: number) => {
    if (!reviewId) throw new Error('Review ID is required')
    return reviewId
  })
  .handler(async ({ data: reviewId }) => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Vous devez être connecté')
    }

    const db = getDb()

    // Check ownership
    const existingReview = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, reviewId))
      .limit(1)

    if (!existingReview[0] || existingReview[0].userId !== user.id) {
      throw new Error('Vous ne pouvez supprimer que vos propres avis')
    }

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId))

    return { success: true }
  })

// Admin functions

interface GetAllReviewsInput {
  page?: number
  limit?: number
  isApproved?: boolean
}

/**
 * Get all reviews for admin moderation
 */
export const getAllReviews = createServerFn({ method: 'GET' })
  .inputValidator((data?: GetAllReviewsInput) => data || {})
  .handler(async ({ data }) => {
    const db = getDb()
    const { page = 1, limit = 20, isApproved } = data

    const conditions = []
    if (isApproved !== undefined) {
      conditions.push(eq(schema.reviews.isApproved, isApproved))
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    // Get reviews with user and product info
    const reviews = await db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        title: schema.reviews.title,
        content: schema.reviews.content,
        isVerifiedPurchase: schema.reviews.isVerifiedPurchase,
        isApproved: schema.reviews.isApproved,
        createdAt: schema.reviews.createdAt,
        userId: schema.reviews.userId,
        productId: schema.reviews.productId,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
        userEmail: schema.users.email,
        productName: schema.products.name,
        productSlug: schema.products.slug,
      })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
      .leftJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.reviews.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      reviews,
      total,
      page,
      totalPages,
    }
  })

/**
 * Approve or reject a review (admin)
 */
export const moderateReview = createServerFn({ method: 'POST' })
  .inputValidator((data: { reviewId: number; isApproved: boolean }) => {
    if (!data.reviewId) throw new Error('Review ID is required')
    return data
  })
  .handler(async ({ data }) => {
    const db = getDb()

    const result = await db
      .update(schema.reviews)
      .set({ isApproved: data.isApproved })
      .where(eq(schema.reviews.id, data.reviewId))
      .returning()

    return result[0]
  })

/**
 * Delete a review (admin)
 */
export const deleteReviewAdmin = createServerFn({ method: 'POST' })
  .inputValidator((reviewId: number) => {
    if (!reviewId) throw new Error('Review ID is required')
    return reviewId
  })
  .handler(async ({ data: reviewId }) => {
    const db = getDb()

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId))

    return { success: true }
  })
