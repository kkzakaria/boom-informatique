import { Store } from '@tanstack/store'

export interface CartItem {
  productId: number
  quantity: number
  name: string
  slug: string
  priceTtc: number
  priceHt: number
  imageUrl: string | null
  stockQuantity: number
}

export interface CartState {
  items: CartItem[]
  isHydrated: boolean
}

const CART_STORAGE_KEY = 'boom-cart'

function loadFromStorage(): CartItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
}

export const cartStore = new Store<CartState>({
  items: [],
  isHydrated: false,
})

/**
 * Hydrate cart from localStorage (call on client mount)
 */
export function hydrateCart() {
  const items = loadFromStorage()
  cartStore.setState((state) => ({
    ...state,
    items,
    isHydrated: true,
  }))
}

/**
 * Add item to cart
 */
export function addToCart(item: CartItem) {
  cartStore.setState((state) => {
    const existingIndex = state.items.findIndex(
      (i) => i.productId === item.productId
    )

    let newItems: CartItem[]

    if (existingIndex >= 0) {
      // Update existing item
      newItems = state.items.map((i, index) =>
        index === existingIndex
          ? {
              ...i,
              quantity: Math.min(
                i.quantity + item.quantity,
                i.stockQuantity
              ),
            }
          : i
      )
    } else {
      // Add new item
      newItems = [...state.items, item]
    }

    saveToStorage(newItems)
    return { ...state, items: newItems }
  })
}

/**
 * Update item quantity
 */
export function updateCartItemQuantity(productId: number, quantity: number) {
  cartStore.setState((state) => {
    const newItems = state.items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.stockQuantity) }
          : item
      )
      .filter((item) => item.quantity > 0)

    saveToStorage(newItems)
    return { ...state, items: newItems }
  })
}

/**
 * Remove item from cart
 */
export function removeFromCart(productId: number) {
  cartStore.setState((state) => {
    const newItems = state.items.filter((i) => i.productId !== productId)
    saveToStorage(newItems)
    return { ...state, items: newItems }
  })
}

/**
 * Clear entire cart
 */
export function clearCart() {
  cartStore.setState((state) => {
    saveToStorage([])
    return { ...state, items: [] }
  })
}

/**
 * Get cart totals
 */
export function getCartTotals(items: CartItem[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalTtc = items.reduce(
    (sum, item) => sum + item.priceTtc * item.quantity,
    0
  )
  const subtotalHt = items.reduce(
    (sum, item) => sum + item.priceHt * item.quantity,
    0
  )
  const taxAmount = subtotalTtc - subtotalHt

  return {
    itemCount,
    subtotalTtc,
    subtotalHt,
    taxAmount,
  }
}

/**
 * Replace cart items (used when syncing with server)
 */
export function setCartItems(items: CartItem[]) {
  cartStore.setState((state) => {
    saveToStorage(items)
    return { ...state, items }
  })
}
