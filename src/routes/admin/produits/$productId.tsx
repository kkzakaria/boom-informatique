import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
} from '@/server/admin/products'
import {
  uploadProductImage,
  deleteProductImage,
  getProductStockMovements,
} from '@/server/admin/images'
import { ProductForm } from '@/components/admin/products/ProductForm'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { ProductFormValues } from '@/lib/validations/product'

export const Route = createFileRoute('/admin/produits/$productId')({
  loader: async ({ context: { queryClient }, params }) => {
    const safeParams = params || { productId: '0' }
    const productId = Number(safeParams.productId) || 0

    if (!productId) {
      throw new Error('Product ID is required')
    }

    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['admin', 'product', productId],
        queryFn: () => getProductById(productId),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'categories'],
        queryFn: () => getCategories(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'brands'],
        queryFn: () => getBrands(),
      }),
      queryClient.ensureQueryData({
        queryKey: ['admin', 'product', productId, 'stockMovements'],
        queryFn: () => getProductStockMovements(productId),
      }),
    ])
  },
  component: EditProductPage,
})

function EditProductPage() {
  const params = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const productId = Number(params.productId)

  const { data: product } = useSuspenseQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: () => getProductById(productId),
  })

  const { data: categories } = useSuspenseQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => getCategories(),
  })

  const { data: brands } = useSuspenseQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => getBrands(),
  })

  const { data: stockMovements } = useSuspenseQuery({
    queryKey: ['admin', 'product', productId, 'stockMovements'],
    queryFn: () => getProductStockMovements(productId),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return updateProduct({
        productId,
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        sku: data.sku,
        ean: data.ean || undefined,
        brandId: data.brandId || undefined,
        categoryId: data.categoryId || undefined,
        priceHt: data.priceHt,
        taxRate: data.taxRate,
        stockAlertThreshold: data.stockAlertThreshold,
        isActive: data.isActive,
        featured: data.featured,
        attributes: data.attributes.map((a) => ({
          name: a.name,
          value: a.value,
        })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate({ to: '/admin/produits', search: { page: 1, search: '', isActive: undefined } })
    },
  })

  const handleSubmit = async (data: ProductFormValues) => {
    await updateMutation.mutateAsync(data)
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
  }

  const handleImageUpload = async (
    file: File,
    position: number,
    isMain: boolean
  ) => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:image/xxx;base64, prefix
      }
      reader.readAsDataURL(file)
    })

    const result = await uploadProductImage({
      productId,
      filename: file.name,
      contentType: file.type,
      base64Data: base64,
      position,
      isMain,
    })

    // Invalidate product query to refresh images
    queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] })

    return { id: result.imageId, url: result.url }
  }

  const handleImageDelete = async (imageId: number) => {
    await deleteProductImage(imageId)
    // Invalidate product query to refresh images
    queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/produits" search={{ page: 1, search: '', isActive: undefined }}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
                {product.name}
              </h1>
              {!product.isActive && (
                <Badge variant="default">Inactif</Badge>
              )}
              {product.featured && (
                <Badge variant="primary">Vedette</Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-[--text-muted]">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <a
          href={`/produit/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:block"
        >
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
            Voir le produit
          </Button>
        </a>
      </div>

      {/* Form */}
      <ProductForm
        mode="edit"
        initialData={product}
        categories={categories}
        brands={brands}
        stockMovements={stockMovements}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
        isSubmitting={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      {/* Success message */}
      {updateMutation.isSuccess && (
        <div className="rounded-lg border border-success bg-success-light p-4">
          <p className="text-sm text-success-dark">
            Produit mis à jour avec succès !
          </p>
        </div>
      )}

      {/* Error display */}
      {(updateMutation.isError || deleteMutation.isError) && (
        <div className="rounded-lg border border-error bg-error-light p-4">
          <p className="text-sm text-error-dark">
            Erreur :{' '}
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Une erreur est survenue'}
          </p>
        </div>
      )}
    </div>
  )
}
