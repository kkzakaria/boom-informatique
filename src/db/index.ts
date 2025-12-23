import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import { getD1 } from '@/lib/cf-bindings'

export type Database = ReturnType<typeof createDb>

/**
 * Create a Drizzle database instance from a D1Database
 * Use this when you have direct access to the D1 binding
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

/**
 * Get a database instance using Cloudflare bindings
 * Use this in server functions where bindings are available in the request context
 *
 * @example
 * ```ts
 * const getProducts = createServerFn({ method: 'GET' })
 *   .handler(async () => {
 *     const db = getDb()
 *     return db.select().from(schema.products).all()
 *   })
 * ```
 */
export function getDb() {
  const d1 = getD1()
  return createDb(d1)
}

export { schema }
