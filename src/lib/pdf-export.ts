/**
 * Export PDF with highlights based on key terms from contract analysis
 * This calls the server-side API to add annotations
 */
export async function exportAnnotatedContract(
  pdfUrl: string,
  keyTerms: Array<{
    title: string;
    content: string;
    riskLevel?: string;
    originalText?: string;
  }>,
  fileName: string
): Promise<void> {
  try {
    // Fetch the original PDF
    const pdfResponse = await fetch(pdfUrl);
    const pdfBlob = await pdfResponse.blob();

    // Create form data with PDF and key terms
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "contract.pdf");
    formData.append("keyTerms", JSON.stringify(keyTerms));

    // Call the server-side API to add annotations
    const response = await fetch("/api/export-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    // Get the annotated PDF blob
    const annotatedBlob = await response.blob();

    // Download the file
    downloadPDF(annotatedBlob, fileName);
  } catch (err) {
    console.error("Error exporting annotated PDF:", err);
    throw err;
  }
}

/**
 * Simple download helper
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
