'use client';

import { useState } from 'react';
import { FileDown, Sheet } from 'lucide-react';
import type { ClientReport } from '@/lib/reports';
import { loadPdfLogo } from '@/lib/pdf-logo';

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

function csvCell(value: string | number | null): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ClientReportButtons({
  report,
  periodLabel,
}: {
  report: ClientReport;
  periodLabel: string;
}) {
  const [busy, setBusy] = useState<null | 'pdf' | 'excel'>(null);

  const safeName = report.client.name.replace(/[^a-z0-9\-]+/gi, '-').toLowerCase();

  async function generatePdf() {
    setBusy('pdf');
    try {
      const jspdfModule = await import('jspdf');
      const atModule = await import('jspdf-autotable');
      const JsPDF =
        (jspdfModule as unknown as { jsPDF?: unknown }).jsPDF ??
        (jspdfModule as unknown as { default?: unknown }).default;
      const autoTable = ((atModule as unknown as { default?: unknown }).default ?? atModule) as (
        doc: unknown,
        options: Record<string, unknown>
      ) => void;

      const doc = new (JsPDF as new (opts: Record<string, unknown>) => unknown)({
        unit: 'pt',
        format: 'a4',
        orientation: 'landscape',
      });
      const d = doc as {
        setFontSize: (n: number) => void;
        setFont: (name: string, style?: string) => void;
        text: (t: string, x: number, y: number) => void;
        save: (name: string) => void;
        addImage: (
          dataUrl: string,
          format: string,
          x: number,
          y: number,
          w: number,
          h: number
        ) => void;
        internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
      };

      const margin = 40;

      const logo = await loadPdfLogo();
      if (logo) {
        const logoHeight = 44;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        d.addImage(
          logo.dataUrl,
          'PNG',
          d.internal.pageSize.getWidth() - margin - logoWidth,
          30,
          logoWidth,
          logoHeight
        );
      }

      d.setFontSize(20);
      d.setFont('helvetica', 'bold');
      d.text('KAPILLA LOGISTICS', margin, 50);
      d.setFontSize(13);
      d.setFont('helvetica', 'normal');
      d.text('Client Transportation Report', margin, 72);
      d.setFontSize(9);
      d.text(
        `${report.client.name} (${report.client.code})   |   Period: ${periodLabel}   |   Generated: ${new Date().toLocaleString()}`,
        margin,
        90
      );

      let cursor = 110;

      autoTable(doc, {
        startY: cursor,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        head: [['Client details', '']],
        body: [
          ['Client', `${report.client.name} (${report.client.code})`],
          ['Phone', report.client.phone],
          ['Email', report.client.email || '—'],
          ['Contact person', report.client.contactPerson || '—'],
          ['Address', report.client.address || '—'],
        ],
      });
      cursor = lastY(doc, cursor) + 16;

      const t = report.totals;
      autoTable(doc, {
        startY: cursor,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        head: [
          [
            'Consignments',
            'Delivered',
            'In transit',
            'Pending',
            'Returned',
            'Cancelled',
            'Weight (kg)',
            'Packages',
            'Avg transit (h)',
          ],
        ],
        body: [
          [
            String(t.total),
            String(t.delivered),
            String(t.inTransit),
            String(t.pending),
            String(t.returned),
            String(t.cancelled),
            String(t.totalWeight),
            String(t.totalPackages),
            t.averageTransitHours != null ? String(t.averageTransitHours) : '—',
          ],
        ],
      });
      cursor = lastY(doc, cursor) + 16;

      autoTable(doc, {
        startY: cursor,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 3 },
        head: [
          [
            'Waybill',
            'Client ref',
            'Route',
            'Packages',
            'Weight',
            'Service',
            'Booked',
            'Picked up',
            'Dispatched',
            'Delivered',
            'Staff',
            'Status',
          ],
        ],
        body:
          report.rows.length > 0
            ? report.rows.map((r) => [
                r.waybillNumber,
                r.clientReference || '—',
                `${r.origin} → ${r.destination}`,
                r.packages != null ? String(r.packages) : '—',
                r.weight != null ? `${r.weight} kg` : '—',
                r.serviceType || '—',
                fmt(r.bookedAt),
                fmt(r.pickedUpAt),
                fmt(r.dispatchedAt),
                fmt(r.deliveredAt),
                r.staff || '—',
                r.status.replace(/_/g, ' '),
              ])
            : [['—', 'No consignments in this period.', '', '', '', '', '', '', '', '', '', '']],
      });
      cursor = lastY(doc, cursor) + 16;

      if (report.exceptions.length > 0) {
        autoTable(doc, {
          startY: cursor,
          theme: 'grid',
          headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8 },
          head: [['Needs attention — waybill', 'Reason', 'Days open']],
          body: report.exceptions.map((ex) => [ex.waybillNumber, ex.reason, String(ex.days)]),
        });
      }

      d.save(`kapilla-client-${safeName}.pdf`);
    } catch (error) {
      console.error('[PDF] client report failed', error);
      alert('Could not generate the PDF. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  function exportExcel() {
    setBusy('excel');
    try {
      const lines: string[] = [];
      lines.push(['KAPILLA LOGISTICS — Client Transportation Report'].map(csvCell).join(','));
      lines.push(
        ['Client', `${report.client.name} (${report.client.code})`].map(csvCell).join(',')
      );
      lines.push(['Phone', report.client.phone].map(csvCell).join(','));
      lines.push(['Email', report.client.email || '—'].map(csvCell).join(','));
      lines.push(['Contact person', report.client.contactPerson || '—'].map(csvCell).join(','));
      lines.push(['Address', report.client.address || '—'].map(csvCell).join(','));
      lines.push(['Period', periodLabel].map(csvCell).join(','));
      lines.push(['Generated', new Date().toLocaleString()].map(csvCell).join(','));
      lines.push(
        [
          'Consignments',
          'Delivered',
          'In transit',
          'Pending',
          'Returned',
          'Cancelled',
          'Weight (kg)',
          'Packages',
          'Avg transit (h)',
        ]
          .map(csvCell)
          .join(',')
      );
      const t = report.totals;
      lines.push(
        [
          t.total,
          t.delivered,
          t.inTransit,
          t.pending,
          t.returned,
          t.cancelled,
          t.totalWeight,
          t.totalPackages,
          t.averageTransitHours ?? '—',
        ]
          .map(csvCell)
          .join(',')
      );
      lines.push('');
      lines.push(
        [
          'Waybill',
          'Client ref',
          'Route',
          'Packages',
          'Weight (kg)',
          'Service',
          'Booked',
          'Picked up',
          'Dispatched',
          'Delivered',
          'Staff',
          'Status',
        ]
          .map(csvCell)
          .join(',')
      );
      for (const r of report.rows) {
        lines.push(
          [
            r.waybillNumber,
            r.clientReference || '',
            `${r.origin} -> ${r.destination}`,
            r.packages ?? '',
            r.weight ?? '',
            r.serviceType || '',
            fmt(r.bookedAt),
            fmt(r.pickedUpAt),
            fmt(r.dispatchedAt),
            fmt(r.deliveredAt),
            r.staff || '',
            r.status.replace(/_/g, ' '),
          ]
            .map(csvCell)
            .join(',')
        );
      }
      if (report.exceptions.length > 0) {
        lines.push('');
        lines.push(['Needs attention — waybill', 'Reason', 'Days open'].map(csvCell).join(','));
        for (const ex of report.exceptions) {
          lines.push([ex.waybillNumber, ex.reason, ex.days].map(csvCell).join(','));
        }
      }

      const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kapilla-client-${safeName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[EXCEL] client report failed', error);
      alert('Could not generate the spreadsheet. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={generatePdf}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <FileDown className="w-4 h-4" />
        {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
      </button>
      <button
        type="button"
        onClick={exportExcel}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <Sheet className="w-4 h-4" />
        {busy === 'excel' ? 'Generating…' : 'Export Excel'}
      </button>
    </>
  );
}
