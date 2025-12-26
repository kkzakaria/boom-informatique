import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProducts, getCategories, getBrands } from '@/server/catalog'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'
import { ChevronDown, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import { useState, Suspense } from 'react'

interface SearchParams {
  category?: string
  brand?: string
  q?: string
  sort?: 'price-asc' | 'price-desc' | 'name' | 'newest'
  page?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

export const Route = createFileRoute('/produits/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    category: search.category as string | undefined,
    brand: search.brand as string | undefined,
    q: search.q as string | undefined,
    sort: search.sort as SearchParams['sort'],
    page: search.page ? Number(search.page) : undefined,
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    inStock: search.inStock === true || search.inStock === 'true',
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['products', deps],
        queryFn: () =>
          getProducts({
            data: {
              categorySlug: deps.category,
              brandSlug: deps.brand,
              search: deps.q,
              sortBy: deps.sort,
              page: deps.page || 1,
              minPrice: deps.minPrice,
              maxPrice: deps.maxPrice,
              inStock: deps.inStock,
            },
          }),
      }),
      queryClient.ensureQueryData({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['brands'],
        queryFn: () => getBrands(),
      }),
    ])
  },
  component: ProductsPage,
})

const sortOptions = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
]

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: productsData } = useSuspenseQuery({
    queryKey: ['products', search],
    queryFn: () =>
      getProducts({
        data: {
          categorySlug: search.category,
          brandSlug: search.brand,
          search: search.q,
          sortBy: search.sort,
          page: search.page || 1,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
          inStock: search.inStock,
        },
      }),
  })

  const { data: categories } = useSuspenseQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const { data: brands } = useSuspenseQuery({
    queryKey: ['brands'],
    queryFn: () => getBrands(),
  })

  const updateSearch = (updates: Partial<SearchParams>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates, page: 1 }),
    })
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
          {search.q
            ? `Recherche: "${search.q}"`
            : search.category
              ? 'Produits'
              : 'Tous les produits'}
        </h1>
        <p className="mt-1 text-[--text-muted]">
          {productsData.total} produit{productsData.total > 1 ? 's' : ''} trouvé
          {productsData.total > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside
          className={cn(
            'w-64 shrink-0 space-y-6',
            'hidden lg:block',
            showFilters && 'block'
          )}
        >
          {/* Categories */}
          <div>
            <h3 className="mb-3 font-semibold text-[--text-primary]">
              Catégories
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => updateSearch({ category: undefined })}
                  className={cn(
                    'w-full rounded-[--radius-sm] px-3 py-2 text-left text-sm transition-colors',
                    !search.category
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                      : 'text-[--text-secondary] hover:bg-[--bg-muted]'
                  )}
                >
                  Toutes les catégories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateSearch({ category: cat.slug })}
                    className={cn(
                      'w-full rounded-[--radius-sm] px-3 py-2 text-left text-sm transition-colors',
                      search.category === cat.slug
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                        : 'text-[--text-secondary] hover:bg-[--bg-muted]'
                    )}
                  >
                    {cat.name}
                    <span className="ml-1 text-[--text-muted]">
                      ({cat.productCount})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="mb-3 font-semibold text-[--text-primary]">Marques</h3>
            <ul className="space-y-1">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <button
                    onClick={() =>
                      updateSearch({
                        brand:
                          search.brand === brand.slug ? undefined : brand.slug,
                      })
                    }
                    className={cn(
                      'w-full rounded-[--radius-sm] px-3 py-2 text-left text-sm transition-colors',
                      search.brand === brand.slug
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                        : 'text-[--text-secondary] hover:bg-[--bg-muted]'
                    )}
                  >
                    {brand.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Stock filter */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={search.inStock || false}
                onChange={(e) => updateSearch({ inStock: e.target.checked })}
                className="h-4 w-4 rounded border-[--border-default]"
              />
              <span className="text-sm text-[--text-secondary]">
                En stock uniquement
              </span>
            </label>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between gap-4 rounded-[--radius-lg] border border-[--border-default] bg-white dark:bg-surface-900 p-4 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[--text-muted]">Trier par:</span>
                <select
                  value={search.sort || 'newest'}
                  onChange={(e) =>
                    updateSearch({ sort: e.target.value as SearchParams['sort'] })
                  }
                  className="rounded-[--radius-md] border border-[--border-default] bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-[--text-primary]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* View mode */}
              <div className="flex gap-1 rounded-[--radius-md] bg-surface-100 dark:bg-surface-800 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded-[--radius-sm] p-1.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-700 shadow-sm text-[--text-primary]'
                      : 'text-[--text-muted] hover:text-[--text-secondary]'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-[--radius-sm] p-1.5 transition-colors',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-surface-700 shadow-sm text-[--text-primary]'
                      : 'text-[--text-muted] hover:text-[--text-secondary]'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {productsData.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg text-[--text-muted]">
                Aucun produit trouvé
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate({ search: {} })}
              >
                Effacer les filtres
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {productsData.products.map((product) => (
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
                    isNew={
                      product.createdAt
                        ? Date.now() - product.createdAt.getTime() <
                          30 * 24 * 60 * 60 * 1000
                        : false
                    }
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {productsData.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={productsData.page <= 1}
                onClick={() =>
                  updateSearch({ page: Math.max(1, productsData.page - 1) })
                }
              >
                Précédent
              </Button>
              <span className="flex items-center px-4 text-sm text-[--text-muted]">
                Page {productsData.page} sur {productsData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={productsData.page >= productsData.totalPages}
                onClick={() =>
                  updateSearch({
                    page: Math.min(
                      productsData.totalPages,
                      productsData.page + 1
                    ),
                  })
                }
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
