import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - annotpdf doesn't have types
import { AnnotationFactory } from "annotpdf";

interface KeyTerm {
  title: string;
  content: string;
  riskLevel?: string;
  originalText?: string;
}

interface HighlightAnnotation {
  pageNum: number;
  rect: [number, number, number, number];
  color: "yellow" | "red" | "green";
  text?: string;
}

// Convert color name to RGB values (0-255)
function getColorRGB(color: "yellow" | "red" | "green") {
  switch (color) {
    case "red":
      return { r: 239, g: 68, b: 68 };
    case "green":
      return { r: 34, g: 197, b: 94 };
    case "yellow":
    default:
      return { r: 250, g: 204, b: 21 };
  }
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const keyTermsJson = formData.get("keyTerms") as string;

    if (!pdfFile) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const keyTerms: KeyTerm[] = keyTermsJson ? JSON.parse(keyTermsJson) : [];

    // Convert file to buffer
    const pdfBytes = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBytes);

    // If no key terms, return original PDF
    if (keyTerms.length === 0) {
      return new NextResponse(Buffer.from(uint8Array), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="contract-annotated.pdf"',
        },
      });
    }

    // Load PDF with annotpdf (pass as Buffer for Node.js compatibility)
    const factory = new AnnotationFactory(Buffer.from(uint8Array));

    // We need to extract text positions from the PDF
    // For now, create simple annotations on page 1 for each key term
    // In a real implementation, we'd use pdfjs-dist on the server to find text positions

    let annotationCount = 0;
    const pageHeight = 792; // Standard letter page height in points
    const margin = 72; // 1 inch margin

    for (let i = 0; i < Math.min(keyTerms.length, 10); i++) {
      const term = keyTerms[i];
      const risk = term.riskLevel as "high" | "medium" | "low" || "medium";
      const color = getColorRGB(risk === "high" ? "red" : risk === "medium" ? "yellow" : "green");

      // Create a simple highlight annotation
      // Position them vertically on the first page for now
      const y = pageHeight - margin - (i * 50);

      try {
        factory.createHighlightAnnotation({
          page: 0, // First page (0-indexed)
          rect: [margin, y - 15, 500, y + 5],
          contents: term.title,
          color: color,
          opacity: 0.4,
        });
        annotationCount++;
      } catch (err) {
        console.error(`Failed to create annotation for term: ${term.title}`, err);
      }
    }

    console.log(`Created ${annotationCount} annotations`);

    // Write the modified PDF
    const modifiedPdf = factory.write();

    return new NextResponse(Buffer.from(modifiedPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="contract-annotated.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    );
  }
}
