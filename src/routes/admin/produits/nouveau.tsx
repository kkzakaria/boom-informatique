import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, getCategories, getBrands } from '@/server/admin/products'
import { ProductForm } from '@/components/admin/products/ProductForm'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import type { ProductFormValues } from '@/lib/validations/product'

export const Route = createFileRoute('/admin/produits/nouveau')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['admin', 'categories'],
        queryFn: () => getCategories(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'brands'],
        queryFn: () => getBrands(),
      }),
    ])
  },
  component: NewProductPage,
})

function NewProductPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: categories } = useSuspenseQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => getCategories(),
  })

  const { data: brands } = useSuspenseQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => getBrands(),
  })

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return createProduct({
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        sku: data.sku,
        ean: data.ean || undefined,
        brandId: data.brandId || undefined,
        categoryId: data.categoryId || undefined,
        priceHt: data.priceHt,
        taxRate: data.taxRate,
        stockQuantity: data.stockQuantity,
        stockAlertThreshold: data.stockAlertThreshold,
        isActive: data.isActive,
        featured: data.featured,
        attributes: data.attributes.map((a) => ({
          name: a.name,
          value: a.value,
        })),
      })
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      // Navigate to edit page to add images
      navigate({
        to: '/admin/produits/$productId',
        params: { productId: String(result.productId) },
      })
    },
  })

  const handleSubmit = async (data: ProductFormValues) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/produits" search={{ page: 1, search: '', isActive: undefined }}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
            Nouveau produit
          </h1>
          <p className="mt-1 text-[--text-muted]">
            Créez un nouveau produit dans le catalogue
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        mode="create"
        categories={categories}
        brands={brands}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />

      {/* Error display */}
      {createMutation.isError && (
        <div className="rounded-lg border border-error bg-error-light p-4">
          <p className="text-sm text-error-dark">
            Erreur lors de la création :{' '}
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Une erreur est survenue'}
          </p>
        </div>
      )}
    </div>
  )
}
