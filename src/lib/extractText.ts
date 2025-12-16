/**
 * Text extraction utilities for various document types
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const uint8Array = new Uint8Array(buffer);
  const { text } = await extractText(uint8Array, { mergePages: true });
  return text;
}

export async function extractTextFromWord(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return await extractTextFromPDF(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return await extractTextFromWord(buffer);
  } else if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }
  throw new Error("Unsupported file type");
}


