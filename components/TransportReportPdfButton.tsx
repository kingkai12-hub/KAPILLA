'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { TransportReport } from '@/lib/reports';

function fmt(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function lastY(doc: unknown, fallback: number): number {
  const y = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof y === 'number' ? y : fallback;
}

export default function TransportReportPdfButton({
  report,
  periodLabel,
}: {
  report: TransportReport;
  periodLabel: string;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const jspdfModule = await import('jspdf');
      const atModule = await import('jspdf-autotable');
      const JsPDF =
        (jspdfModule as unknown as { jsPDF?: unknown }).jsPDF ??
        (jspdfModule as unknown as { default?: unknown }).default;
      const autoTable = ((atModule as unknown as { default?: unknown }).default ??
        atModule) as (doc: unknown, options: Record<string, unknown>) => void;

      const isWaybill = report.waybill !== null;
      const doc = new (JsPDF as new (opts: Record<string, unknown>) => unknown)({
        unit: 'pt',
        format: 'a4',
        orientation: isWaybill ? 'portrait' : 'landscape',
      });
      const d = doc as {
        setFontSize: (n: number) => void;
        setFont: (name: string, style?: string) => void;
        text: (t: string, x: number, y: number) => void;
        save: (name: string) => void;
        internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
      };

      const margin = 40;

      d.setFontSize(20);
      d.setFont('helvetica', 'bold');
      d.text('KAPILLA LOGISTICS', margin, 50);
      d.setFontSize(13);
      d.setFont('helvetica', 'normal');
      d.text('Transportation Report', margin, 72);
      d.setFontSize(9);
      d.text(
        `Search: ${report.query || '—'}   |   Period: ${periodLabel}   |   Generated: ${new Date().toLocaleString()}`,
        margin,
        90
      );

      let cursor = 110;

      if (report.waybill) {
        const w = report.waybill;

        autoTable(doc, {
          startY: cursor,
          theme: 'plain',
          styles: { fontSize: 10 },
          headStyles: { fontStyle: 'bold', textColor: [30, 41, 59] },
          head: [['Waybill', String(w.waybillNumber)]],
          body: [['Status', w.status.replace(/_/g, ' ')]],
        });
        cursor = lastY(doc, cursor) + 16;

        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          head: [['Milestone', 'Date & time']],
          body: [
            ['Booked', fmt(w.bookedAt)],
            ['Picked up', fmt(w.pickedUpAt)],
            ['Dispatched', fmt(w.dispatchedAt)],
            ['Delivered', fmt(w.deliveredAt)],
          ],
        });
        cursor = lastY(doc, cursor) + 16;

        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          head: [['Sender', 'Receiver']],
          body: [
            [w.senderName, w.receiverName],
            [w.senderPhone, w.receiverPhone],
            [w.senderAddress || '—', w.receiverAddress || '—'],
          ],
        });
        cursor = lastY(doc, cursor) + 16;

        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9 },
          head: [['Cargo & processing', '']],
          body: [
            ['Route', `${w.origin} → ${w.destination}`],
            ['Weight', w.weight != null ? `${w.weight} kg` : '—'],
            ['Price', w.price != null ? `TZS ${w.price.toLocaleString()}` : '—'],
            ['Processed by (staff)', w.staff || '—'],
            ['Received by', w.receivedBy || '—'],
            ['Cargo details', w.cargoDetails || '—'],
          ],
        });
        cursor = lastY(doc, cursor) + 16;

        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 4 },
          head: [['Date & time', 'Status', 'Location', 'Remarks', 'Staff']],
          body:
            w.events.length > 0
              ? w.events.map((e) => [
                  fmt(e.timestamp),
                  e.status.replace(/_/g, ' '),
                  e.location,
                  e.remarks || '—',
                  e.staffName || '—',
                ])
              : [['—', 'No updates recorded yet.', '', '', '']],
        });
      } else {
        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 7.5, cellPadding: 3 },
          head: [
            [
              'Waybill',
              'Sender',
              'Receiver',
              'Route',
              'Booked',
              'Picked up',
              'Dispatched',
              'Delivered',
              'Staff',
              'Status',
            ],
          ],
          body: report.rows.map((r) => [
            r.waybillNumber,
            r.senderName,
            r.receiverName,
            `${r.origin} → ${r.destination}`,
            fmt(r.bookedAt),
            fmt(r.pickedUpAt),
            fmt(r.dispatchedAt),
            fmt(r.deliveredAt),
            r.staff || '—',
            r.status.replace(/_/g, ' '),
          ]),
        });
      }

      const safe = (report.query || 'report').replace(/[^a-z0-9\-]+/gi, '-');
      d.save(`kapilla-transport-${safe}.pdf`);
    } catch (error) {
      console.error('[PDF] transport report failed', error);
      alert('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={busy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      <FileDown className="w-4 h-4" />
      {busy ? 'Generating…' : 'Download PDF'}
    </button>
  );
}
