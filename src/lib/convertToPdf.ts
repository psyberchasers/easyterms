import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mammoth from "mammoth";

/**
 * Sanitize text for WinAnsi encoding (pdf-lib's StandardFonts limitation)
 * Removes or replaces characters that WinAnsi cannot encode
 */
function sanitizeTextForWinAnsi(text: string): string {
  // Replace common problematic characters
  let sanitized = text
    // Form feed and other control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    // Smart quotes and apostrophes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Em/en dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Bullet points
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    // Non-breaking space
    .replace(/\u00A0/g, ' ')
    // Other common problematic Unicode characters
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, ' ')
    // Zero-width characters
    .replace(/[\uFEFF\u200B-\u200D]/g, '');

  // Filter out any remaining characters outside WinAnsi range (basic Latin + Latin-1 Supplement)
  // WinAnsi supports: 0x20-0x7E (basic ASCII printable) and 0xA0-0xFF (Latin-1 Supplement)
  sanitized = sanitized.split('').map(char => {
    const code = char.charCodeAt(0);
    // Allow newlines, tabs, and printable characters in WinAnsi range
    if (char === '\n' || char === '\r' || char === '\t') return char;
    if (code >= 0x20 && code <= 0x7E) return char;
    if (code >= 0xA0 && code <= 0xFF) return char;
    // Replace anything else with a space
    return ' ';
  }).join('');

  return sanitized;
}

/**
 * Convert TXT or DOCX files to PDF format
 */
export async function convertToPdf(file: File): Promise<{ pdfBuffer: Uint8Array; originalName: string }> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Already a PDF
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    return { pdfBuffer: new Uint8Array(buffer), originalName: file.name };
  }

  // TXT file
  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    const text = await file.text();
    const pdfBuffer = await textToPdf(text, file.name);
    return { pdfBuffer, originalName: file.name.replace(/\.txt$/i, ".pdf") };
  }

  // DOCX file
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const pdfBuffer = await textToPdf(result.value, file.name);
    return { pdfBuffer, originalName: file.name.replace(/\.docx$/i, ".pdf") };
  }

  // DOC file (older format) - extract as text
  if (
    fileType === "application/msword" ||
    fileName.endsWith(".doc")
  ) {
    // For .doc files, mammoth may not work well, try basic text extraction
    const buffer = await file.arrayBuffer();
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      const pdfBuffer = await textToPdf(result.value, file.name);
      return { pdfBuffer, originalName: file.name.replace(/\.doc$/i, ".pdf") };
    } catch {
      // Fallback: try to read as text
      const text = await file.text();
      const pdfBuffer = await textToPdf(text, file.name);
      return { pdfBuffer, originalName: file.name.replace(/\.doc$/i, ".pdf") };
    }
  }

  // Unsupported format - return as-is (shouldn't happen)
  const buffer = await file.arrayBuffer();
  return { pdfBuffer: new Uint8Array(buffer), originalName: file.name };
}

/**
 * Convert plain text to a PDF document
 */
async function textToPdf(text: string, sourceFileName: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const margin = 50;
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const maxWidth = pageWidth - margin * 2;

  // Sanitize text for WinAnsi encoding
  const sanitizedText = sanitizeTextForWinAnsi(text);

  // Split text into lines and wrap
  const lines = sanitizedText.split("\n");
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      wrappedLines.push("");
      continue;
    }

    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  // Calculate lines per page
  const contentHeight = pageHeight - margin * 2 - 30; // Leave room for header
  const linesPerPage = Math.floor(contentHeight / lineHeight);

  // Create pages
  let lineIndex = 0;
  let pageNum = 1;

  while (lineIndex < wrappedLines.length) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Add header on first page
    if (pageNum === 1) {
      page.drawText(`Converted from: ${sourceFileName}`, {
        x: margin,
        y: y,
        size: 9,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 25;
    }

    // Draw lines
    const pageLinesCount = pageNum === 1 ? linesPerPage - 2 : linesPerPage;

    for (let i = 0; i < pageLinesCount && lineIndex < wrappedLines.length; i++) {
      const line = wrappedLines[lineIndex];

      if (line.trim()) {
        page.drawText(line, {
          x: margin,
          y: y,
          size: fontSize,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      y -= lineHeight;
      lineIndex++;
    }

    // Add page number
    const pageNumText = `Page ${pageNum}`;
    const pageNumWidth = font.widthOfTextAtSize(pageNumText, 9);
    page.drawText(pageNumText, {
      x: pageWidth / 2 - pageNumWidth / 2,
      y: 30,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    pageNum++;
  }

  // Handle empty document
  if (wrappedLines.length === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText(`Converted from: ${sourceFileName}`, {
      x: margin,
      y: pageHeight - margin,
      size: 9,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText("(Empty document)", {
      x: margin,
      y: pageHeight - margin - 30,
      size: fontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return pdfDoc.save();
}
