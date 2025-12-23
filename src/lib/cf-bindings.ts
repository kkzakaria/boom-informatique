import { env } from 'cloudflare:workers'

/**
 * Cloudflare bindings interface
 * Matches the bindings defined in wrangler.jsonc
 */
export interface CloudflareBindings {
  DB: D1Database
  ASSETS_BUCKET: R2Bucket
  DOCS_BUCKET: R2Bucket
  ENVIRONMENT: string
  SESSION_SECRET: string
}

/**
 * Get Cloudflare bindings from cloudflare:workers
 * Must be called within a server function
 */
export function getBindings(): CloudflareBindings {
  return env as unknown as CloudflareBindings
}

/**
 * Get D1 database binding
 */
export function getD1(): D1Database {
  return getBindings().DB
}

/**
 * Get R2 assets bucket binding
 */
export function getAssetsBucket(): R2Bucket {
  return getBindings().ASSETS_BUCKET
}

/**
 * Get R2 docs bucket binding
 */
export function getDocsBucket(): R2Bucket {
  return getBindings().DOCS_BUCKET
}

/**
 * Get session secret for auth
 */
export function getSessionSecret(): string {
  const secret = getBindings().SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured in Cloudflare bindings')
  }
  return secret
}
