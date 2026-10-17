'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { ReportSummary } from '@/lib/reports';

function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportExportButtons({ summary }: { summary: ReportSummary }) {
  const [busy, setBusy] = useState<null | 'csv' | 'pdf'>(null);

  const fileBase = `kapilla-report-${summary.period}-${summary.generatedAt.slice(0, 10)}`;

  function buildSections(): { title: string; head: string[]; rows: (string | number)[][] }[] {
    const currency = new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    });

    const fmtDateTime = (value: string | null) =>
      value
        ? new Date(value).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—';

    return [
      {
        title: 'Summary',
        head: ['Metric', 'Value'],
        rows: [
          ['Period', summary.periodLabel],
          ['Customer filter', summary.customer || 'All customers'],
          ['Generated', new Date(summary.generatedAt).toLocaleString()],
          ['Total shipments', summary.shipments.total],
          ['Delivered shipments', summary.shipments.delivered],
          [
            'Average delivery time (days)',
            summary.shipments.avgLeadTimeDays === null ? '—' : summary.shipments.avgLeadTimeDays,
          ],
          ['Invoices (excl. drafts)', summary.invoices.count],
          ['Invoiced', currency.format(summary.invoices.invoiced)],
          ['Collected', currency.format(summary.invoices.collected)],
          ['Outstanding', currency.format(summary.invoices.outstanding)],
        ],
      },
      {
        title: 'Cargo report',
        head: [
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
        rows: summary.shipments.rows.map((r) => [
          r.waybillNumber,
          r.senderName,
          r.receiverName,
          `${r.origin} → ${r.destination}`,
          fmtDateTime(r.bookedAt),
          fmtDateTime(r.pickedUpAt),
          fmtDateTime(r.dispatchedAt),
          fmtDateTime(r.deliveredAt),
          r.staff || '—',
          r.status.replace(/_/g, ' '),
        ]),
      },
      {
        title: 'Shipments by status',
        head: ['Status', 'Count'],
        rows: summary.shipments.byStatus.map((s) => [s.status.replace(/_/g, ' '), s.count]),
      },
      {
        title: 'Top routes',
        head: ['Route', 'Count'],
        rows: summary.shipments.byRoute.map((r) => [r.route, r.count]),
      },
      {
        title: 'Shipments by month',
        head: ['Month', 'Count'],
        rows: summary.shipments.byMonth.map((m) => [m.label, m.count]),
      },
      {
        title: 'Top customers',
        head: ['Customer', 'Invoiced', 'Collected'],
        rows: summary.invoices.topCustomers.map((c) => [
          c.customer,
          currency.format(c.invoiced),
          currency.format(c.collected),
        ]),
      },
      {
        title: 'Unpaid invoices — ageing',
        head: ['Age', 'Invoices', 'Amount'],
        rows: summary.invoices.ageing.map((b) => [b.label, b.count, currency.format(b.amount)]),
      },
    ];
  }

  function exportCsv() {
    setBusy('csv');
    try {
      const rows: (string | number)[][] = [];
      buildSections().forEach((section) => {
        rows.push([section.title]);
        rows.push(section.head);
        section.rows.forEach((r) => rows.push(r));
        rows.push([]);
      });
      download(
        new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' }),
        `${fileBase}.csv`
      );
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      doc.setFontSize(16);
      doc.text('Kapilla Logistics — Report', 40, 40);
      doc.setFontSize(10);
      doc.text(
        `${summary.periodLabel}${summary.customer ? ` · ${summary.customer}` : ''} · generated ${new Date(
          summary.generatedAt
        ).toLocaleString()}`,
        40,
        58
      );

      let cursorY = 80;
      buildSections().forEach((section) => {
        autoTable(doc, {
          head: [section.head],
          body: section.rows.map((r) => r.map((c) => String(c))),
          startY: cursorY,
          margin: { left: 40, right: 40 },
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [37, 99, 235], textColor: 255 },
          theme: 'grid',
        });
        // lastAutoTable is attached by jspdf-autotable at runtime.
        cursorY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? cursorY) + 28;
        if (cursorY > 720) {
          doc.addPage();
          cursorY = 60;
        }
      });

      doc.save(`${fileBase}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportCsv}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 disabled:opacity-60 transition-colors"
      >
        {busy === 'csv' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        CSV
      </button>
      <button
        type="button"
        onClick={exportPdf}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 disabled:opacity-60 transition-colors"
      >
        {busy === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        PDF
      </button>
    </div>
  );
}
