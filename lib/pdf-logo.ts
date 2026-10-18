/**
 * Loads the brand logo as a data URL so jsPDF can embed it in generated PDFs.
 * Browser-only: every failure returns null so a PDF still generates without the logo.
 */

export type PdfLogo = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function loadPdfLogo(src = '/kapila%20logo.png'): Promise<PdfLogo | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;

    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read logo'));
      reader.readAsDataURL(blob);
    });

    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to decode logo'));
      img.src = dataUrl;
    });

    return { dataUrl, width: size.width, height: size.height };
  } catch (error) {
    console.error('[PDF] logo could not be loaded', error);
    return null;
  }
}
