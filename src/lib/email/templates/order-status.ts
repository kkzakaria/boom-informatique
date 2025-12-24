import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from '../resend'

type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'delivered' | 'cancelled'

interface OrderStatusData {
  orderNumber: string
  customerName: string
  status: OrderStatus
  shippingMethod: 'pickup' | 'delivery'
  comment?: string
}

const statusConfig: Record<OrderStatus, { label: string; color: string; description: string }> = {
  confirmed: {
    label: 'Confirmée',
    color: '#2563eb',
    description: 'Votre commande a été confirmée et sera traitée dans les plus brefs délais.',
  },
  preparing: {
    label: 'En préparation',
    color: '#f59e0b',
    description: 'Votre commande est en cours de préparation par notre équipe.',
  },
  ready: {
    label: 'Prête',
    color: '#10b981',
    description: 'Votre commande est prête !',
  },
  shipped: {
    label: 'Expédiée',
    color: '#8b5cf6',
    description: 'Votre commande a été expédiée et est en route vers vous.',
  },
  delivered: {
    label: 'Livrée',
    color: '#059669',
    description: 'Votre commande a été livrée. Merci pour votre confiance !',
  },
  cancelled: {
    label: 'Annulée',
    color: '#ef4444',
    description: 'Votre commande a été annulée.',
  },
}

export function generateOrderStatusHtml(data: OrderStatusData): string {
  const { orderNumber, customerName, status, shippingMethod, comment } = data
  const config = statusConfig[status]

  const readyMessage =
    status === 'ready'
      ? shippingMethod === 'pickup'
        ? `<p style="color: #047857; margin: 16px 0 0;">
            Vous pouvez venir la récupérer à notre adresse :<br>
            <strong>${COMPANY_ADDRESS}</strong><br>
            Nos horaires : Lun-Ven 9h-18h, Sam 9h-12h
          </p>`
        : `<p style="color: #047857; margin: 16px 0 0;">
            Elle sera livrée dans les prochaines heures.
          </p>`
      : ''

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
      <h2 style="color: #1f2937; margin-top: 0;">Mise à jour de votre commande</h2>

      <p style="color: #4b5563;">Bonjour ${customerName},</p>

      <p style="color: #4b5563;">
        Le statut de votre commande <strong style="color: #2563eb;">#${orderNumber}</strong> a été mis à jour.
      </p>

      <!-- Status Badge -->
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; padding: 16px 32px; background-color: ${config.color}15; border-radius: 8px; border: 2px solid ${config.color};">
          <span style="font-size: 24px; font-weight: bold; color: ${config.color};">
            ${config.label}
          </span>
        </div>
      </div>

      <!-- Description -->
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="color: #374151; margin: 0;">${config.description}</p>
        ${readyMessage}
      </div>

      ${
        comment
          ? `
      <!-- Comment -->
      <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; margin-top: 24px;">
        <strong style="color: #92400e;">Commentaire :</strong>
        <p style="color: #92400e; margin: 8px 0 0;">${comment}</p>
      </div>
      `
          : ''
      }

      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #6b7280; font-size: 14px;">
          Pour toute question, n'hésitez pas à nous contacter.
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

export function generateOrderStatusText(data: OrderStatusData): string {
  const { orderNumber, customerName, status, comment } = data
  const config = statusConfig[status]

  return `
${COMPANY_NAME}

Mise à jour de votre commande #${orderNumber}

Bonjour ${customerName},

Le statut de votre commande a été mis à jour :

Statut : ${config.label}
${config.description}

${comment ? `Commentaire : ${comment}` : ''}

Pour toute question, contactez-nous :
- Tél : ${COMPANY_PHONE}
- Email : ${COMPANY_EMAIL}

${COMPANY_NAME}
${COMPANY_ADDRESS}
  `.trim()
}
