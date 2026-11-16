'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useIsNativeShell } from '@/lib/native-file';

/** pdf.js assets copied from the package into `public/` (see scripts notes). */
const WORKER_SRC = '/pdf.worker.min.mjs';
const STANDARD_FONTS_URL = '/pdfjs/standard_fonts/';

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
 * report). The PDF is shown inline so the user can review it before deciding to
 * save it — instead of a tap silently downloading a file.
 *
 * On the web the browser's own viewer renders the file. The Android WebView has
 * no PDF engine, so there pdf.js renders each page to a canvas inside the app.
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
        <div className="relative flex-1 overflow-hidden bg-slate-100">
          {native ? (
            <NativePdfViewer src={src} />
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

/**
 * Renders a server-generated PDF inside the Android shell with pdf.js.
 *
 * The WebView cannot display PDFs on its own and the file sits behind the
 * session cookie, so it is fetched with credentials, parsed client-side and
 * drawn page-by-page onto a canvas.
 */
function NativePdfViewer({ src }: { src: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  // Load (and re-load) the document whenever the target changes.
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    setStatus('loading');
    setMessage(null);
    setNumPages(0);
    setPageNum(1);

    (async () => {
      try {
        const pdfjs: any = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        const res = await fetch(src, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.arrayBuffer();

        const doc = await pdfjs.getDocument({ data, standardFontDataUrl: STANDARD_FONTS_URL })
          .promise;
        if (cancelled) {
          doc.destroy?.();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
        setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        console.error('[pdf-preview] failed to load', error);
        setMessage('Could not open this document. Try Save / Download instead.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      docRef.current?.destroy?.();
      docRef.current = null;
    };
  }, [src]);

  // Draw the requested page, scaled to the available width.
  const drawPage = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    try {
      renderTaskRef.current?.cancel?.();
      const page = await doc.getPage(pageNum);
      const container = canvas.parentElement;
      const availableWidth = (container?.clientWidth ?? 320) - 16;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.max(0.2, availableWidth / baseViewport.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: scale * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      renderTaskRef.current = page.render({ canvas, viewport });
      await renderTaskRef.current.promise;
    } catch (error) {
      console.error('[pdf-preview] failed to render page', error);
    }
  }, [pageNum]);

  useEffect(() => {
    if (status !== 'ready') return;
    drawPage();
  }, [status, drawPage]);

  // Re-draw on rotation / resize.
  useEffect(() => {
    if (status !== 'ready') return;
    const onResize = () => drawPage();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [status, drawPage]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-auto p-2">
        <canvas ref={canvasRef} className="mx-auto block rounded shadow-md" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Opening document…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <p className="max-w-sm text-sm text-slate-600">{message}</p>
          </div>
        )}
      </div>

      {status === 'ready' && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 bg-white px-4 py-2">
          <button
            type="button"
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            aria-label="Previous page"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm font-medium text-slate-500">
            Page {pageNum} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            aria-label="Next page"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
