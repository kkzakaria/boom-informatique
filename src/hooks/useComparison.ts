import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import {
  comparisonStore,
  hydrateComparison,
  addToComparison,
  removeFromComparison,
  toggleComparison,
  clearComparison,
  getComparisonInfo,
  type ComparisonProduct,
} from '@/stores/comparison'

/**
 * Hook for managing product comparison
 */
export function useComparison() {
  const state = useStore(comparisonStore)

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!state.isHydrated) {
      hydrateComparison()
    }
  }, [state.isHydrated])

  const info = getComparisonInfo(state.products)

  const isProductInComparison = (productId: number): boolean => {
    return state.products.some((p) => p.id === productId)
  }

  const add = (product: ComparisonProduct): boolean => {
    return addToComparison(product)
  }

  const remove = (productId: number) => {
    removeFromComparison(productId)
  }

  const toggle = (product: ComparisonProduct): boolean => {
    return toggleComparison(product)
  }

  const clear = () => {
    clearComparison()
  }

  return {
    // State
    products: state.products,
    isHydrated: state.isHydrated,
    count: info.count,
    isFull: info.isFull,
    isEmpty: info.isEmpty,
    maxItems: info.maxItems,

    // Actions
    add,
    remove,
    toggle,
    clear,
    isProductInComparison,
  }
}
