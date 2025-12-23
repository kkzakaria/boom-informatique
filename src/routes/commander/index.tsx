import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuth, useRequireAuth } from '@/hooks/useAuth'
import { getAddresses, addAddress } from '@/server/user'
import { createOrder } from '@/server/orders'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn, formatPrice } from '@/lib/utils'
import {
  ChevronRight,
  MapPin,
  Truck,
  Store,
  CreditCard,
  Banknote,
  FileCheck,
  AlertCircle,
} from 'lucide-react'

export const Route = createFileRoute('/commander/')({
  beforeLoad: async ({ context }) => {
    // Will redirect if not authenticated
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['addresses'],
      queryFn: () => getAddresses(),
    })
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  useRequireAuth()
  const navigate = useNavigate()
  const { items, subtotalTtc, subtotalHt, taxAmount, isEmpty } = useCart()
  const { user } = useAuth()

  const [selectedShippingAddress, setSelectedShippingAddress] = useState<
    number | null
  >(null)
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<
    number | null
  >(null)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [shippingMethod, setShippingMethod] = useState<'pickup' | 'delivery'>(
    'pickup'
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'check' | 'transfer'
  >('cash')
  const [notes, setNotes] = useState('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: addresses, refetch: refetchAddresses } = useSuspenseQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
  })

  const addAddressMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: (newAddress) => {
      refetchAddresses()
      setSelectedShippingAddress(newAddress.id)
      setShowNewAddress(false)
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (result) => {
      navigate({
        to: '/commander/confirmation/$orderId',
        params: { orderId: String(result.orderId) },
      })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    },
  })

  const shippingCost = shippingMethod === 'delivery' ? 5.9 : 0
  const totalTtc = subtotalTtc + shippingCost

  const handleSubmit = () => {
    setError(null)

    const billingId = sameAsShipping
      ? selectedShippingAddress
      : selectedBillingAddress

    if (!selectedShippingAddress) {
      setError('Veuillez sélectionner une adresse de livraison')
      return
    }

    if (!billingId) {
      setError('Veuillez sélectionner une adresse de facturation')
      return
    }

    createOrderMutation.mutate({
      data: {
        shippingAddressId: selectedShippingAddress,
        billingAddressId: billingId,
        shippingMethod,
        paymentMethod,
        notes: notes || undefined,
      },
    })
  }

  if (isEmpty) {
    return (
      <div className="container flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-semibold">Votre panier est vide</h1>
        <Link to="/produits">
          <Button className="mt-4">Voir les produits</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[--text-muted]">
        <Link to="/" className="hover:text-[--text-primary]">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/panier" className="hover:text-[--text-primary]">
          Panier
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[--text-primary]">Commander</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold text-[--text-primary]">
        Finaliser ma commande
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Shipping Address */}
          <section className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="flex items-center gap-2 font-semibold text-[--text-primary]">
              <MapPin className="h-5 w-5 text-primary-500" />
              Adresse de livraison
            </h2>

            {addresses.length === 0 && !showNewAddress ? (
              <div className="mt-4">
                <p className="text-[--text-muted]">Aucune adresse enregistrée</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowNewAddress(true)}
                >
                  Ajouter une adresse
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-[--radius-md] border p-4 transition-colors',
                      selectedShippingAddress === address.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                        : 'border-[--border-default] hover:border-[--border-strong]'
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedShippingAddress === address.id}
                      onChange={() => setSelectedShippingAddress(address.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-[--text-primary]">
                        {address.street}
                      </p>
                      <p className="text-sm text-[--text-muted]">
                        {address.postalCode} {address.city}
                      </p>
                      <p className="text-sm text-[--text-muted]">
                        {address.country}
                      </p>
                    </div>
                  </label>
                ))}

                {!showNewAddress && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewAddress(true)}
                  >
                    + Ajouter une nouvelle adresse
                  </Button>
                )}
              </div>
            )}

            {showNewAddress && (
              <NewAddressForm
                onSubmit={(data) => addAddressMutation.mutate({ data })}
                onCancel={() => setShowNewAddress(false)}
                isLoading={addAddressMutation.isPending}
              />
            )}

            {/* Same billing address */}
            <label className="mt-6 flex items-center gap-2">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="h-4 w-4 rounded border-[--border-default]"
              />
              <span className="text-sm text-[--text-secondary]">
                Utiliser la même adresse pour la facturation
              </span>
            </label>

            {/* Billing Address (if different) */}
            {!sameAsShipping && (
              <div className="mt-4 border-t border-[--border-default] pt-4">
                <h3 className="font-medium text-[--text-primary]">
                  Adresse de facturation
                </h3>
                <div className="mt-3 space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-[--radius-md] border p-4 transition-colors',
                        selectedBillingAddress === address.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                          : 'border-[--border-default] hover:border-[--border-strong]'
                      )}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        checked={selectedBillingAddress === address.id}
                        onChange={() => setSelectedBillingAddress(address.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-[--text-primary]">
                          {address.street}
                        </p>
                        <p className="text-sm text-[--text-muted]">
                          {address.postalCode} {address.city}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Shipping Method */}
          <section className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="flex items-center gap-2 font-semibold text-[--text-primary]">
              <Truck className="h-5 w-5 text-primary-500" />
              Mode de livraison
            </h2>

            <div className="mt-4 space-y-3">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-[--radius-md] border p-4 transition-colors',
                  shippingMethod === 'pickup'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-[--border-default] hover:border-[--border-strong]'
                )}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'pickup'}
                  onChange={() => setShippingMethod('pickup')}
                />
                <Store className="h-6 w-6 text-[--text-muted]" />
                <div className="flex-1">
                  <p className="font-medium text-[--text-primary]">
                    Retrait en magasin
                  </p>
                  <p className="text-sm text-[--text-muted]">
                    Gratuit - Disponible sous 2h
                  </p>
                </div>
                <span className="font-mono font-semibold text-success">
                  Gratuit
                </span>
              </label>

              <label
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-[--radius-md] border p-4 transition-colors',
                  shippingMethod === 'delivery'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-[--border-default] hover:border-[--border-strong]'
                )}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === 'delivery'}
                  onChange={() => setShippingMethod('delivery')}
                />
                <Truck className="h-6 w-6 text-[--text-muted]" />
                <div className="flex-1">
                  <p className="font-medium text-[--text-primary]">
                    Livraison locale
                  </p>
                  <p className="text-sm text-[--text-muted]">
                    Livraison sous 24-48h
                  </p>
                </div>
                <span className="font-mono font-semibold text-[--text-primary]">
                  {formatPrice(5.9)}
                </span>
              </label>
            </div>
          </section>

          {/* Payment Method */}
          <section className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="flex items-center gap-2 font-semibold text-[--text-primary]">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Mode de paiement
            </h2>

            <div className="mt-4 space-y-3">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-[--radius-md] border p-4 transition-colors',
                  paymentMethod === 'cash'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-[--border-default] hover:border-[--border-strong]'
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <Banknote className="h-6 w-6 text-[--text-muted]" />
                <div>
                  <p className="font-medium text-[--text-primary]">Espèces</p>
                  <p className="text-sm text-[--text-muted]">
                    Paiement à la livraison ou au retrait
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-[--radius-md] border p-4 transition-colors',
                  paymentMethod === 'check'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-[--border-default] hover:border-[--border-strong]'
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'check'}
                  onChange={() => setPaymentMethod('check')}
                />
                <FileCheck className="h-6 w-6 text-[--text-muted]" />
                <div>
                  <p className="font-medium text-[--text-primary]">Chèque</p>
                  <p className="text-sm text-[--text-muted]">
                    À l'ordre de Boom Informatique
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-[--radius-md] border p-4 transition-colors',
                  paymentMethod === 'transfer'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-[--border-default] hover:border-[--border-strong]'
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'transfer'}
                  onChange={() => setPaymentMethod('transfer')}
                />
                <CreditCard className="h-6 w-6 text-[--text-muted]" />
                <div>
                  <p className="font-medium text-[--text-primary]">
                    Virement bancaire
                  </p>
                  <p className="text-sm text-[--text-muted]">
                    RIB fourni après validation
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">
              Notes (optionnel)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions de livraison, commentaires..."
              className="mt-4 w-full rounded-[--radius-md] border border-[--border-default] bg-[--bg-page] p-3 text-sm"
              rows={3}
            />
          </section>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-6">
            <h2 className="font-semibold text-[--text-primary]">Récapitulatif</h2>

            {/* Items */}
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[--radius-sm] border border-[--border-default] bg-white">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-[--text-primary]">
                      {item.name}
                    </p>
                    <p className="text-[--text-muted]">
                      {item.quantity} x {formatPrice(item.priceTtc)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[--border-default] pt-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[--text-muted]">Sous-total HT</dt>
                  <dd className="font-mono text-[--text-primary]">
                    {formatPrice(subtotalHt)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[--text-muted]">TVA</dt>
                  <dd className="font-mono text-[--text-primary]">
                    {formatPrice(taxAmount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[--text-muted]">Livraison</dt>
                  <dd className="font-mono text-[--text-primary]">
                    {shippingCost === 0 ? 'Gratuit' : formatPrice(shippingCost)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[--border-default] pt-2">
                  <dt className="font-semibold text-[--text-primary]">
                    Total TTC
                  </dt>
                  <dd className="font-mono text-xl font-semibold text-[--text-primary]">
                    {formatPrice(totalTtc)}
                  </dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-[--radius-md] bg-error-light p-3 text-sm text-error-dark">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={handleSubmit}
              isLoading={createOrderMutation.isPending}
              disabled={!selectedShippingAddress}
            >
              Confirmer la commande
            </Button>

            <p className="mt-4 text-center text-xs text-[--text-muted]">
              En confirmant, vous acceptez nos conditions générales de vente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewAddressForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: {
    type: 'shipping'
    street: string
    city: string
    postalCode: string
    country: string
  }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      type: 'shipping',
      street,
      city,
      postalCode,
      country: 'France',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 border-t border-[--border-default] pt-4"
    >
      <Input
        label="Adresse"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder="123 rue Example"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Code postal"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="75001"
          required
        />
        <Input
          label="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Paris"
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          Ajouter
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
