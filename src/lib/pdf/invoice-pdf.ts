import { jsPDF } from 'jspdf'
import {
  addCompanyHeader,
  addCustomerInfo,
  addDocumentInfo,
  addItemsTable,
  addTotals,
  addFooter,
  addNotes,
  downloadPdf,
  COMPANY_INFO,
} from './common'

interface InvoiceItem {
  description: string
  reference?: string
  quantity: number
  unitPrice: number
  discount?: number
  total: number
}

interface InvoiceCustomer {
  name: string
  company?: string
  address?: string
  city?: string
  postalCode?: string
  email: string
}

interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  date: Date
  dueDate?: Date
  customer: InvoiceCustomer
  items: InvoiceItem[]
  subtotalHt: number
  discountAmount?: number
  shippingCost?: number
  taxAmount: number
  totalTtc: number
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'refunded'
  notes?: string
}

/**
 * Get payment method label in French
 */
function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    card: 'Carte bancaire',
    bank_transfer: 'Virement bancaire',
    cash: 'Espèces',
    check: 'Chèque',
  }
  return labels[method] || method
}

/**
 * Get payment status label in French
 */
function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    refunded: 'Remboursée',
  }
  return labels[status] || status
}

/**
 * Generate an invoice PDF document
 */
export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const hasDiscount = data.items.some((item) => item.discount && item.discount > 0)

  // Header
  let yPosition = addCompanyHeader(doc)

  // Customer info
  yPosition = addCustomerInfo(doc, data.customer, yPosition)

  // Document info with additional fields
  const additionalInfo = [
    { label: 'Commande', value: `#${data.orderNumber}` },
    { label: 'Paiement', value: getPaymentMethodLabel(data.paymentMethod) },
    { label: 'Statut', value: getPaymentStatusLabel(data.paymentStatus) },
  ]

  if (data.dueDate) {
    additionalInfo.push({ label: 'Échéance', value: data.dueDate.toLocaleDateString('fr-FR') })
  }

  yPosition = addDocumentInfo(doc, 'FACTURE', data.invoiceNumber, data.date, yPosition, additionalInfo)

  // Items table
  yPosition = addItemsTable(doc, data.items, yPosition, hasDiscount)

  // Add shipping if present
  if (data.shippingCost && data.shippingCost > 0) {
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Frais de livraison :', pageWidth - 75, yPosition, { align: 'right' })
    doc.setTextColor(31, 41, 55)
    doc.text(
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.shippingCost),
      pageWidth - 20,
      yPosition,
      { align: 'right' }
    )
    yPosition += 8
  }

  // Totals
  yPosition = addTotals(
    doc,
    {
      subtotalHt: data.subtotalHt,
      discount: data.discountAmount,
      taxAmount: data.taxAmount,
      totalTtc: data.totalTtc,
    },
    yPosition
  )

  // Notes
  if (data.notes) {
    yPosition = addNotes(doc, data.notes, yPosition)
  }

  // Legal mentions
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(107, 114, 128)

  const legalMentions = [
    `${COMPANY_INFO.name} - SIRET: ${COMPANY_INFO.siret} - TVA Intracommunautaire: ${COMPANY_INFO.tva}`,
    'En cas de retard de paiement, une pénalité de 3 fois le taux d\'intérêt légal sera appliquée.',
    'Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40€.',
  ]

  // Check if we need a new page
  const pageHeight = doc.internal.pageSize.getHeight()
  if (yPosition + 30 > pageHeight - 30) {
    doc.addPage()
    yPosition = 30
  }

  legalMentions.forEach((mention, index) => {
    const splitText = doc.splitTextToSize(mention, pageWidth - 40)
    doc.text(splitText, 20, yPosition + index * 10)
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc
}

/**
 * Download invoice as PDF
 */
export function downloadInvoicePdf(data: InvoiceData): void {
  const doc = generateInvoicePdf(data)
  downloadPdf(doc, `facture-${data.invoiceNumber}.pdf`)
}

/**
 * Get invoice PDF as blob for email attachment
 */
export function getInvoicePdfBlob(data: InvoiceData): Blob {
  const doc = generateInvoicePdf(data)
  return doc.output('blob')
}

/**
 * Get invoice PDF as base64 for API transmission
 */
export function getInvoicePdfBase64(data: InvoiceData): string {
  const doc = generateInvoicePdf(data)
  return doc.output('datauristring')
}
