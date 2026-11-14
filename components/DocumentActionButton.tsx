'use client';

import { useState, type ReactNode } from 'react';
import { openPdfUrl, useIsNativeShell } from '@/lib/native-file';

/**
 * A link to a server-generated document.
 *
 * On the web it stays a plain link that opens the PDF in a new tab, ready to
 * print. In the Android app the WebView cannot show or print PDFs, so the same
 * tap saves the file to the device and opens the share sheet instead.
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

  if (!native) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} title={title}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      title={title}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await openPdfUrl(url, fileName);
        } catch (error) {
          console.error('[DocumentActionButton] save or share failed', error);
          alert('Could not prepare the document. Please try again.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </button>
  );
}
