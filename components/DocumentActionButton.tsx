'use client';

import { useState, type ReactNode } from 'react';
import { openPdfUrl, useIsNativeShell } from '@/lib/native-file';
import PdfPreviewModal from '@/components/PdfPreviewModal';

/**
 * A link to a server-generated document.
 *
 * On the web it stays a plain link that opens the PDF in a new tab, ready to
 * print. In the Android app the WebView cannot show PDFs on its own, so the
 * same tap opens the in-app preview (rendered with pdf.js) with a separate
 * save/share action.
 */
export default function DocumentActionButton({
  url,
  fileName,
  className,
  title,
  children,
}: {
  url: string;
  fileName: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const native = useIsNativeShell();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  if (!native) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} title={title}>
        {children}
      </a>
    );
  }

  const handleSave = async () => {
    setBusy(true);
    try {
      await openPdfUrl(url, fileName);
    } catch (error) {
      console.error('[DocumentActionButton] save or share failed', error);
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
