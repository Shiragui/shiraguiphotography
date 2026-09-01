import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib"

interface ContractPdfOptions {
  contractBody: string
  projectName: string
  clientName: string
  clientDate: string
  signerName: string
  signatureImage: string | null  // base64 PNG data URL (drawn) or null (typed)
  signatureType: "drawn" | "typed"
  dateToday: string
}

const MARGIN = 60
const LINE_HEIGHT_BODY = 13.5
const LINE_HEIGHT_SECTION = 16
const FONT_SIZE_BODY = 10
const FONT_SIZE_HEADER = 15
const FONT_SIZE_SECTION = 11
const FONT_SIZE_SIG = 10

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text.trim()) return [""]
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.08, 0.08, 0.08),
) {
  page.drawText(text, { x, y, font, size, color })
}

export async function generateContractPdf(opts: ContractPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold    = await doc.embedFont(StandardFonts.TimesRomanBold)
  const fontItalic  = await doc.embedFont(StandardFonts.TimesRomanItalic)

  const pageWidth  = 612  // US Letter
  const pageHeight = 792
  const contentWidth = pageWidth - MARGIN * 2

  // Split contract body into logical lines, expand them into wrapped lines
  type WrappedLine = { text: string; bold: boolean; separator: boolean; empty: boolean }
  const wrappedLines: WrappedLine[] = []

  for (const raw of opts.contractBody.split("\n")) {
    const isSeparator = /^━+$/.test(raw.trim())
    if (isSeparator) {
      wrappedLines.push({ text: "", bold: false, separator: true, empty: false })
      continue
    }
    if (!raw.trim()) {
      wrappedLines.push({ text: "", bold: false, separator: false, empty: true })
      continue
    }
    // Section headers: lines that are all caps and short, or start with A-Z followed by a period
    const isBold = /^[A-Z][A-Z.\s]{0,50}$/.test(raw.trim()) ||
                   /^[A-Z]\.\s/.test(raw.trim())
    const font = isBold ? fontBold : fontRegular
    const wrapped = wrapLine(raw, font, FONT_SIZE_BODY, contentWidth)
    for (let i = 0; i < wrapped.length; i++) {
      wrappedLines.push({ text: wrapped[i], bold: isBold, separator: false, empty: false })
    }
  }

  // Paginate
  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - MARGIN

  // Title
  const title = "PHOTOGRAPHY SERVICES AGREEMENT"
  const titleW = fontBold.widthOfTextAtSize(title, FONT_SIZE_HEADER)
  drawText(page, title, (pageWidth - titleW) / 2, y, fontBold, FONT_SIZE_HEADER)
  y -= 22

  // Project / client header
  const sub = `${opts.projectName}  ·  ${opts.clientName}  ·  ${opts.dateToday}`
  const subW = fontItalic.widthOfTextAtSize(sub, 9)
  drawText(page, sub, (pageWidth - subW) / 2, y, fontItalic, 9, rgb(0.45, 0.45, 0.45))
  y -= 8

  // Divider under title
  page.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 18

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 80) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - MARGIN
    }
  }

  for (const line of wrappedLines) {
    if (line.separator) {
      ensureSpace(14)
      y -= 5
      page.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.4, color: rgb(0.75, 0.75, 0.75) })
      y -= 9
      continue
    }
    if (line.empty) {
      y -= LINE_HEIGHT_BODY * 0.5
      continue
    }
    ensureSpace(LINE_HEIGHT_BODY)
    const font = line.bold ? fontBold : fontRegular
    const size = line.bold ? FONT_SIZE_SECTION : FONT_SIZE_BODY
    const lh = line.bold ? LINE_HEIGHT_SECTION : LINE_HEIGHT_BODY
    drawText(page, line.text, MARGIN, y, font, size)
    y -= lh
  }

  // Signature section — ensure enough room (200pt), else new page
  const sigHeight = 200
  if (y - sigHeight < MARGIN) {
    page = doc.addPage([pageWidth, pageHeight])
    y = pageHeight - MARGIN
  }

  y -= 12
  page.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  y -= 20

  const col2 = pageWidth / 2 + 10

  // Column headers
  drawText(page, "Photographer", MARGIN, y, fontBold, FONT_SIZE_SIG)
  drawText(page, "Client", col2, y, fontBold, FONT_SIZE_SIG)
  y -= 8

  // Photographer italic signature
  const sigTop = y
  drawText(page, "Shira Gui", MARGIN, sigTop - 4, fontItalic, 16)

  // Client signature — drawn image or typed name, never both
  const sigBoxHeight = 52
  if (opts.signatureType === "drawn" && opts.signatureImage) {
    try {
      const b64 = opts.signatureImage.replace(/^data:image\/png;base64,/, "")
      const imgBytes = Buffer.from(b64, "base64")
      const img = await doc.embedPng(imgBytes)
      // Scale to fit in a 160×44 box
      const maxW = 160, maxH = 44
      const scale = Math.min(maxW / img.width, maxH / img.height)
      const imgW = img.width * scale
      const imgH = img.height * scale
      // Place image top-aligned inside the signature box
      page.drawImage(img, {
        x: col2,
        y: sigTop - imgH,
        width: imgW,
        height: imgH,
      })
    } catch {
      // Fallback: draw typed name if image fails
      drawText(page, opts.signerName, col2, sigTop - 4, fontItalic, 16)
    }
  } else {
    drawText(page, opts.signerName, col2, sigTop - 4, fontItalic, 16)
  }

  y = sigTop - sigBoxHeight

  // Underline below signature areas
  page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: pageWidth / 2 - 10, y: y + 10 }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) })
  page.drawLine({ start: { x: col2, y: y + 10 }, end: { x: pageWidth - MARGIN, y: y + 10 }, thickness: 0.4, color: rgb(0.8, 0.8, 0.8) })
  y -= 6

  // Format client date from YYYY-MM-DD to readable
  const [cy, cm, cd] = opts.clientDate.split("-").map(Number)
  const clientDateFormatted = new Date(cy, (cm || 1) - 1, cd || 1).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })

  drawText(page, "Shira Gui Photography", MARGIN, y, fontRegular, FONT_SIZE_SIG)
  drawText(page, `Printed: ${opts.signerName}`, col2, y, fontRegular, FONT_SIZE_SIG)
  y -= 14

  drawText(page, `Date: ${opts.dateToday}`, MARGIN, y, fontRegular, FONT_SIZE_SIG)
  drawText(page, `Date: ${clientDateFormatted}`, col2, y, fontRegular, FONT_SIZE_SIG)
  y -= 20

  // Photo release note
  const releaseNote = "Photo release: See signed agreement record."
  drawText(page, releaseNote, MARGIN, y, fontItalic, 8.5, rgb(0.5, 0.5, 0.5))
  y -= 20

  // Footer on last page
  page.drawLine({ start: { x: MARGIN, y }, end: { x: pageWidth - MARGIN, y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) })
  y -= 12
  const footer = "This agreement was signed electronically via shiraguiphotography.com"
  const footerW = fontItalic.widthOfTextAtSize(footer, 8)
  drawText(page, footer, (pageWidth - footerW) / 2, y, fontItalic, 8, rgb(0.6, 0.6, 0.6))

  return doc.save()
}
