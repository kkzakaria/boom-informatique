import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAuth } from '@/lib/auth/session'

interface AddressInput {
  type: 'billing' | 'shipping'
  street: string
  city: string
  postalCode: string
  country?: string
  isDefault?: boolean
}

interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
  companyName?: string
  siret?: string
}

/**
 * Get user profile
 */
export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb()
  const user = await requireAuth()

  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      phone: schema.users.phone,
      companyName: schema.users.companyName,
      siret: schema.users.siret,
      vatNumber: schema.users.vatNumber,
      isValidated: schema.users.isValidated,
      discountRate: schema.users.discountRate,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1)

  return users[0] || null
})

/**
 * Update user profile
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: UpdateProfileInput) => data)
  .handler(async ({ data }) => {
    const db = getDb()
    const user = await requireAuth()

    await db
      .update(schema.users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        companyName: data.companyName,
        siret: data.siret,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))

    return { success: true }
  })

/**
 * Get user addresses
 */
export const getAddresses = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = getDb()
    const user = await requireAuth()

    return db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.userId, user.id))
  }
)

/**
 * Add a new address
 */
export const addAddress = createServerFn({ method: 'POST' })
  .validator((data: AddressInput) => {
    if (!data.street || !data.city || !data.postalCode) {
      throw new Error('Address fields required')
    }
    return data
  })
  .handler(async ({ data }) => {
    const db = getDb()
    const user = await requireAuth()

    // If this is the default address, unset other defaults of the same type
    if (data.isDefault) {
      await db
        .update(schema.addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(schema.addresses.userId, user.id),
            eq(schema.addresses.type, data.type)
          )
        )
    }

    const result = await db
      .insert(schema.addresses)
      .values({
        userId: user.id,
        type: data.type,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country || 'France',
        isDefault: data.isDefault || false,
      })
      .returning()

    return result[0]
  })

/**
 * Update an address
 */
export const updateAddress = createServerFn({ method: 'POST' })
  .validator((data: AddressInput & { id: number }) => {
    if (!data.id) throw new Error('Address ID required')
    if (!data.street || !data.city || !data.postalCode) {
      throw new Error('Address fields required')
    }
    return data
  })
  .handler(async ({ data }) => {
    const db = getDb()
    const user = await requireAuth()

    // Verify ownership
    const existing = await db
      .select()
      .from(schema.addresses)
      .where(
        and(
          eq(schema.addresses.id, data.id),
          eq(schema.addresses.userId, user.id)
        )
      )
      .limit(1)

    if (!existing[0]) {
      throw new Error('Address not found')
    }

    // If this is the default address, unset other defaults of the same type
    if (data.isDefault) {
      await db
        .update(schema.addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(schema.addresses.userId, user.id),
            eq(schema.addresses.type, data.type)
          )
        )
    }

    await db
      .update(schema.addresses)
      .set({
        type: data.type,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country || 'France',
        isDefault: data.isDefault || false,
      })
      .where(eq(schema.addresses.id, data.id))

    return { success: true }
  })

/**
 * Delete an address
 */
export const deleteAddress = createServerFn({ method: 'POST' })
  .validator((addressId: number) => {
    if (!addressId) throw new Error('Address ID required')
    return addressId
  })
  .handler(async ({ data: addressId }) => {
    const db = getDb()
    const user = await requireAuth()

    // Verify ownership
    const existing = await db
      .select()
      .from(schema.addresses)
      .where(
        and(
          eq(schema.addresses.id, addressId),
          eq(schema.addresses.userId, user.id)
        )
      )
      .limit(1)

    if (!existing[0]) {
      throw new Error('Address not found')
    }

    await db.delete(schema.addresses).where(eq(schema.addresses.id, addressId))

    return { success: true }
  })
