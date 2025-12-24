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
  formatDateFr,
} from './common'

interface QuoteItem {
  description: string
  reference?: string
  quantity: number
  unitPrice: number
  discount?: number
  total: number
}

interface QuoteCustomer {
  name: string
  company?: string
  address?: string
  city?: string
  postalCode?: string
  email: string
}

interface QuoteData {
  quoteNumber: string
  date: Date
  validUntil: Date
  customer: QuoteCustomer
  items: QuoteItem[]
  subtotalHt: number
  discountAmount?: number
  taxAmount: number
  totalHt: number
  totalTtc: number
  notes?: string
}

/**
 * Generate a quote PDF document
 */
export function generateQuotePdf(data: QuoteData): jsPDF {
  const doc = new jsPDF()
  const hasDiscount = data.items.some((item) => item.discount && item.discount > 0)

  // Header
  let yPosition = addCompanyHeader(doc)

  // Customer info
  yPosition = addCustomerInfo(doc, data.customer, yPosition)

  // Document info
  yPosition = addDocumentInfo(doc, 'DEVIS', data.quoteNumber, data.date, yPosition, [
    { label: 'Valide jusqu\'au', value: formatDateFr(data.validUntil) },
  ])

  // Items table
  yPosition = addItemsTable(doc, data.items, yPosition, hasDiscount)

  // Totals
  yPosition = addTotals(
    doc,
    {
      subtotalHt: data.subtotalHt,
      discount: data.discountAmount,
      taxAmount: data.taxAmount,
      totalHt: data.totalHt,
      totalTtc: data.totalTtc,
    },
    yPosition
  )

  // Notes
  if (data.notes) {
    yPosition = addNotes(doc, data.notes, yPosition)
  }

  // Terms and conditions
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(107, 114, 128)

  const terms = [
    'Conditions de règlement : À la commande par CB, virement ou chèque.',
    'Ce devis est valable 30 jours à compter de sa date d\'émission.',
    'Les prix sont exprimés en euros hors taxes (HT). TVA applicable : 20%.',
  ]

  terms.forEach((term, index) => {
    doc.text(term, 20, yPosition + index * 5)
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
 * Download quote as PDF
 */
export function downloadQuotePdf(data: QuoteData): void {
  const doc = generateQuotePdf(data)
  downloadPdf(doc, `devis-${data.quoteNumber}.pdf`)
}

/**
 * Get quote PDF as blob for email attachment
 */
export function getQuotePdfBlob(data: QuoteData): Blob {
  const doc = generateQuotePdf(data)
  return doc.output('blob')
}

/**
 * Get quote PDF as base64 for API transmission
 */
export function getQuotePdfBase64(data: QuoteData): string {
  const doc = generateQuotePdf(data)
  return doc.output('datauristring')
}
