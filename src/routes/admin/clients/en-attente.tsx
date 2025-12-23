import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPendingProAccounts,
  validateProAccount,
  rejectProAccount,
} from '@/server/admin/users'
import { Button } from '@/components/ui/Button'
import { ProBadge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin/clients/en-attente')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ['admin', 'pendingPro'],
      queryFn: () => getPendingProAccounts(),
    })
  },
  component: PendingProPage,
})

function PendingProPage() {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<number | null>(null)

  const { data: pendingAccounts } = useSuspenseQuery({
    queryKey: ['admin', 'pendingPro'],
    queryFn: () => getPendingProAccounts(),
  })

  const validateMutation = useMutation({
    mutationFn: (userId: number) => validateProAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingPro'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setProcessingId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => rejectProAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingPro'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setProcessingId(null)
    },
  })

  const handleValidate = (userId: number) => {
    setProcessingId(userId)
    validateMutation.mutate(userId)
  }

  const handleReject = (userId: number) => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir rejeter cette demande ? Le compte sera converti en compte particulier.'
      )
    ) {
      setProcessingId(userId)
      rejectMutation.mutate(userId)
    }
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
        <div>
          <h1 className="font-display text-2xl font-semibold text-[--text-primary]">
            Validations en attente
          </h1>
          <p className="mt-1 text-[--text-muted]">
            {pendingAccounts.length} demande
            {pendingAccounts.length > 1 ? 's' : ''} en attente
          </p>
        </div>
      </div>

      {/* List */}
      {pendingAccounts.length === 0 ? (
        <div className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
            <CheckCircle2 className="h-8 w-8 text-success-dark" />
          </div>
          <h2 className="mt-4 font-semibold text-[--text-primary]">
            Aucune demande en attente
          </h2>
          <p className="mt-2 text-[--text-muted]">
            Toutes les demandes de compte professionnel ont été traitées.
          </p>
          <Link to="/admin/clients">
            <Button variant="outline" className="mt-6">
              Retour aux clients
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[--text-primary]">
                        {account.firstName && account.lastName
                          ? `${account.firstName} ${account.lastName}`
                          : 'Nom non renseigné'}
                      </h3>
                      <ProBadge />
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-[--text-muted]">
                        <Mail className="h-4 w-4" />
                        {account.email}
                      </div>
                      {account.companyName && (
                        <div className="flex items-center gap-2 text-sm text-[--text-muted]">
                          <Building2 className="h-4 w-4" />
                          {account.companyName}
                          {account.siret && (
                            <span className="font-mono text-xs">
                              (SIRET: {account.siret})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-[--text-muted]">
                        <Calendar className="h-4 w-4" />
                        Inscrit le{' '}
                        {account.createdAt &&
                          new Date(account.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate(account.id)}
                    disabled={processingId === account.id}
                    isLoading={
                      processingId === account.id && validateMutation.isPending
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Valider
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(account.id)}
                    disabled={processingId === account.id}
                    isLoading={
                      processingId === account.id && rejectMutation.isPending
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
