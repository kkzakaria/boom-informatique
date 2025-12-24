import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Schema de base - sera étendu lors du développement

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['customer', 'pro', 'admin'] })
    .notNull()
    .default('customer'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  // Champs B2B
  companyName: text('company_name'),
  siret: text('siret'),
  vatNumber: text('vat_number'),
  isValidated: integer('is_validated', { mode: 'boolean' }).default(false),
  discountRate: real('discount_rate').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: integer('parent_id').references(() => categories.id),
  imageUrl: text('image_url'),
  position: integer('position').default(0),
})

export const brands = sqliteTable('brands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sku: text('sku').notNull().unique(),
  ean: text('ean'),
  brandId: integer('brand_id').references(() => brands.id),
  categoryId: integer('category_id').references(() => categories.id),
  priceHt: real('price_ht').notNull(),
  taxRate: real('tax_rate').notNull().default(20),
  priceTtc: real('price_ttc').notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  stockAlertThreshold: integer('stock_alert_threshold').default(5),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const productImages = sqliteTable('product_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').default(0),
  isMain: integer('is_main', { mode: 'boolean' }).default(false),
})

export const productAttributes = sqliteTable('product_attributes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  value: text('value').notNull(),
})

export const addresses = sqliteTable('addresses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['billing', 'shipping'] }).notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('France'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
})

export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const carts = sqliteTable('carts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const cartItems = sqliteTable('cart_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
})

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status', {
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'shipped',
      'delivered',
      'paid',
      'cancelled',
    ],
  })
    .notNull()
    .default('pending'),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'check', 'transfer'],
  }).notNull(),
  paymentStatus: text('payment_status', {
    enum: ['pending', 'paid', 'refunded'],
  })
    .notNull()
    .default('pending'),
  shippingMethod: text('shipping_method', {
    enum: ['pickup', 'delivery'],
  }).notNull(),
  shippingAddressId: integer('shipping_address_id').references(
    () => addresses.id
  ),
  billingAddressId: integer('billing_address_id').references(() => addresses.id),
  subtotalHt: real('subtotal_ht').notNull(),
  taxAmount: real('tax_amount').notNull(),
  shippingCost: real('shipping_cost').notNull().default(0),
  totalTtc: real('total_ttc').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceHt: real('unit_price_ht').notNull(),
  taxRate: real('tax_rate').notNull(),
})

export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  quoteNumber: text('quote_number').notNull().unique(),
  status: text('status', {
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
  })
    .notNull()
    .default('draft'),
  validUntil: integer('valid_until', { mode: 'timestamp' }),
  subtotalHt: real('subtotal_ht').notNull(),
  discountAmount: real('discount_amount').default(0),
  taxAmount: real('tax_amount').notNull(),
  totalHt: real('total_ht').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const quoteItems = sqliteTable('quote_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPriceHt: real('unit_price_ht').notNull(),
  discountRate: real('discount_rate').default(0),
})

export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  type: text('type', { enum: ['in', 'out', 'adjustment'] }).notNull(),
  reference: text('reference'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title'),
  content: text('content'),
  isVerifiedPurchase: integer('is_verified_purchase', { mode: 'boolean' }).default(false),
  isApproved: integer('is_approved', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
})
