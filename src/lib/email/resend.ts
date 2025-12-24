import { Resend } from 'resend'
import { getResendApiKey } from '@/lib/cf-bindings'

let resendInstance: Resend | null = null

/**
 * Get Resend client instance
 * Lazily initializes the client on first use
 */
export function getResendClient(): Resend {
  if (!resendInstance) {
    try {
      const apiKey = getResendApiKey()
      resendInstance = new Resend(apiKey)
    } catch {
      // In development, return a mock client if no API key
      console.warn('Resend API key not configured, emails will not be sent')
      resendInstance = new Resend('re_placeholder')
    }
  }
  return resendInstance
}

/**
 * Check if email sending is enabled
 */
export function isEmailEnabled(): boolean {
  try {
    const apiKey = getResendApiKey()
    return apiKey !== '' && !apiKey.startsWith('re_placeholder')
  } catch {
    return false
  }
}

export const FROM_EMAIL = 'Boom Informatique <noreply@boom-informatique.com>'
export const COMPANY_NAME = 'Boom Informatique'
export const COMPANY_ADDRESS = '123 Rue du Commerce, 75001 Paris'
export const COMPANY_PHONE = '01 23 45 67 89'
export const COMPANY_EMAIL = 'contact@boom-informatique.com'
