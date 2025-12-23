import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getProductBySlug, getProducts } from '@/server/catalog'
import { ProductCard } from '@/components/ui/ProductCard'
import { Button } from '@/components/ui/Button'
import { StockBadge } from '@/components/ui/Badge'
import { cn, formatPrice } from '@/lib/utils'
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Minus,
  Plus,
  Truck,
  Store,
  Shield,
} from 'lucide-react'

export const Route = createFileRoute('/produits/$slug')({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient.ensureQueryData({
      queryKey: ['product', params.slug],
      queryFn: () => getProductBySlug({ data: params.slug }),
    })

    if (!product) {
      throw notFound()
    }

    // Also prefetch related products
    if (product.category) {
      queryClient.prefetchQuery({
        queryKey: ['products', { category: product.category.slug }],
        queryFn: () =>
          getProducts({
            data: { categorySlug: product.category!.slug, limit: 4 },
          }),
      })
    }

    return product
  },
  component: ProductDetailPage,
  notFoundComponent: () => (
    <div className="container flex flex-col items-center justify-center py-24">
      <h1 className="text-2xl font-semibold">Produit non trouvé</h1>
      <p className="mt-2 text-[--text-muted]">
        Ce produit n'existe pas ou n'est plus disponible.
      </p>
      <Link to="/produits">
        <Button className="mt-4">Retour aux produits</Button>
      </Link>
    </div>
  ),
})

function ProductDetailPage() {
  const { slug } = Route.useParams()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const { data: product } = useSuspenseQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug({ data: slug }),
  })

  if (!product) return null

  const stockStatus =
    product.stockQuantity === 0
      ? 'out'
      : product.stockQuantity <= (product.stockAlertThreshold || 5)
        ? 'low'
        : 'available'

  const isOutOfStock = stockStatus === 'out'

  const mainImage =
    product.images.find((i) => i.isMain)?.url ||
    product.images[0]?.url ||
    '/placeholder.png'

  const handleAddToCart = () => {
    // TODO: Implement cart logic
    console.log('Add to cart:', product.id, quantity)
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[--text-muted]">
        <Link to="/" className="hover:text-[--text-primary]">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/produits" className="hover:text-[--text-primary]">
          Produits
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/produits"
              search={{ category: product.category.slug }}
              className="hover:text-[--text-primary]"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-[--text-primary]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-[--radius-lg] border border-[--border-default] bg-white">
            <img
              src={product.images[selectedImage]?.url || mainImage}
              alt={product.name}
              className="h-full w-full object-contain p-8"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'h-20 w-20 shrink-0 overflow-hidden rounded-[--radius-md] border-2 bg-white transition-all',
                    selectedImage === index
                      ? 'border-primary-500'
                      : 'border-[--border-default] hover:border-[--border-strong]'
                  )}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="h-full w-full object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Brand */}
          {product.brand && (
            <Link
              to="/produits"
              search={{ brand: product.brand.slug }}
              className="font-mono text-sm uppercase tracking-wider text-primary-600 hover:underline dark:text-primary-400"
            >
              {product.brand.name}
            </Link>
          )}

          {/* Name */}
          <h1 className="mt-2 font-display text-3xl font-semibold text-[--text-primary]">
            {product.name}
          </h1>

          {/* SKU */}
          <p className="mt-1 font-mono text-sm text-[--text-muted]">
            Réf: {product.sku}
          </p>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-semibold text-[--text-primary]">
              {formatPrice(product.priceTtc)}
            </span>
            <span className="text-sm text-[--text-muted]">TTC</span>
          </div>
          <p className="mt-1 text-sm text-[--text-muted]">
            {formatPrice(product.priceHt)} HT
          </p>

          {/* Stock */}
          <div className="mt-4">
            <StockBadge status={stockStatus} />
            {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
              <span className="ml-2 text-sm text-warning-dark">
                Plus que {product.stockQuantity} en stock
              </span>
            )}
          </div>

          {/* Quantity & Add to cart */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[--text-secondary]">Quantité</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(product.stockQuantity, Number(e.target.value))
                      )
                    )
                  }
                  className="w-16 rounded-[--radius-md] border border-[--border-default] bg-[--bg-card] px-3 py-1.5 text-center font-mono"
                  min="1"
                  max={product.stockQuantity}
                />
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() =>
                    setQuantity(Math.min(product.stockQuantity, quantity + 1))
                  }
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="xl"
                className="flex-1"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
              </Button>
              <Button
                variant="secondary"
                size="icon-lg"
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(isFavorite && 'text-error')}
              >
                <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
              </Button>
              <Button variant="secondary" size="icon-lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Delivery info */}
          <div className="mt-8 space-y-3 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-muted] p-4">
            <div className="flex items-center gap-3 text-sm">
              <Store className="h-5 w-5 text-primary-500" />
              <div>
                <p className="font-medium text-[--text-primary]">
                  Retrait en magasin
                </p>
                <p className="text-[--text-muted]">
                  Gratuit - Disponible sous 2h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-primary-500" />
              <div>
                <p className="font-medium text-[--text-primary]">
                  Livraison locale
                </p>
                <p className="text-[--text-muted]">À partir de 5,90€</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-primary-500" />
              <div>
                <p className="font-medium text-[--text-primary]">
                  Garantie constructeur
                </p>
                <p className="text-[--text-muted]">2 ans minimum</p>
              </div>
            </div>
          </div>

          {/* Attributes */}
          {product.attributes.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 font-semibold text-[--text-primary]">
                Caractéristiques
              </h2>
              <dl className="divide-y divide-[--border-default] rounded-[--radius-lg] border border-[--border-default]">
                {product.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <dt className="text-[--text-muted]">{attr.name}</dt>
                    <dd className="font-medium text-[--text-primary]">
                      {attr.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-semibold text-[--text-primary]">
            Description
          </h2>
          <div className="prose max-w-none text-[--text-secondary]">
            <p>{product.description}</p>
          </div>
        </div>
      )}

      {/* Related Products */}
      {product.category && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold text-[--text-primary]">
            Produits similaires
          </h2>
          <RelatedProducts
            categorySlug={product.category.slug}
            excludeId={product.id}
          />
        </div>
      )}
    </div>
  )
}

function RelatedProducts({
  categorySlug,
  excludeId,
}: {
  categorySlug: string
  excludeId: number
}) {
  const { data } = useSuspenseQuery({
    queryKey: ['products', { category: categorySlug }],
    queryFn: () => getProducts({ data: { categorySlug, limit: 5 } }),
  })

  const relatedProducts = data.products.filter((p) => p.id !== excludeId).slice(0, 4)

  if (relatedProducts.length === 0) return null

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {relatedProducts.map((product) => (
        <Link
          key={product.id}
          to="/produits/$slug"
          params={{ slug: product.slug }}
        >
          <ProductCard
            id={product.id}
            name={product.name}
            slug={product.slug}
            brand={product.brand?.name || ''}
            imageUrl={
              product.images.find((i) => i.isMain)?.url ||
              product.images[0]?.url ||
              '/placeholder.png'
            }
            priceTtc={product.priceTtc}
            priceHt={product.priceHt}
            stockQuantity={product.stockQuantity}
            stockAlertThreshold={product.stockAlertThreshold || 5}
          />
        </Link>
      ))}
    </div>
  )
}
