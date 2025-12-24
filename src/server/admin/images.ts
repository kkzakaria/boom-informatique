import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { getDb, schema } from '@/db'
import { requireAdmin } from '@/lib/auth/session'
import { getAssetsBucket } from '@/lib/cf-bindings'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_PRODUCT,
} from '@/lib/validations/product'

interface UploadProductImageInput {
  productId: number
  filename: string
  contentType: string
  base64Data: string
  position: number
  isMain: boolean
}

/**
 * Upload a product image to R2
 */
export const uploadProductImage = createServerFn({ method: 'POST' })
  .inputValidator((data: UploadProductImageInput) => {
    if (!data.productId || !data.filename || !data.contentType || !data.base64Data) {
      throw new Error('Missing required fields')
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(data.contentType)) {
      throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.')
    }

    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()
    const bucket = getAssetsBucket()

    // Check product exists
    const [product] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, data.productId))
      .limit(1)

    if (!product) {
      throw new Error('Produit non trouvé')
    }

    // Check image count limit
    const existingImages = await db
      .select({ id: schema.productImages.id })
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, data.productId))

    if (existingImages.length >= MAX_IMAGES_PER_PRODUCT) {
      throw new Error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images par produit`)
    }

    // Decode base64 data
    const buffer = Buffer.from(data.base64Data, 'base64')

    // Validate size
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error('Fichier trop volumineux (max 5 MB)')
    }

    // Generate unique filename
    const ext = data.filename.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const key = `products/${data.productId}/${uniqueFilename}`

    // Upload to R2
    await bucket.put(key, buffer, {
      httpMetadata: { contentType: data.contentType },
    })

    // Generate public URL
    // Note: This assumes you have a custom domain configured for R2
    // Adjust the URL format based on your R2 configuration
    const url = `https://assets.boom-informatique.com/${key}`

    // If this is marked as main, unset other main images first
    if (data.isMain) {
      await db
        .update(schema.productImages)
        .set({ isMain: false })
        .where(eq(schema.productImages.productId, data.productId))
    }

    // Save to database
    const [image] = await db
      .insert(schema.productImages)
      .values({
        productId: data.productId,
        url,
        position: data.position,
        isMain: data.isMain,
      })
      .returning()

    return { imageId: image.id, url }
  })

/**
 * Delete a product image from R2 and database
 */
export const deleteProductImage = createServerFn({ method: 'POST' })
  .inputValidator((imageId: number) => imageId)
  .handler(async ({ data: imageId }) => {
    requireAdmin()
    const db = getDb()
    const bucket = getAssetsBucket()

    // Get image info
    const [image] = await db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.id, imageId))
      .limit(1)

    if (!image) {
      throw new Error('Image non trouvée')
    }

    // Extract key from URL
    try {
      const url = new URL(image.url)
      const key = url.pathname.substring(1) // Remove leading slash

      // Delete from R2
      await bucket.delete(key)
    } catch {
      // If URL parsing fails or R2 delete fails, still delete from DB
      console.error('Failed to delete from R2, continuing with DB delete')
    }

    // Delete from database
    await db
      .delete(schema.productImages)
      .where(eq(schema.productImages.id, imageId))

    // If this was the main image, set another as main
    if (image.isMain) {
      const [firstImage] = await db
        .select({ id: schema.productImages.id })
        .from(schema.productImages)
        .where(eq(schema.productImages.productId, image.productId!))
        .orderBy(schema.productImages.position)
        .limit(1)

      if (firstImage) {
        await db
          .update(schema.productImages)
          .set({ isMain: true })
          .where(eq(schema.productImages.id, firstImage.id))
      }
    }

    return { success: true }
  })

interface UpdateProductImagesInput {
  productId: number
  images: Array<{ id: number; position: number; isMain: boolean }>
}

/**
 * Update image positions and main status
 */
export const updateProductImages = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateProductImagesInput) => {
    if (!data.productId || !data.images) {
      throw new Error('Missing required fields')
    }
    return data
  })
  .handler(async ({ data }) => {
    requireAdmin()
    const db = getDb()

    // First, unset all isMain for this product
    await db
      .update(schema.productImages)
      .set({ isMain: false })
      .where(eq(schema.productImages.productId, data.productId))

    // Update each image
    for (const img of data.images) {
      await db
        .update(schema.productImages)
        .set({
          position: img.position,
          isMain: img.isMain,
        })
        .where(
          and(
            eq(schema.productImages.id, img.id),
            eq(schema.productImages.productId, data.productId)
          )
        )
    }

    return { success: true }
  })

export interface StockMovement {
  id: number
  productId: number | null
  quantity: number
  type: string
  reference: string | null
  notes: string | null
  createdAt: Date | null
}

/**
 * Get stock movements for a product
 */
export const getProductStockMovements = createServerFn({ method: 'GET' })
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

    const movements = await db
      .select()
      .from(schema.stockMovements)
      .where(eq(schema.stockMovements.productId, productId))
      .orderBy(desc(schema.stockMovements.createdAt))
      .limit(50)

    return movements as StockMovement[]
  })
