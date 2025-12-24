import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { X, Scale, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useComparison } from '@/hooks/useComparison'
import { getProductBySlug } from '@/server/catalog'
import { Button } from '@/components/ui/Button'
import { StockBadge } from '@/components/ui/Badge'
import { StarRatingDisplay } from '@/components/reviews/StarRatingInput'
import { cn, formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/comparer')({
  component: ComparePage,
})

function ComparePage() {
  const { products, remove, clear, isEmpty } = useComparison()

  if (isEmpty) {
    return (
      <div className="container py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <Scale className="h-16 w-16 text-[--text-muted] mb-4" />
          <h1 className="text-2xl font-semibold text-[--text-primary] mb-2">
            Comparateur vide
          </h1>
          <p className="text-[--text-muted] mb-6 max-w-md">
            Ajoutez des produits au comparateur depuis le catalogue pour les comparer
            côte à côte.
          </p>
          <Link to="/produits">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Voir les produits
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[--text-primary]">
            Comparateur de produits
          </h1>
          <p className="text-sm text-[--text-muted] mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''} à comparer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/produits">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Ajouter des produits
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={clear}>
            Vider le comparateur
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Product Images & Names */}
          <thead>
            <tr>
              <th className="w-[150px] min-w-[150px] border-b border-[--border-default] bg-[--bg-muted] p-4 text-left">
                <span className="text-sm font-medium text-[--text-muted]">
                  Produit
                </span>
              </th>
              {products.map((product) => (
                <th
                  key={product.id}
                  className="min-w-[200px] border-b border-[--border-default] bg-[--bg-card] p-4"
                >
                  <div className="relative">
                    <button
                      onClick={() => remove(product.id)}
                      className="absolute -top-2 -right-2 rounded-full bg-surface-100 p-1 text-[--text-muted] hover:bg-error hover:text-white transition-colors"
                      aria-label="Retirer du comparateur"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Link
                      to="/produits/$slug"
                      params={{ slug: product.slug }}
                      className="block"
                    >
                      <img
                        src={product.imageUrl || '/placeholder.png'}
                        alt={product.name}
                        className="mx-auto h-32 w-32 object-contain mb-3"
                      />
                      <p className="text-xs text-[--text-muted] uppercase tracking-wider">
                        {product.brandName}
                      </p>
                      <h3 className="text-sm font-semibold text-[--text-primary] line-clamp-2 hover:text-primary-600">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price Row */}
            <ComparisonRow label="Prix TTC">
              {products.map((product) => (
                <td
                  key={product.id}
                  className="border-b border-[--border-default] p-4 text-center"
                >
                  <span className="text-xl font-bold text-[--text-primary]">
                    {formatPrice(product.priceTtc)}
                  </span>
                  <p className="text-xs text-[--text-muted] mt-1">
                    {formatPrice(product.priceHt)} HT
                  </p>
                </td>
              ))}
            </ComparisonRow>

            {/* Dynamic Attributes */}
            {products.map((product) => (
              <ProductAttributesRows
                key={product.id}
                slug={product.slug}
                productId={product.id}
                allProducts={products}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComparisonRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <tr>
      <td className="border-b border-[--border-default] bg-[--bg-muted] p-4">
        <span className="text-sm font-medium text-[--text-secondary]">
          {label}
        </span>
      </td>
      {children}
    </tr>
  )
}

function ProductAttributesRows({
  slug,
  productId,
  allProducts,
}: {
  slug: string
  productId: number
  allProducts: { id: number; slug: string }[]
}) {
  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug({ data: slug }),
  })

  // Only render rows for the first product to avoid duplicate rows
  if (productId !== allProducts[0].id) {
    return null
  }

  // Get all unique attribute names from all products
  const { data: allProductsData } = useQuery({
    queryKey: ['comparison-products', allProducts.map((p) => p.slug)],
    queryFn: async () => {
      const results = await Promise.all(
        allProducts.map((p) => getProductBySlug({ data: p.slug }))
      )
      return results
    },
  })

  if (!allProductsData) return null

  // Collect all unique attribute names
  const attributeNames = new Set<string>()
  allProductsData.forEach((p) => {
    p?.attributes.forEach((attr) => attributeNames.add(attr.name))
  })

  // Get stock statuses
  const getStockStatus = (
    quantity: number,
    threshold: number = 5
  ): 'available' | 'low' | 'out' => {
    if (quantity === 0) return 'out'
    if (quantity <= threshold) return 'low'
    return 'available'
  }

  return (
    <>
      {/* Stock Row */}
      <ComparisonRow label="Disponibilité">
        {allProductsData.map((p) =>
          p ? (
            <td
              key={p.id}
              className="border-b border-[--border-default] p-4 text-center"
            >
              <StockBadge
                status={getStockStatus(p.stockQuantity, p.stockAlertThreshold || 5)}
              />
            </td>
          ) : null
        )}
      </ComparisonRow>

      {/* Rating Row */}
      <ComparisonRow label="Avis clients">
        {allProductsData.map((p) =>
          p ? (
            <td
              key={p.id}
              className="border-b border-[--border-default] p-4 text-center"
            >
              {p.rating.count > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <StarRatingDisplay
                    rating={p.rating.average}
                    showCount={false}
                    size="sm"
                  />
                  <span className="text-xs text-[--text-muted]">
                    ({p.rating.count} avis)
                  </span>
                </div>
              ) : (
                <span className="text-sm text-[--text-muted]">Aucun avis</span>
              )}
            </td>
          ) : null
        )}
      </ComparisonRow>

      {/* Brand Row */}
      <ComparisonRow label="Marque">
        {allProductsData.map((p) =>
          p ? (
            <td
              key={p.id}
              className="border-b border-[--border-default] p-4 text-center"
            >
              <span className="text-sm text-[--text-primary]">
                {p.brand?.name || '-'}
              </span>
            </td>
          ) : null
        )}
      </ComparisonRow>

      {/* SKU Row */}
      <ComparisonRow label="Référence">
        {allProductsData.map((p) =>
          p ? (
            <td
              key={p.id}
              className="border-b border-[--border-default] p-4 text-center"
            >
              <span className="font-mono text-xs text-[--text-muted]">
                {p.sku}
              </span>
            </td>
          ) : null
        )}
      </ComparisonRow>

      {/* Dynamic Attributes */}
      {Array.from(attributeNames).map((attrName) => (
        <ComparisonRow key={attrName} label={attrName}>
          {allProductsData.map((p) => {
            const attr = p?.attributes.find((a) => a.name === attrName)
            return (
              <td
                key={p?.id}
                className="border-b border-[--border-default] p-4 text-center"
              >
                <span
                  className={cn(
                    'text-sm',
                    attr ? 'text-[--text-primary]' : 'text-[--text-muted]'
                  )}
                >
                  {attr?.value || '-'}
                </span>
              </td>
            )
          })}
        </ComparisonRow>
      ))}

      {/* Add to Cart Row */}
      <tr>
        <td className="bg-[--bg-muted] p-4" />
        {allProductsData.map((p) =>
          p ? (
            <td key={p.id} className="p-4 text-center">
              <Button
                variant="primary"
                size="sm"
                disabled={p.stockQuantity === 0}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4" />
                Ajouter au panier
              </Button>
            </td>
          ) : null
        )}
      </tr>
    </>
  )
}
