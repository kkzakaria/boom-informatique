import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Company info
export const COMPANY_INFO = {
  name: 'Boom Informatique',
  address: '123 Rue du Commerce',
  city: '75001 Paris',
  phone: '01 23 45 67 89',
  email: 'contact@boom-informatique.com',
  siret: '123 456 789 00000',
  tva: 'FR12 345678900',
}

/**
 * Format price in EUR
 */
export function formatPriceEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format date in French
 */
export function formatDateFr(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr })
}

/**
 * Add company header to PDF
 */
export function addCompanyHeader(doc: jsPDF): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Company name
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235) // Primary blue
  doc.text(COMPANY_INFO.name, 20, 25)

  // Company details
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128) // Gray
  doc.text(COMPANY_INFO.address, 20, 33)
  doc.text(COMPANY_INFO.city, 20, 38)
  doc.text(`Tél: ${COMPANY_INFO.phone}`, 20, 43)
  doc.text(`Email: ${COMPANY_INFO.email}`, 20, 48)

  // Legal info on the right
  doc.text(`SIRET: ${COMPANY_INFO.siret}`, pageWidth - 60, 33)
  doc.text(`TVA: ${COMPANY_INFO.tva}`, pageWidth - 60, 38)

  // Horizontal line
  doc.setDrawColor(229, 231, 235) // Light gray
  doc.setLineWidth(0.5)
  doc.line(20, 55, pageWidth - 20, 55)

  return 60 // Return Y position after header
}

/**
 * Add customer info block
 */
export function addCustomerInfo(
  doc: jsPDF,
  customer: {
    name: string
    company?: string
    address?: string
    city?: string
    postalCode?: string
    email: string
  },
  yPosition: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55) // Dark gray
  doc.text('CLIENT', pageWidth - 80, yPosition)

  doc.setFont('helvetica', 'normal')
  let y = yPosition + 7

  if (customer.company) {
    doc.setFont('helvetica', 'bold')
    doc.text(customer.company, pageWidth - 80, y)
    doc.setFont('helvetica', 'normal')
    y += 5
  }

  doc.text(customer.name, pageWidth - 80, y)
  y += 5

  if (customer.address) {
    doc.text(customer.address, pageWidth - 80, y)
    y += 5
  }

  if (customer.postalCode && customer.city) {
    doc.text(`${customer.postalCode} ${customer.city}`, pageWidth - 80, y)
    y += 5
  }

  doc.setTextColor(107, 114, 128)
  doc.text(customer.email, pageWidth - 80, y)

  return y + 10
}

/**
 * Add document title and info
 */
export function addDocumentInfo(
  doc: jsPDF,
  title: string,
  docNumber: string,
  date: Date,
  yPosition: number,
  additionalInfo?: { label: string; value: string }[]
): number {
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(title, 20, yPosition)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  let y = yPosition + 10
  doc.text(`N° ${docNumber}`, 20, y)
  y += 5
  doc.text(`Date: ${formatDateFr(date)}`, 20, y)

  if (additionalInfo) {
    additionalInfo.forEach((info) => {
      y += 5
      doc.text(`${info.label}: ${info.value}`, 20, y)
    })
  }

  return y + 15
}

/**
 * Add items table
 */
export function addItemsTable(
  doc: jsPDF,
  items: Array<{
    description: string
    reference?: string
    quantity: number
    unitPrice: number
    discount?: number
    total: number
  }>,
  yPosition: number,
  showDiscount: boolean = false
): number {
  const columns = showDiscount
    ? ['Description', 'Réf.', 'Qté', 'Prix unit. HT', 'Remise', 'Total HT']
    : ['Description', 'Réf.', 'Qté', 'Prix unit. HT', 'Total HT']

  const columnStyles: Record<string, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = showDiscount
    ? {
        0: { cellWidth: 70 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
      }
    : {
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      }

  const rows = items.map((item) => {
    const baseRow = [
      item.description,
      item.reference || '-',
      item.quantity.toString(),
      formatPriceEur(item.unitPrice),
    ]

    if (showDiscount) {
      baseRow.push(item.discount ? `-${item.discount}%` : '-')
    }

    baseRow.push(formatPriceEur(item.total))

    return baseRow
  })

  autoTable(doc, {
    startY: yPosition,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
    },
    columnStyles,
    margin: { left: 20, right: 20 },
  })

  // Get final Y position after table
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
}

/**
 * Add totals section
 */
export function addTotals(
  doc: jsPDF,
  totals: {
    subtotalHt: number
    discount?: number
    taxAmount: number
    totalTtc?: number
    totalHt?: number
  },
  yPosition: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const rightX = pageWidth - 20

  doc.setFontSize(10)
  let y = yPosition

  // Subtotal HT
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Sous-total HT :', rightX - 55, y, { align: 'right' })
  doc.setTextColor(31, 41, 55)
  doc.text(formatPriceEur(totals.subtotalHt), rightX, y, { align: 'right' })
  y += 6

  // Discount if present
  if (totals.discount && totals.discount > 0) {
    doc.setTextColor(16, 185, 129) // Green
    doc.text('Remise :', rightX - 55, y, { align: 'right' })
    doc.text(`-${formatPriceEur(totals.discount)}`, rightX, y, { align: 'right' })
    y += 6
  }

  // TVA
  doc.setTextColor(107, 114, 128)
  doc.text('TVA (20%) :', rightX - 55, y, { align: 'right' })
  doc.setTextColor(31, 41, 55)
  doc.text(formatPriceEur(totals.taxAmount), rightX, y, { align: 'right' })
  y += 8

  // Line
  doc.setDrawColor(229, 231, 235)
  doc.line(rightX - 60, y, rightX, y)
  y += 8

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')

  if (totals.totalHt !== undefined) {
    // For quotes, show Total HT
    doc.setTextColor(31, 41, 55)
    doc.text('Total HT :', rightX - 55, y, { align: 'right' })
    doc.setTextColor(37, 99, 235)
    doc.text(formatPriceEur(totals.totalHt), rightX, y, { align: 'right' })
    y += 8

    if (totals.totalTtc !== undefined) {
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.text('Total TTC :', rightX - 55, y, { align: 'right' })
      doc.setTextColor(31, 41, 55)
      doc.text(formatPriceEur(totals.totalTtc), rightX, y, { align: 'right' })
    }
  } else if (totals.totalTtc !== undefined) {
    // For invoices, show Total TTC
    doc.setTextColor(31, 41, 55)
    doc.text('Total TTC :', rightX - 55, y, { align: 'right' })
    doc.setTextColor(37, 99, 235)
    doc.text(formatPriceEur(totals.totalTtc), rightX, y, { align: 'right' })
  }

  return y + 15
}

/**
 * Add footer with page numbers
 */
export function addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175) // Light gray

  // Page number
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
    align: 'center',
  })

  // Legal text
  doc.text(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.city}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  )
}

/**
 * Add notes section
 */
export function addNotes(doc: jsPDF, notes: string, yPosition: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text('Notes :', 20, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)

  const splitNotes = doc.splitTextToSize(notes, 170)
  doc.text(splitNotes, 20, yPosition + 7)

  return yPosition + 7 + splitNotes.length * 5
}

/**
 * Create and download PDF
 */
export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
