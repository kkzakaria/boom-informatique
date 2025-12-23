// Types pour les bindings Cloudflare Workers
export interface CloudflareEnv {
  DB: D1Database
  ASSETS_BUCKET: R2Bucket
  DOCS_BUCKET: R2Bucket
  ENVIRONMENT: string
}

// Helper pour obtenir l'URL publique d'un asset R2
export function getAssetUrl(path: string): string {
  // En production, utiliser le domaine custom ou le domaine R2 public
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://assets.boom-informatique.com'
      : '/api/assets'
  return `${baseUrl}/${path}`
}

// Helper pour obtenir l'URL d'une image produit
export function getProductImageUrl(
  productId: number,
  filename: string
): string {
  return getAssetUrl(`products/${productId}/${filename}`)
}

// Helper pour obtenir l'URL d'un logo de marque
export function getBrandLogoUrl(brandSlug: string): string {
  return getAssetUrl(`brands/${brandSlug}.png`)
}

// Helper pour obtenir l'URL d'un document (devis, facture)
export function getDocumentUrl(type: 'quotes' | 'invoices', id: number): string {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://docs.boom-informatique.com'
      : '/api/docs'
  return `${baseUrl}/${type}/${id}.pdf`
}
