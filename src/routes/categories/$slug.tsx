import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getCategoryBySlug, getProducts } from '@/server/catalog'
import { ProductCard } from '@/components/ui/ProductCard'
import { Button } from '@/components/ui/Button'
import { ChevronRight } from 'lucide-react'

interface SearchParams {
  sort?: 'price-asc' | 'price-desc' | 'name' | 'newest'
  page?: number
}

export const Route = createFileRoute('/categories/$slug')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    sort: search.sort as SearchParams['sort'],
    page: search.page ? Number(search.page) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, deps }) => {
    const category = await queryClient.ensureQueryData({
      queryKey: ['category', params.slug],
      queryFn: () => getCategoryBySlug({ data: params.slug }),
    })

    if (!category) {
      throw notFound()
    }

    await queryClient.ensureQueryData({
      queryKey: ['products', { category: params.slug, ...deps }],
      queryFn: () =>
        getProducts({
          data: {
            categorySlug: params.slug,
            sortBy: deps.sort,
            page: deps.page || 1,
          },
        }),
    })

    return category
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="container flex flex-col items-center justify-center py-24">
      <h1 className="text-2xl font-semibold">Catégorie non trouvée</h1>
      <p className="mt-2 text-[--text-muted]">
        Cette catégorie n'existe pas.
      </p>
      <Link to="/produits">
        <Button className="mt-4">Voir tous les produits</Button>
      </Link>
    </div>
  ),
})

const sortOptions = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
]

function CategoryPage() {
  const { slug } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: category } = useSuspenseQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug({ data: slug }),
  })

  const { data: productsData } = useSuspenseQuery({
    queryKey: ['products', { category: slug, ...search }],
    queryFn: () =>
      getProducts({
        data: {
          categorySlug: slug,
          sortBy: search.sort,
          page: search.page || 1,
        },
      }),
  })

  if (!category) return null

  const updateSearch = (updates: Partial<SearchParams>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
    })
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
        {category.parent && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/categories/$slug"
              params={{ slug: category.parent.slug }}
              className="hover:text-[--text-primary]"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-[--text-primary]">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
          {category.name}
        </h1>
        <p className="mt-1 text-[--text-muted]">
          {productsData.total} produit{productsData.total > 1 ? 's' : ''}
        </p>

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                to="/categories/$slug"
                params={{ slug: child.slug }}
              >
                <Button variant="outline" size="sm">
                  {child.name}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[--text-muted]">Trier par:</span>
          <select
            value={search.sort || 'newest'}
            onChange={(e) =>
              updateSearch({ sort: e.target.value as SearchParams['sort'] })
            }
            className="rounded-[--radius-md] border border-[--border-default] bg-[--bg-card] px-3 py-1.5 text-sm"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {productsData.products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-[--text-muted]">
            Aucun produit dans cette catégorie
          </p>
          <Link to="/produits">
            <Button variant="outline" className="mt-4">
              Voir tous les produits
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                page: Math.min(productsData.totalPages, productsData.page + 1),
              })
            }
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
