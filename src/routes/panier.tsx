import { createFileRoute, Link } from '@tanstack/react-router'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/Button'
import { cn, formatPrice } from '@/lib/utils'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/panier')({
  component: CartPage,
})

function CartPage() {
  const {
    items,
    itemCount,
    subtotalTtc,
    subtotalHt,
    taxAmount,
    isEmpty,
    isLoading,
    updateQuantity,
    removeItem,
    isUpdating,
    isRemoving,
  } = useCart()

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
          Mon panier
        </h1>
        <div className="mt-8 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="container py-8">
        <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
          Mon panier
        </h1>
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-16 w-16 text-[--text-muted]" />
          <h2 className="mt-4 text-xl font-semibold text-[--text-primary]">
            Votre panier est vide
          </h2>
          <p className="mt-2 text-[--text-muted]">
            Ajoutez des produits pour commencer vos achats
          </p>
          <Link to="/produits">
            <Button className="mt-6" size="lg">
              Découvrir nos produits
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
        Mon panier
        <span className="ml-2 text-lg font-normal text-[--text-muted]">
          ({itemCount} article{itemCount > 1 ? 's' : ''})
        </span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="divide-y divide-[--border-default] rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card]">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 p-4 sm:gap-6 sm:p-6"
              >
                {/* Image */}
                <Link
                  to="/produits/$slug"
                  params={{ slug: item.slug }}
                  className="shrink-0"
                >
                  <div className="h-24 w-24 overflow-hidden rounded-[--radius-md] border border-[--border-default] bg-white sm:h-32 sm:w-32">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[--text-muted]">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      to="/produits/$slug"
                      params={{ slug: item.slug }}
                      className="font-semibold text-[--text-primary] hover:text-primary-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 font-mono text-lg font-semibold text-[--text-primary]">
                      {formatPrice(item.priceTtc)}
                    </p>
                    <p className="text-xs text-[--text-muted]">
                      {formatPrice(item.priceHt)} HT
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1 || isUpdating}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-mono text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={
                          item.quantity >= item.stockQuantity || isUpdating
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      disabled={isRemoving}
                      className="text-error hover:bg-error-light hover:text-error-dark"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue shopping */}
          <div className="mt-4">
            <Link to="/produits">
              <Button variant="ghost">
                Continuer mes achats
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">
              Récapitulatif
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">Sous-total HT</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(subtotalHt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">TVA (20%)</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(taxAmount)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[--border-default] pt-3">
                <dt className="font-semibold text-[--text-primary]">
                  Total TTC
                </dt>
                <dd className="font-mono text-xl font-semibold text-[--text-primary]">
                  {formatPrice(subtotalTtc)}
                </dd>
              </div>
            </dl>

            <Link to="/commander">
              <Button size="lg" className="mt-6 w-full">
                Commander
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <p className="mt-4 text-center text-xs text-[--text-muted]">
              Frais de livraison calculés à l'étape suivante
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
