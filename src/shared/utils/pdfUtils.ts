import { PDFDocument } from 'pdf-lib';
import AdmZip from 'adm-zip';

/**
 * Junta múltiplos PDFs em um único documento, na ordem em que os buffers são passados.
 */
export async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  const merged = await PDFDocument.create();

  for (const buffer of buffers) {
    const doc = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const bytes = await merged.save();
  return Buffer.from(bytes);
}

/**
 * Extrai o primeiro arquivo .pdf de dentro de um ZIP (ex.: etiqueta do Mercado Livre,
 * que vem como ZIP com PDF + TXT Zebra).
 */
export function extractPdfFromZip(zipBuffer: Buffer): Buffer {
  const zip = new AdmZip(zipBuffer);
  const pdfEntry = zip.getEntries().find((entry) => entry.entryName.toLowerCase().endsWith('.pdf'));

  if (!pdfEntry) {
    throw new Error('Nenhum arquivo PDF encontrado dentro do ZIP da etiqueta.');
  }

  return pdfEntry.getData();
}
