import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { StarRatingInput } from './StarRatingInput'
import { createReview, updateReview } from '@/server/reviews'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  productId: number
  existingReview?: {
    id: number
    rating: number
    title: string | null
    content: string | null
  } | null
  onSuccess?: () => void
  className?: string
}

export function ReviewForm({
  productId,
  existingReview,
  onSuccess,
  className,
}: ReviewFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!existingReview

  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState(existingReview?.title || '')
  const [content, setContent] = useState(existingReview?.content || '')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      queryClient.invalidateQueries({ queryKey: ['ratingStats', productId] })
      queryClient.invalidateQueries({ queryKey: ['userReview', productId] })
      setRating(0)
      setTitle('')
      setContent('')
      setError(null)
      onSuccess?.()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      queryClient.invalidateQueries({ queryKey: ['ratingStats', productId] })
      queryClient.invalidateQueries({ queryKey: ['userReview', productId] })
      setError(null)
      onSuccess?.()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Veuillez sélectionner une note')
      return
    }

    if (isEditing && existingReview) {
      updateMutation.mutate({
        data: {
          reviewId: existingReview.id,
          rating,
          title: title || undefined,
          content: content || undefined,
        },
      })
    } else {
      createMutation.mutate({
        data: {
          productId,
          rating,
          title: title || undefined,
          content: content || undefined,
        },
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-[--radius-lg] border border-[--border-default] bg-[--bg-card] p-4',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-[--text-primary] mb-4">
        {isEditing ? 'Modifier votre avis' : 'Donner votre avis'}
      </h3>

      {error && (
        <div className="mb-4 rounded-[--radius-md] bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[--text-primary] mb-2">
          Note *
        </label>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          size="lg"
          disabled={isLoading}
        />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-[--text-primary] mb-2"
        >
          Titre (optionnel)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre avis en quelques mots"
          className={cn(
            'w-full rounded-[--radius-md] border border-[--border-default]',
            'bg-[--bg-card] px-3 py-2 text-sm text-[--text-primary]',
            'placeholder:text-[--text-muted]',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50'
          )}
          disabled={isLoading}
          maxLength={100}
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <label
          htmlFor="review-content"
          className="block text-sm font-medium text-[--text-primary] mb-2"
        >
          Avis détaillé (optionnel)
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          rows={4}
          className={cn(
            'w-full rounded-[--radius-md] border border-[--border-default]',
            'bg-[--bg-card] px-3 py-2 text-sm text-[--text-primary]',
            'placeholder:text-[--text-muted]',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 resize-none'
          )}
          disabled={isLoading}
          maxLength={1000}
        />
      </div>

      {/* Submit */}
      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading
          ? 'Envoi en cours...'
          : isEditing
            ? 'Modifier mon avis'
            : 'Publier mon avis'}
      </Button>
    </form>
  )
}
