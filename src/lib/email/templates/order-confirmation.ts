import { formatPrice } from '@/lib/utils'
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from '../resend'

interface OrderItem {
  productName: string
  productSku: string
  quantity: number
  unitPriceHt: number
  taxRate: number
}

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  shippingMethod: 'pickup' | 'delivery'
  paymentMethod: 'cash' | 'check' | 'transfer'
  items: OrderItem[]
  subtotalHt: number
  taxAmount: number
  shippingCost: number
  totalTtc: number
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
  }
  notes?: string
}

export function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const {
    orderNumber,
    customerName,
    shippingMethod,
    paymentMethod,
    items,
    subtotalHt,
    taxAmount,
    shippingCost,
    totalTtc,
    shippingAddress,
    notes,
  } = data

  const paymentMethodLabels = {
    cash: 'Espèces',
    check: 'Chèque',
    transfer: 'Virement bancaire',
  }

  const shippingMethodLabels = {
    pickup: 'Retrait en magasin',
    delivery: 'Livraison',
  }

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.productName}</strong><br>
          <small style="color: #6b7280;">Réf: ${item.productSku}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unitPriceHt)} HT</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.unitPriceHt * item.quantity * (1 + item.taxRate / 100))}</td>
      </tr>
    `
    )
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
      <h2 style="color: #1f2937; margin-top: 0;">Confirmation de commande</h2>

      <p style="color: #4b5563;">Bonjour ${customerName},</p>

      <p style="color: #4b5563;">
        Nous avons bien reçu votre commande <strong style="color: #2563eb;">#${orderNumber}</strong>.
        Nous vous remercions pour votre confiance !
      </p>

      <!-- Order Details -->
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Détails de la commande</h3>
        <table style="width: 100%;">
          <tr>
            <td style="color: #6b7280;">Mode de livraison :</td>
            <td style="color: #1f2937; text-align: right;"><strong>${shippingMethodLabels[shippingMethod]}</strong></td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Mode de paiement :</td>
            <td style="color: #1f2937; text-align: right;"><strong>${paymentMethodLabels[paymentMethod]}</strong></td>
          </tr>
          ${
            shippingMethod === 'delivery' && shippingAddress
              ? `
          <tr>
            <td style="color: #6b7280;">Adresse de livraison :</td>
            <td style="color: #1f2937; text-align: right;">
              ${shippingAddress.street}<br>
              ${shippingAddress.postalCode} ${shippingAddress.city}
            </td>
          </tr>
          `
              : ''
          }
        </table>
      </div>

      <!-- Items Table -->
      <h3 style="color: #1f2937;">Articles commandés</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produit</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unit.</th>
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
          <tr>
            <td style="padding: 4px 16px; color: #6b7280;">TVA :</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatPrice(taxAmount)}</td>
          </tr>
          ${
            shippingCost > 0
              ? `
          <tr>
            <td style="padding: 4px 16px; color: #6b7280;">Frais de livraison :</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatPrice(shippingCost)}</td>
          </tr>
          `
              : ''
          }
          <tr style="font-size: 18px; font-weight: bold;">
            <td style="padding: 12px 16px 4px; color: #1f2937; border-top: 2px solid #e5e7eb;">Total TTC :</td>
            <td style="padding: 12px 0 4px; color: #2563eb; border-top: 2px solid #e5e7eb;">${formatPrice(totalTtc)}</td>
          </tr>
        </table>
      </div>

      ${
        notes
          ? `
      <!-- Notes -->
      <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
        <strong style="color: #92400e;">Note :</strong>
        <p style="color: #92400e; margin: 8px 0 0;">${notes}</p>
      </div>
      `
          : ''
      }

      <!-- Next Steps -->
      <div style="margin-top: 32px; padding: 24px; background-color: #ecfdf5; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #065f46;">Prochaines étapes</h3>
        ${
          shippingMethod === 'pickup'
            ? `
        <p style="color: #047857; margin-bottom: 0;">
          Votre commande sera prête à être retirée dans nos locaux sous 2 heures ouvrées.
          Nous vous enverrons un email dès qu'elle sera disponible.
        </p>
        `
            : `
        <p style="color: #047857; margin-bottom: 0;">
          Votre commande sera livrée sous 24 à 48 heures ouvrées.
          Nous vous tiendrons informé de l'avancement de la livraison.
        </p>
        `
        }
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

export function generateOrderConfirmationText(data: OrderConfirmationData): string {
  const { orderNumber, customerName, items, totalTtc } = data

  const itemsList = items
    .map((item) => `- ${item.productName} x${item.quantity} : ${formatPrice(item.unitPriceHt * item.quantity)} HT`)
    .join('\n')

  return `
${COMPANY_NAME}

Confirmation de commande #${orderNumber}

Bonjour ${customerName},

Nous avons bien reçu votre commande. Nous vous remercions pour votre confiance !

Articles commandés :
${itemsList}

Total TTC : ${formatPrice(totalTtc)}

Pour toute question, contactez-nous :
- Tél : ${COMPANY_PHONE}
- Email : ${COMPANY_EMAIL}

${COMPANY_NAME}
${COMPANY_ADDRESS}
  `.trim()
}
