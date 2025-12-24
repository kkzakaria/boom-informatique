import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE, COMPANY_EMAIL } from '../resend'

interface ProValidationData {
  customerName: string
  companyName: string
  discountRate: number
}

export function generateProValidationHtml(data: ProValidationData): string {
  const { customerName, companyName, discountRate } = data

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
      <h2 style="color: #1f2937; margin-top: 0;">Compte professionnel validé</h2>

      <p style="color: #4b5563;">Bonjour ${customerName},</p>

      <p style="color: #4b5563;">
        Nous avons le plaisir de vous informer que votre compte professionnel pour
        <strong style="color: #2563eb;">${companyName}</strong> a été validé.
      </p>

      <!-- Validation Badge -->
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; padding: 20px 40px; background-color: #ecfdf5; border-radius: 12px; border: 2px solid #10b981;">
          <span style="font-size: 28px;">✓</span>
          <span style="font-size: 20px; font-weight: bold; color: #059669; margin-left: 8px;">
            Compte Pro Activé
          </span>
        </div>
      </div>

      <!-- Benefits -->
      <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Vos avantages professionnels</h3>
        <ul style="color: #4b5563; padding-left: 20px;">
          <li style="margin-bottom: 12px;">
            <strong>Affichage des prix HT :</strong> Tous les prix sont désormais affichés Hors Taxes.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Remise permanente :</strong> Bénéficiez d'une remise de
            <span style="color: #2563eb; font-weight: bold;">${discountRate}%</span> sur l'ensemble du catalogue.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Demande de devis :</strong> Créez des devis personnalisés directement depuis votre espace.
          </li>
          <li style="margin-bottom: 12px;">
            <strong>Paiement différé :</strong> Possibilité de paiement à 30 jours selon conditions.
          </li>
          <li style="margin-bottom: 0;">
            <strong>Export factures :</strong> Téléchargez vos factures au format PDF.
          </li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #4b5563; margin-bottom: 16px;">
          Connectez-vous dès maintenant pour profiter de vos avantages !
        </p>
      </div>

      <!-- Contact -->
      <div style="margin-top: 32px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #1e40af;">Votre conseiller dédié</h4>
        <p style="color: #3b82f6; margin: 0;">
          Pour toute question ou besoin spécifique, notre équipe commerciale est à votre disposition :<br>
          <strong>Tél :</strong> ${COMPANY_PHONE}<br>
          <strong>Email :</strong> ${COMPANY_EMAIL}
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

export function generateProValidationText(data: ProValidationData): string {
  const { customerName, companyName, discountRate } = data

  return `
${COMPANY_NAME}

Compte professionnel validé

Bonjour ${customerName},

Nous avons le plaisir de vous informer que votre compte professionnel pour ${companyName} a été validé.

Vos avantages professionnels :
- Affichage des prix HT
- Remise permanente de ${discountRate}% sur l'ensemble du catalogue
- Demande de devis personnalisés
- Paiement différé (selon conditions)
- Export factures PDF

Connectez-vous dès maintenant pour profiter de vos avantages !

Pour toute question, contactez-nous :
- Tél : ${COMPANY_PHONE}
- Email : ${COMPANY_EMAIL}

${COMPANY_NAME}
${COMPANY_ADDRESS}
  `.trim()
}
