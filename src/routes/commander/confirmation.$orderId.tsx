import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getOrder } from '@/server/orders'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Package, Printer, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/commander/confirmation/$orderId')({
  loader: async ({ context: { queryClient }, params }) => {
    const orderId = parseInt(params.orderId, 10)
    const order = await queryClient.ensureQueryData({
      queryKey: ['order', orderId],
      queryFn: () => getOrder({ data: orderId }),
    })

    if (!order) {
      throw notFound()
    }

    return order
  },
  component: OrderConfirmationPage,
  notFoundComponent: () => (
    <div className="container flex flex-col items-center justify-center py-24">
      <h1 className="text-2xl font-semibold">Commande non trouvée</h1>
      <Link to="/">
        <Button className="mt-4">Retour à l'accueil</Button>
      </Link>
    </div>
  ),
})

function OrderConfirmationPage() {
  const { orderId } = Route.useParams()

  const { data: order } = useSuspenseQuery({
    queryKey: ['order', parseInt(orderId, 10)],
    queryFn: () => getOrder({ data: parseInt(orderId, 10) }),
  })

  if (!order) return null

  const paymentMethodLabels = {
    cash: 'Espèces',
    check: 'Chèque',
    transfer: 'Virement bancaire',
  }

  const shippingMethodLabels = {
    pickup: 'Retrait en magasin',
    delivery: 'Livraison locale',
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-[--text-primary]">
            Commande confirmée !
          </h1>
          <p className="mt-2 text-[--text-muted]">
            Merci pour votre commande. Vous recevrez un email de confirmation.
          </p>
        </div>

        {/* Order Details */}
        <div className="mt-8 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
          <div className="flex items-center justify-between border-b border-[--border-default] pb-4">
            <div>
              <p className="text-sm text-[--text-muted]">Numéro de commande</p>
              <p className="font-mono text-lg font-semibold text-[--text-primary]">
                {order.orderNumber}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>

          {/* Items */}
          <div className="mt-4">
            <h2 className="font-semibold text-[--text-primary]">Articles</h2>
            <div className="mt-3 divide-y divide-[--border-default]">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="text-[--text-primary]">{item.productName}</p>
                    <p className="text-[--text-muted]">
                      Réf: {item.productSku} · Qté: {item.quantity}
                    </p>
                  </div>
                  <p className="font-mono text-[--text-primary]">
                    {formatPrice(
                      item.unitPriceHt *
                        item.quantity *
                        (1 + item.taxRate / 100)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-4 border-t border-[--border-default] pt-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">Sous-total HT</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(order.subtotalHt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">TVA</dt>
                <dd className="font-mono text-[--text-primary]">
                  {formatPrice(order.taxAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[--text-muted]">Livraison</dt>
                <dd className="font-mono text-[--text-primary]">
                  {order.shippingCost === 0
                    ? 'Gratuit'
                    : formatPrice(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[--border-default] pt-2">
                <dt className="font-semibold text-[--text-primary]">
                  Total TTC
                </dt>
                <dd className="font-mono text-xl font-semibold text-[--text-primary]">
                  {formatPrice(order.totalTtc)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Shipping & Payment Info */}
          <div className="mt-6 grid gap-4 border-t border-[--border-default] pt-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-[--text-primary]">
                Mode de livraison
              </h3>
              <p className="mt-1 text-sm text-[--text-muted]">
                {
                  shippingMethodLabels[
                    order.shippingMethod as keyof typeof shippingMethodLabels
                  ]
                }
              </p>
              {order.shippingAddress && (
                <p className="mt-1 text-sm text-[--text-muted]">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-[--text-primary]">
                Mode de paiement
              </h3>
              <p className="mt-1 text-sm text-[--text-muted]">
                {
                  paymentMethodLabels[
                    order.paymentMethod as keyof typeof paymentMethodLabels
                  ]
                }
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-6 rounded-[--radius-md] bg-[--bg-muted] p-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 shrink-0 text-primary-500" />
              <div className="text-sm">
                <p className="font-medium text-[--text-primary]">
                  Prochaines étapes
                </p>
                {order.shippingMethod === 'pickup' ? (
                  <p className="mt-1 text-[--text-muted]">
                    Votre commande sera prête pour le retrait sous 2 heures.
                    Nous vous enverrons un SMS/email dès qu'elle sera
                    disponible.
                  </p>
                ) : (
                  <p className="mt-1 text-[--text-muted]">
                    Votre commande sera livrée sous 24-48 heures. Vous recevrez
                    un email avec les informations de suivi.
                  </p>
                )}
                {order.paymentMethod === 'transfer' && (
                  <p className="mt-2 text-[--text-muted]">
                    Les coordonnées bancaires pour le virement vous ont été
                    envoyées par email.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/compte/commandes/$orderId" params={{ orderId }}>
            <Button variant="outline">
              Voir les détails de la commande
            </Button>
          </Link>
          <Link to="/produits">
            <Button>
              Continuer mes achats
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
