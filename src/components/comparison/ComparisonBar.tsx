import { Link } from '@tanstack/react-router'
import { X, Scale, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComparison } from '@/hooks/useComparison'
import { Button } from '@/components/ui/Button'

export function ComparisonBar() {
  const { products, count, isEmpty, remove, clear } = useComparison()

  if (isEmpty) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[--border-default] bg-[--bg-card] shadow-lg">
      <div className="container flex items-center gap-4 py-3">
        {/* Products thumbnails */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 text-sm text-[--text-muted]">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Comparer :</span>
          </div>
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative flex-shrink-0"
            >
              <div className="flex items-center gap-2 rounded-lg border border-[--border-default] bg-white p-1.5 pr-3">
                <img
                  src={product.imageUrl || '/placeholder.png'}
                  alt={product.name}
                  className="h-10 w-10 rounded object-contain"
                />
                <span className="max-w-[120px] truncate text-sm font-medium text-[--text-primary]">
                  {product.name}
                </span>
                <button
                  onClick={() => remove(product.id)}
                  className="ml-1 rounded-full p-1 text-[--text-muted] hover:bg-surface-100 hover:text-error"
                  aria-label="Retirer du comparateur"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 4 - count }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden sm:flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[--border-default] text-[--text-muted]"
            >
              <span className="text-xs">+</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-[--text-muted]"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Vider</span>
          </Button>
          <Link to="/comparer">
            <Button variant="primary" size="sm" disabled={count < 2}>
              <Scale className="h-4 w-4" />
              Comparer ({count})
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
