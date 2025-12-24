import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserById,
  validateProAccount,
  rejectProAccount,
  updateUserDiscount,
  updateUserVatNumber,
} from '@/server/admin/users'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, ProBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  Percent,
  Receipt,
  Save,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin/clients/$userId')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'user', params.userId],
      queryFn: () => getUserById(Number(params.userId)),
    })
  },
  component: UserDetailPage,
})

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-warning-light text-warning-dark' },
  confirmed: { label: 'Confirmée', color: 'bg-info-light text-info-dark' },
  preparing: { label: 'Préparation', color: 'bg-info-light text-info-dark' },
  ready: { label: 'Prête', color: 'bg-success-light text-success-dark' },
  shipped: { label: 'Expédiée', color: 'bg-primary-100 text-primary-700' },
  delivered: { label: 'Livrée', color: 'bg-success-light text-success-dark' },
  paid: { label: 'Payée', color: 'bg-success-light text-success-dark' },
  cancelled: { label: 'Annulée', color: 'bg-error-light text-error-dark' },
}

function UserDetailPage() {
  const params = Route.useParams()
  const queryClient = useQueryClient()

  const { data: user } = useSuspenseQuery({
    queryKey: ['admin', 'user', params.userId],
    queryFn: () => getUserById(Number(params.userId)),
  })

  const [discountRate, setDiscountRate] = useState(String(user.discountRate || 0))
  const [vatNumber, setVatNumber] = useState(user.vatNumber || '')

  const validateMutation = useMutation({
    mutationFn: () => validateProAccount(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', params.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingPro'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectProAccount(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', params.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingPro'] })
    },
  })

  const discountMutation = useMutation({
    mutationFn: (rate: number) => updateUserDiscount({ userId: user.id, discountRate: rate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', params.userId] })
    },
  })

  const vatMutation = useMutation({
    mutationFn: (vat: string) => updateUserVatNumber({ userId: user.id, vatNumber: vat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', params.userId] })
    },
  })

  const handleSaveDiscount = () => {
    const rate = parseFloat(discountRate)
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      discountMutation.mutate(rate)
    }
  }

  const handleSaveVat = () => {
    vatMutation.mutate(vatNumber)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/clients">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </h1>
            {user.role === 'pro' && <ProBadge />}
            {user.role === 'pro' && !user.isValidated && (
              <Badge variant="warning">En attente de validation</Badge>
            )}
          </div>
          <p className="mt-1 text-[--text-muted]">
            Client depuis{' '}
            {user.createdAt &&
              new Date(user.createdAt).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
          </p>
        </div>

        {/* Pro validation actions */}
        {user.role === 'pro' && !user.isValidated && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => validateMutation.mutate()}
              isLoading={validateMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Valider le compte
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Rejeter cette demande ?')) {
                  rejectMutation.mutate()
                }
              }}
              isLoading={rejectMutation.isPending}
            >
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Info */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">
              Informations de contact
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  <Mail className="h-5 w-5 text-[--text-muted]" />
                </div>
                <div>
                  <p className="text-sm text-[--text-muted]">Email</p>
                  <p className="font-medium text-[--text-primary]">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  <Phone className="h-5 w-5 text-[--text-muted]" />
                </div>
                <div>
                  <p className="text-sm text-[--text-muted]">Téléphone</p>
                  <p className="font-medium text-[--text-primary]">
                    {user.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  <User className="h-5 w-5 text-[--text-muted]" />
                </div>
                <div>
                  <p className="text-sm text-[--text-muted]">Nom complet</p>
                  <p className="font-medium text-[--text-primary]">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'Non renseigné'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  <Calendar className="h-5 w-5 text-[--text-muted]" />
                </div>
                <div>
                  <p className="text-sm text-[--text-muted]">Inscription</p>
                  <p className="font-medium text-[--text-primary]">
                    {user.createdAt &&
                      new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Info */}
          {user.role === 'pro' && (
            <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
              <h2 className="font-semibold text-[--text-primary]">
                Informations professionnelles
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pro-badge/10">
                    <Building2 className="h-5 w-5 text-pro-badge" />
                  </div>
                  <div>
                    <p className="text-sm text-[--text-muted]">Entreprise</p>
                    <p className="font-medium text-[--text-primary]">
                      {user.companyName || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pro-badge/10">
                    <Receipt className="h-5 w-5 text-pro-badge" />
                  </div>
                  <div>
                    <p className="text-sm text-[--text-muted]">SIRET</p>
                    <p className="font-mono font-medium text-[--text-primary]">
                      {user.siret || 'Non renseigné'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="mt-6 space-y-4 border-t border-[--border-default] pt-6">
                <div>
                  <label className="text-sm font-medium text-[--text-secondary]">
                    Taux de remise (%)
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveDiscount}
                      isLoading={discountMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[--text-secondary]">
                    N° TVA intracommunautaire
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="FR12345678901"
                      className="w-48"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveVat}
                      isLoading={vatMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">Adresses</h2>
            {user.addresses.length === 0 ? (
              <p className="mt-4 text-[--text-muted]">Aucune adresse enregistrée</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {user.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-lg border border-[--border-default] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[--text-muted]" />
                      <span className="text-sm font-medium text-[--text-secondary]">
                        {address.type === 'billing' ? 'Facturation' : 'Livraison'}
                      </span>
                      {address.isDefault && (
                        <Badge variant="primary" size="sm">
                          Par défaut
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-[--text-primary]">
                      <p>{address.street}</p>
                      <p>
                        {address.postalCode} {address.city}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[--text-primary]">
                Commandes récentes
              </h2>
              <span className="text-sm text-[--text-muted]">
                {user.ordersCount} commande{user.ordersCount > 1 ? 's' : ''} au total
              </span>
            </div>
            {user.recentOrders.length === 0 ? (
              <p className="mt-4 text-[--text-muted]">Aucune commande</p>
            ) : (
              <div className="mt-4 divide-y divide-[--border-default]">
                {user.recentOrders.map((order) => {
                  const status = statusLabels[order.status] || {
                    label: order.status,
                    color: 'bg-surface-100',
                  }

                  return (
                    <Link
                      key={order.id}
                      to="/admin/commandes/$orderId"
                      params={{ orderId: String(order.id) }}
                      className="flex items-center gap-4 py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
                    >
                      <Package className="h-5 w-5 text-[--text-muted]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-[--text-muted]">
                          {order.createdAt &&
                            new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="font-mono font-semibold">
                        {formatPrice(order.totalTtc)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5">
            <h2 className="font-semibold text-[--text-primary]">Résumé</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[--text-muted]">Type de compte</span>
                <span className="font-medium text-[--text-primary]">
                  {user.role === 'pro' ? 'Professionnel' : 'Particulier'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[--text-muted]">Statut</span>
                {user.role === 'pro' ? (
                  user.isValidated ? (
                    <Badge variant="success">Validé</Badge>
                  ) : (
                    <Badge variant="warning">En attente</Badge>
                  )
                ) : (
                  <Badge variant="success">Actif</Badge>
                )}
              </div>
              {user.role === 'pro' && (
                <div className="flex items-center justify-between">
                  <span className="text-[--text-muted]">Remise</span>
                  <span className="font-mono font-medium text-[--text-primary]">
                    {user.discountRate || 0}%
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[--text-muted]">Commandes</span>
                <span className="font-medium text-[--text-primary]">
                  {user.ordersCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
