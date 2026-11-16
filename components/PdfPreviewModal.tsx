'use client';

import { useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { useIsNativeShell } from '@/lib/native-file';

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string | null;
  onSave: () => void;
  busy?: boolean;
}

/**
 * A single preview surface shared by every document (waybill, POD, invoice,
 * report). The PDF is shown inline so the user can decide to review it or save
 * it — instead of a tap silently downloading a file.
 *
 * The Android WebView has no PDF engine, so there the preview falls back to a
 * clear call-to-action and hands the file to the native share sheet instead of
 * rendering a blank frame.
 */
export default function PdfPreviewModal({
  open,
  onClose,
  title,
  src,
  onSave,
  busy = false,
}: PdfPreviewModalProps) {
  const native = useIsNativeShell();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/70 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <p className="truncate font-semibold text-slate-900">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {busy ? 'Preparing…' : 'Save / Download'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 bg-slate-100">
          {native ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <FileText className="h-12 w-12 text-slate-400" />
              <p className="max-w-sm text-sm text-slate-600">
                Preview is not supported inside the app. Tap <strong>Save / Download</strong> to
                open or share this document.
              </p>
            </div>
          ) : src ? (
            <iframe src={src} title={title} className="h-full w-full border-0" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
