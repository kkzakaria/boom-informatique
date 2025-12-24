import { useAuth } from './useAuth'

export interface ProPricingContext {
  isPro: boolean
  isValidatedPro: boolean
  showHtPrice: boolean
  discountRate: number
  calculateDiscountedPrice: (priceHt: number) => number
  getDisplayPrice: (priceHt: number, priceTtc: number) => {
    price: number
    isHt: boolean
    discountedPrice?: number
    hasDiscount: boolean
  }
}

/**
 * Hook for B2B pricing logic
 * - Shows HT prices for validated pro users
 * - Applies discount rate if set
 */
export function useProPricing(): ProPricingContext {
  const { user, isPro, isValidatedPro, discountRate } = useAuth()

  const showHtPrice = Boolean(isValidatedPro)

  const calculateDiscountedPrice = (priceHt: number): number => {
    if (!discountRate || discountRate <= 0) return priceHt
    return priceHt * (1 - discountRate / 100)
  }

  const getDisplayPrice = (priceHt: number, priceTtc: number) => {
    if (showHtPrice) {
      const discountedPrice = calculateDiscountedPrice(priceHt)
      const hasDiscount = discountRate > 0 && discountedPrice < priceHt

      return {
        price: priceHt,
        isHt: true,
        discountedPrice: hasDiscount ? discountedPrice : undefined,
        hasDiscount,
      }
    }

    return {
      price: priceTtc,
      isHt: false,
      hasDiscount: false,
    }
  }

  return {
    isPro,
    isValidatedPro: Boolean(isValidatedPro),
    showHtPrice,
    discountRate,
    calculateDiscountedPrice,
    getDisplayPrice,
  }
}
