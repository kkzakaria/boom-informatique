import { useStore } from '@tanstack/react-store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  cartStore,
  hydrateCart,
  addToCart as addToLocalCart,
  updateCartItemQuantity as updateLocalQuantity,
  removeFromCart as removeFromLocalCart,
  clearCart as clearLocalCart,
  setCartItems,
  getCartTotals,
  type CartItem,
} from '@/stores/cart'
import {
  getCart,
  addToCartServer,
  updateCartItem,
  removeFromCartServer,
  clearCartServer,
} from '@/server/cart'
import { useAuth } from './useAuth'

const CART_QUERY_KEY = ['cart']

/**
 * Unified cart hook that handles both local and server cart
 * - For guests: uses local store with localStorage persistence
 * - For authenticated users: syncs with server
 */
export function useCart() {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuth()
  const localCart = useStore(cartStore)

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    if (!localCart.isHydrated) {
      hydrateCart()
    }
  }, [localCart.isHydrated])

  // Query server cart for authenticated users
  const { data: serverCart, isLoading: isServerLoading } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCart(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Use server cart for authenticated users, local cart otherwise
  const items = isAuthenticated
    ? serverCart?.items || []
    : localCart.items

  const totals = getCartTotals(items)

  // Add to cart mutation
  const addMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      if (isAuthenticated) {
        return addToCartServer({
          data: { productId: item.productId, quantity: item.quantity },
        })
      } else {
        addToLocalCart(item)
        return localCart.items
      }
    },
    onSuccess: (newItems) => {
      if (isAuthenticated && newItems) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          id: serverCart?.id,
          items: newItems,
        })
      }
    },
  })

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: number
      quantity: number
    }) => {
      if (isAuthenticated) {
        return updateCartItem({ data: { productId, quantity } })
      } else {
        updateLocalQuantity(productId, quantity)
        return localCart.items
      }
    },
    onSuccess: (newItems) => {
      if (isAuthenticated && newItems) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          id: serverCart?.id,
          items: newItems,
        })
      }
    },
  })

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (isAuthenticated) {
        return removeFromCartServer({ data: productId })
      } else {
        removeFromLocalCart(productId)
        return localCart.items
      }
    },
    onSuccess: (newItems) => {
      if (isAuthenticated && newItems) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          id: serverCart?.id,
          items: newItems,
        })
      }
    },
  })

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return clearCartServer()
      } else {
        clearLocalCart()
        return []
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          id: serverCart?.id,
          items: [],
        })
      }
    },
  })

  return {
    // State
    items,
    itemCount: totals.itemCount,
    subtotalTtc: totals.subtotalTtc,
    subtotalHt: totals.subtotalHt,
    taxAmount: totals.taxAmount,
    isEmpty: items.length === 0,
    isLoading: isAuthenticated && isServerLoading,
    isHydrated: localCart.isHydrated,

    // Actions
    addToCart: (item: CartItem) => addMutation.mutateAsync(item),
    updateQuantity: (productId: number, quantity: number) =>
      updateMutation.mutateAsync({ productId, quantity }),
    removeItem: (productId: number) => removeMutation.mutateAsync(productId),
    clearCart: () => clearMutation.mutateAsync(),

    // Mutation states
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    isClearing: clearMutation.isPending,
  }
}

/**
 * Helper to prepare cart item for adding
 */
export function prepareCartItem(product: {
  id: number
  name: string
  slug: string
  priceTtc: number
  priceHt: number
  stockQuantity: number
  images?: Array<{ url: string; isMain?: boolean | null }>
}, quantity = 1): CartItem {
  return {
    productId: product.id,
    quantity,
    name: product.name,
    slug: product.slug,
    priceTtc: product.priceTtc,
    priceHt: product.priceHt,
    imageUrl: product.images?.find((i) => i.isMain)?.url || product.images?.[0]?.url || null,
    stockQuantity: product.stockQuantity,
  }
}
