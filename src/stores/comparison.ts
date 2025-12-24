import { Store } from '@tanstack/store'

export interface ComparisonProduct {
  id: number
  name: string
  slug: string
  priceTtc: number
  priceHt: number
  imageUrl: string | null
  brandName: string | null
}

export interface ComparisonState {
  products: ComparisonProduct[]
  isHydrated: boolean
}

const COMPARISON_STORAGE_KEY = 'boom-comparison'
const MAX_COMPARISON_ITEMS = 4

function loadFromStorage(): ComparisonProduct[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveToStorage(products: ComparisonProduct[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(products))
  } catch {
    // Ignore storage errors
  }
}

export const comparisonStore = new Store<ComparisonState>({
  products: [],
  isHydrated: false,
})

/**
 * Hydrate comparison from localStorage (call on client mount)
 */
export function hydrateComparison() {
  const products = loadFromStorage()
  comparisonStore.setState((state) => ({
    ...state,
    products,
    isHydrated: true,
  }))
}

/**
 * Add product to comparison
 */
export function addToComparison(product: ComparisonProduct): boolean {
  let added = false
  comparisonStore.setState((state) => {
    // Check if already in comparison
    if (state.products.some((p) => p.id === product.id)) {
      return state
    }

    // Check if at max capacity
    if (state.products.length >= MAX_COMPARISON_ITEMS) {
      return state
    }

    const newProducts = [...state.products, product]
    saveToStorage(newProducts)
    added = true
    return { ...state, products: newProducts }
  })
  return added
}

/**
 * Remove product from comparison
 */
export function removeFromComparison(productId: number) {
  comparisonStore.setState((state) => {
    const newProducts = state.products.filter((p) => p.id !== productId)
    saveToStorage(newProducts)
    return { ...state, products: newProducts }
  })
}

/**
 * Toggle product in comparison
 */
export function toggleComparison(product: ComparisonProduct): boolean {
  const state = comparisonStore.state
  const isInComparison = state.products.some((p) => p.id === product.id)

  if (isInComparison) {
    removeFromComparison(product.id)
    return false
  } else {
    return addToComparison(product)
  }
}

/**
 * Check if product is in comparison
 */
export function isInComparison(productId: number): boolean {
  return comparisonStore.state.products.some((p) => p.id === productId)
}

/**
 * Clear all products from comparison
 */
export function clearComparison() {
  comparisonStore.setState((state) => {
    saveToStorage([])
    return { ...state, products: [] }
  })
}

/**
 * Get comparison info
 */
export function getComparisonInfo(products: ComparisonProduct[]) {
  return {
    count: products.length,
    isFull: products.length >= MAX_COMPARISON_ITEMS,
    isEmpty: products.length === 0,
    maxItems: MAX_COMPARISON_ITEMS,
  }
}
