'use client';

import { useState, type ReactNode } from 'react';
import { openPdfUrl } from '@/lib/native-file';
import PdfPreviewModal from '@/components/PdfPreviewModal';

/**
 * A document button that opens a preview instead of downloading straight away.
 *
 * On the web the PDF renders inline in the preview surface, with a separate
 * "Save / Download" action. In the Android app the file is saved and shared,
 * since the WebView cannot render PDFs.
 */
export default function DocumentPreviewButton({
  url,
  fileName,
  title,
  className,
  children,
}: {
  url: string;
  fileName: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      await openPdfUrl(url, fileName);
    } catch (error) {
      console.error('[DocumentPreviewButton] save/share failed', error);
      alert('Could not prepare the document. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} title={title} onClick={() => setOpen(true)}>
        {children}
      </button>
      <PdfPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        title={title || fileName}
        src={open ? url : null}
        onSave={handleSave}
        busy={busy}
      />
    </>
  );
}
