import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from '../resend'

interface QuoteItem {
  productName: string
  productSku: string
  quantity: number
  unitPriceHt: number
  discountRate: number
}

interface QuoteSentData {
  quoteNumber: string
  customerName: string
  companyName?: string
  items: QuoteItem[]
  subtotalHt: number
  discountAmount: number
  taxAmount: number
  totalHt: number
  validUntil: Date
  notes?: string
}

export function generateQuoteSentHtml(data: QuoteSentData): string {
  const {
    quoteNumber,
    customerName,
    companyName,
    items,
    subtotalHt,
    discountAmount,
    taxAmount,
    totalHt,
    validUntil,
    notes,
  } = data

  const validUntilFormatted = format(validUntil, 'dd MMMM yyyy', { locale: fr })

  const itemsHtml = items
    .map((item) => {
      const lineTotal = item.unitPriceHt * item.quantity * (1 - item.discountRate / 100)
      return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.productName}</strong><br>
          <small style="color: #6b7280;">Réf: ${item.productSku}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unitPriceHt)} HT</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.discountRate > 0 ? `-${item.discountRate}%` : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(lineTotal)} HT</td>
      </tr>
    `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">${COMPANY_NAME}</h1>
    </div>

    <!-- Content -->
    <div style="background-color: white; padding: 32px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; margin-top: 0;">Votre devis</h2>

      <p style="color: #4b5563;">Bonjour ${customerName}${companyName ? ` (${companyName})` : ''},</p>

      <p style="color: #4b5563;">
        Veuillez trouver ci-dessous votre devis <strong style="color: #2563eb;">#${quoteNumber}</strong>.
      </p>

      <!-- Validity -->
      <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>Validité :</strong> Ce devis est valable jusqu'au <strong>${validUntilFormatted}</strong>.
        </p>
      </div>

      <!-- Items Table -->
      <h3 style="color: #1f2937;">Détail du devis</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produit</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unit.</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Remise</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-top: 24px; text-align: right;">
        <table style="margin-left: auto;">
          <tr>
            <td style="padding: 4px 16px; color: #6b7280;">Sous-total HT :</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatPrice(subtotalHt)}</td>
          </tr>
          ${
            discountAmount > 0
              ? `
          <tr>
            <td style="padding: 4px 16px; color: #10b981;">Remise :</td>
            <td style="padding: 4px 0; color: #10b981;">-${formatPrice(discountAmount)}</td>
          </tr>
          `
              : ''
          }
          <tr style="font-size: 18px; font-weight: bold;">
            <td style="padding: 12px 16px 4px; color: #1f2937; border-top: 2px solid #e5e7eb;">Total HT :</td>
            <td style="padding: 12px 0 4px; color: #2563eb; border-top: 2px solid #e5e7eb;">${formatPrice(totalHt)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 16px; color: #6b7280;">TVA (20%) :</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatPrice(taxAmount)}</td>
          </tr>
          <tr style="font-size: 16px;">
            <td style="padding: 4px 16px; color: #6b7280;">Total TTC :</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatPrice(totalHt + taxAmount)}</td>
          </tr>
        </table>
      </div>

      ${
        notes
          ? `
      <!-- Notes -->
      <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
        <strong style="color: #374151;">Notes :</strong>
        <p style="color: #4b5563; margin: 8px 0 0;">${notes}</p>
      </div>
      `
          : ''
      }

      <!-- CTA -->
      <div style="margin-top: 32px; text-align: center;">
        <p style="color: #4b5563; margin-bottom: 16px;">
          Pour accepter ce devis, connectez-vous à votre espace client ou contactez-nous directement.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">${COMPANY_NAME}</p>
      <p style="margin: 4px 0;">${COMPANY_ADDRESS}</p>
      <p style="margin: 4px 0;">Tél: ${COMPANY_PHONE} | Email: ${COMPANY_EMAIL}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateQuoteSentText(data: QuoteSentData): string {
  const { quoteNumber, customerName, companyName, items, totalHt, validUntil } = data

  const validUntilFormatted = format(validUntil, 'dd MMMM yyyy', { locale: fr })

  const itemsList = items
    .map((item) => `- ${item.productName} x${item.quantity} : ${formatPrice(item.unitPriceHt * item.quantity)} HT`)
    .join('\n')

  return `
${COMPANY_NAME}

Votre devis #${quoteNumber}

Bonjour ${customerName}${companyName ? ` (${companyName})` : ''},

Veuillez trouver ci-dessous votre devis.

Validité : Ce devis est valable jusqu'au ${validUntilFormatted}.

Détail du devis :
${itemsList}

Total HT : ${formatPrice(totalHt)}

Pour accepter ce devis, connectez-vous à votre espace client ou contactez-nous directement.

Pour toute question, contactez-nous :
- Tél : ${COMPANY_PHONE}
- Email : ${COMPANY_EMAIL}

${COMPANY_NAME}
${COMPANY_ADDRESS}
  `.trim()
}
