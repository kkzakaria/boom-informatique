import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, like, sql, count } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'

export interface UserListItem {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  companyName: string | null
  siret: string | null
  isValidated: boolean | null
  discountRate: number | null
  createdAt: Date | null
  ordersCount: number
}

export interface UserDetail extends UserListItem {
  phone: string | null
  vatNumber: string | null
  addresses: Array<{
    id: number
    type: string
    street: string
    city: string
    postalCode: string
    country: string
    isDefault: boolean | null
  }>
  recentOrders: Array<{
    id: number
    orderNumber: string
    status: string
    totalTtc: number
    createdAt: Date | null
  }>
}

interface GetAllUsersInput {
  page?: number
  limit?: number
  search?: string
  role?: 'all' | 'customer' | 'pro' | 'admin'
  validated?: 'all' | 'validated' | 'pending'
}

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = createServerFn({ method: 'GET' })
  .inputValidator((input: GetAllUsersInput | undefined) => {
    const safeInput = input || {}
    return {
      page: safeInput.page || 1,
      limit: safeInput.limit || 20,
      search: safeInput.search || '',
      role: safeInput.role || 'all',
      validated: safeInput.validated || 'all',
    }
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const { page, limit, search, role, validated } = data
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = []

    if (search) {
      conditions.push(
        sql`(${schema.users.email} LIKE ${`%${search}%`} OR ${schema.users.firstName} LIKE ${`%${search}%`} OR ${schema.users.lastName} LIKE ${`%${search}%`} OR ${schema.users.companyName} LIKE ${`%${search}%`})`
      )
    }

    if (role !== 'all') {
      conditions.push(eq(schema.users.role, role))
    } else {
      // Exclude admin from list by default
      conditions.push(sql`${schema.users.role} != 'admin'`)
    }

    if (validated === 'validated') {
      conditions.push(eq(schema.users.isValidated, true))
    } else if (validated === 'pending') {
      conditions.push(
        and(eq(schema.users.role, 'pro'), eq(schema.users.isValidated, false))
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.users)
      .where(whereClause)

    const total = totalResult[0]?.count || 0

    // Get users with order count
    const users = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        companyName: schema.users.companyName,
        siret: schema.users.siret,
        isValidated: schema.users.isValidated,
        discountRate: schema.users.discountRate,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset)

    // Get order counts for each user
    const userIds = users.map((u) => u.id)
    const orderCounts = userIds.length > 0
      ? await db
          .select({
            userId: schema.orders.userId,
            count: count(),
          })
          .from(schema.orders)
          .where(sql`${schema.orders.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(schema.orders.userId)
      : []

    const orderCountMap = new Map(orderCounts.map((oc) => [oc.userId, oc.count]))

    return {
      users: users.map((user) => ({
        ...user,
        ordersCount: orderCountMap.get(user.id) || 0,
      })) as UserListItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  })

/**
 * Get pending pro account validations
 */
export const getPendingProAccounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    requireAdmin()
    const db = getDb()

    const users = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        companyName: schema.users.companyName,
        siret: schema.users.siret,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(
        and(eq(schema.users.role, 'pro'), eq(schema.users.isValidated, false))
      )
      .orderBy(desc(schema.users.createdAt))

    return users
  }
)

/**
 * Get user by ID with details
 */
export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: userId }) => {
    requireAdmin()
    const db = getDb()

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)

    if (!user[0]) {
      throw new Error('User not found')
    }

    // Get addresses
    const addresses = await db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.userId, userId))

    // Get recent orders
    const orders = await db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        status: schema.orders.status,
        totalTtc: schema.orders.totalTtc,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt))
      .limit(10)

    // Get order count
    const orderCount = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))

    return {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      phone: user[0].phone,
      role: user[0].role,
      companyName: user[0].companyName,
      siret: user[0].siret,
      vatNumber: user[0].vatNumber,
      isValidated: user[0].isValidated,
      discountRate: user[0].discountRate,
      createdAt: user[0].createdAt,
      ordersCount: orderCount[0]?.count || 0,
      addresses,
      recentOrders: orders,
    } as UserDetail
  })

/**
 * Validate a pro account
 */
export const validateProAccount = createServerFn({ method: 'POST' })
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    requireAdmin()
    const db = getDb()

    const result = await db
      .update(schema.users)
      .set({
        isValidated: true,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.users.id, userId), eq(schema.users.role, 'pro'))
      )

    return { success: true }
  })

/**
 * Reject a pro account (set back to customer)
 */
export const rejectProAccount = createServerFn({ method: 'POST' })
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    requireAdmin()
    const db = getDb()

    await db
      .update(schema.users)
      .set({
        role: 'customer',
        companyName: null,
        siret: null,
        vatNumber: null,
        isValidated: false,
        discountRate: 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))

    return { success: true }
  })

/**
 * Update user discount rate
 */
export const updateUserDiscount = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: number; discountRate: number }) => data)
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    if (data.discountRate < 0 || data.discountRate > 100) {
      throw new Error('Invalid discount rate')
    }

    await db
      .update(schema.users)
      .set({
        discountRate: data.discountRate,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, data.userId))

    return { success: true }
  })

/**
 * Update user VAT number
 */
export const updateUserVatNumber = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: number; vatNumber: string }) => data)
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    await db
      .update(schema.users)
      .set({
        vatNumber: data.vatNumber,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, data.userId))

    return { success: true }
  })
