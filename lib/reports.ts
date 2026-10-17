import { db } from './db';

const TIMEOUT_MS = 5000;

// Same resilient-query pattern used elsewhere in the portal: a slow or
// unavailable database must never take the page down.
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)),
  ]);
}

export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export const REPORT_PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'quarter', label: 'Quarterly' },
  { key: 'year', label: 'Yearly' },
  { key: 'all', label: 'All time' },
];

export function parsePeriod(value?: string): ReportPeriod {
  return REPORT_PERIODS.find((r) => r.key === value)?.key ?? 'month';
}

export function periodLabel(period: ReportPeriod): string {
  return REPORT_PERIODS.find((r) => r.key === period)?.label ?? 'Monthly';
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodStart(period: ReportPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case 'all':
      return null;
    case 'day':
      return startOfDay(now);
    case 'week': {
      // Week starts on Monday.
      const d = startOfDay(now);
      const offset = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - offset);
      return d;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), q * 3, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
  }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface RouteCount {
  route: string;
  count: number;
}

export interface MonthCount {
  key: string;
  label: string;
  count: number;
}

export interface CustomerTotal {
  customer: string;
  invoiced: number;
  collected: number;
}

export interface AgeingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface CargoRow {
  waybillNumber: string;
  status: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  bookedAt: string;
  pickedUpAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  staff: string | null;
}

export interface ReportSummary {
  period: ReportPeriod;
  periodLabel: string;
  since: string | null;
  customer: string | null;
  generatedAt: string;
  shipments: {
    total: number;
    delivered: number;
    byStatus: StatusCount[];
    byRoute: RouteCount[];
    byMonth: MonthCount[];
    avgLeadTimeDays: number | null;
    rows: CargoRow[];
  };
  invoices: {
    count: number;
    invoiced: number;
    collected: number;
    outstanding: number;
    topCustomers: CustomerTotal[];
    ageing: AgeingBucket[];
  };
}

function emptySummary(
  period: ReportPeriod,
  since: Date | null,
  customer: string | null
): ReportSummary {
  return {
    period,
    periodLabel: periodLabel(period),
    since: since ? since.toISOString() : null,
    customer,
    generatedAt: new Date().toISOString(),
    shipments: {
      total: 0,
      delivered: 0,
      byStatus: [],
      byRoute: [],
      byMonth: [],
      avgLeadTimeDays: null,
      rows: [],
    },
    invoices: {
      count: 0,
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      topCustomers: [],
      ageing: [],
    },
  };
}

function bucketOverdue(dueDate: Date | null): string {
  if (!dueDate) return 'No due date';
  const days = Math.floor((Date.now() - dueDate.getTime()) / 86_400_000);
  if (days <= 0) return 'Not yet due';
  if (days <= 30) return '1-30 days';
  if (days <= 60) return '31-60 days';
  if (days <= 90) return '61-90 days';
  return '90+ days';
}

const AGEING_ORDER = ['Not yet due', '1-30 days', '31-60 days', '61-90 days', '90+ days', 'No due date'];

const MAX_CARGO_ROWS = 500;

export async function getReportSummary(
  period: ReportPeriod,
  customer?: string
): Promise<ReportSummary> {
  const since = periodStart(period);
  const customerFilter = customer?.trim() ? customer.trim() : null;
  const summary = emptySummary(period, since, customerFilter);

  // Month buckets always cover the last six months so the trend chart is stable.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Customer name can be either the sender or the receiver of a shipment.
  const customerMatch =
    customerFilter !== null
      ? [
          { senderName: { contains: customerFilter, mode: 'insensitive' as const } },
          { receiverName: { contains: customerFilter, mode: 'insensitive' as const } },
        ]
      : null;

  const shipmentWhere: Record<string, unknown> = {};
  if (since) shipmentWhere.createdAt = { gte: since };
  if (customerMatch) shipmentWhere.OR = customerMatch;

  const trendWhere: Record<string, unknown> = { createdAt: { gte: sixMonthsAgo } };
  if (customerMatch) trendWhere.OR = customerMatch;

  // Drafts are excluded: they have not been issued to a customer yet.
  const invoiceWhere: Record<string, unknown> = { status: { not: 'DRAFT' } };
  if (since) invoiceWhere.issueDate = { gte: since };
  if (customerFilter) invoiceWhere.customerName = { contains: customerFilter, mode: 'insensitive' };

  try {
    const [
      totalShipments,
      statusGroups,
      routeGroups,
      monthlyRows,
      deliveredRows,
      invoiceAgg,
      paidAgg,
      customerGroups,
      unpaidRows,
      cargoRows,
    ] = await Promise.all([
      withTimeout(db.shipment.count({ where: shipmentWhere })),
      withTimeout(
        db.shipment.groupBy({
          by: ['currentStatus'],
          where: shipmentWhere,
          _count: { _all: true },
        })
      ),
      withTimeout(
        db.shipment.groupBy({
          by: ['origin', 'destination'],
          where: shipmentWhere,
          _count: { _all: true },
        })
      ),
      withTimeout(
        db.shipment.findMany({
          where: trendWhere,
          select: { createdAt: true },
          take: 20000,
        })
      ),
      withTimeout(
        db.shipment.findMany({
          where: { ...shipmentWhere, currentStatus: 'DELIVERED', deliveredAt: { not: null } },
          select: { createdAt: true, deliveredAt: true },
          take: 5000,
        })
      ),
      withTimeout(
        db.invoice.aggregate({
          where: invoiceWhere,
          _sum: { total: true },
          _count: { _all: true },
        })
      ),
      withTimeout(
        db.invoice.aggregate({
          where: { ...invoiceWhere, paidAt: { not: null } },
          _sum: { total: true },
        })
      ),
      withTimeout(
        db.invoice.groupBy({
          by: ['customerName'],
          where: invoiceWhere,
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 5,
        })
      ),
      withTimeout(
        db.invoice.findMany({
          where: { ...invoiceWhere, paidAt: null },
          select: { customerName: true, dueDate: true, total: true },
          take: 5000,
        })
      ),
      withTimeout(
        db.shipment.findMany({
          where: shipmentWhere,
          orderBy: { createdAt: 'desc' },
          take: MAX_CARGO_ROWS,
          select: {
            waybillNumber: true,
            currentStatus: true,
            senderName: true,
            receiverName: true,
            origin: true,
            destination: true,
            createdAt: true,
            pickedUpAt: true,
            dispatchedAt: true,
            deliveredAt: true,
            createdByName: true,
            dispatcherName: true,
          },
        })
      ),
    ]);

    const byStatus: StatusCount[] = (statusGroups ?? []).map((g: any) => ({
      status: String(g.currentStatus ?? 'UNKNOWN'),
      count: Number(g._count?._all ?? 0),
    }));
    byStatus.sort((a, b) => b.count - a.count);

    const byRoute: RouteCount[] = (routeGroups ?? [])
      .map((g: any) => ({
        route: `${g.origin ?? '—'} → ${g.destination ?? '—'}`,
        count: Number(g._count?._all ?? 0),
      }))
      .sort((a: RouteCount, b: RouteCount) => b.count - a.count)
      .slice(0, 8);

    // Build the last six month buckets, then fill them from the rows.
    const monthBuckets: MonthCount[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      monthBuckets.push({ key, label: monthLabel(key), count: 0 });
    }
    const bucketIndex = new Map(monthBuckets.map((b, idx) => [b.key, idx]));
    (monthlyRows ?? []).forEach((row: any) => {
      if (!row?.createdAt) return;
      const key = monthKey(new Date(row.createdAt));
      const idx = bucketIndex.get(key);
      if (idx !== undefined) monthBuckets[idx].count += 1;
    });

    let avgLeadTimeDays: number | null = null;
    const leadTimes = (deliveredRows ?? [])
      .map((row: any) => {
        if (!row?.createdAt || !row?.deliveredAt) return null;
        return (
          (new Date(row.deliveredAt).getTime() - new Date(row.createdAt).getTime()) / 86_400_000
        );
      })
      .filter((v: number | null): v is number => v !== null && Number.isFinite(v) && v >= 0);
    if (leadTimes.length > 0) {
      avgLeadTimeDays =
        Math.round((leadTimes.reduce((a: number, b: number) => a + b, 0) / leadTimes.length) * 10) /
        10;
    }

    const rows: CargoRow[] = (cargoRows ?? []).map((row: any) => ({
      waybillNumber: String(row.waybillNumber ?? ''),
      status: String(row.currentStatus ?? 'UNKNOWN'),
      senderName: String(row.senderName ?? ''),
      receiverName: String(row.receiverName ?? ''),
      origin: String(row.origin ?? ''),
      destination: String(row.destination ?? ''),
      bookedAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
      pickedUpAt: row.pickedUpAt ? new Date(row.pickedUpAt).toISOString() : null,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt).toISOString() : null,
      deliveredAt: row.deliveredAt ? new Date(row.deliveredAt).toISOString() : null,
      staff: row.createdByName ?? row.dispatcherName ?? null,
    }));

    const customerTotals = new Map<string, { invoiced: number; collected: number }>();
    (customerGroups ?? []).forEach((g: any) => {
      const name = String(g.customerName ?? 'Unknown');
      customerTotals.set(name, {
        invoiced: Number(g._sum?.total ?? 0),
        collected: 0,
      });
    });
    // Attribute collected amounts to the same customers (only where we know them).
    const paidByCustomer = await withTimeout(
      db.invoice.groupBy({
        by: ['customerName'],
        where: { ...invoiceWhere, paidAt: { not: null } },
        _sum: { total: true },
      })
    );
    (paidByCustomer ?? []).forEach((g: any) => {
      const name = String(g.customerName ?? 'Unknown');
      const entry = customerTotals.get(name);
      if (entry) entry.collected = Number(g._sum?.total ?? 0);
    });
    const topCustomers: CustomerTotal[] = Array.from(customerTotals.entries())
      .map(([customerName, v]) => ({ customer: customerName, invoiced: v.invoiced, collected: v.collected }))
      .sort((a, b) => b.invoiced - a.invoiced)
      .slice(0, 5);

    const ageingMap = new Map<string, AgeingBucket>();
    AGEING_ORDER.forEach((label) => ageingMap.set(label, { label, count: 0, amount: 0 }));
    (unpaidRows ?? []).forEach((row: any) => {
      const label = bucketOverdue(row?.dueDate ? new Date(row.dueDate) : null);
      const bucket = ageingMap.get(label);
      if (!bucket) return;
      bucket.count += 1;
      bucket.amount += Number(row?.total ?? 0);
    });
    const ageing = AGEING_ORDER.map((label) => ageingMap.get(label)!).filter(
      (b) => b.count > 0 || b.label === 'Not yet due' || b.label === '1-30 days'
    );

    const invoiced = Number(invoiceAgg?._sum?.total ?? 0);
    const collected = Number(paidAgg?._sum?.total ?? 0);

    summary.shipments = {
      total: Number(totalShipments ?? 0),
      delivered: byStatus.find((s) => s.status === 'DELIVERED')?.count ?? 0,
      byStatus,
      byRoute,
      byMonth: monthBuckets,
      avgLeadTimeDays,
      rows,
    };
    summary.invoices = {
      count: Number(invoiceAgg?._count?._all ?? 0),
      invoiced,
      collected,
      outstanding: Math.max(invoiced - collected, 0),
      topCustomers,
      ageing,
    };
  } catch (error) {
    console.error('[REPORTS] Failed to build report summary:', error);
    return summary;
  }

  return summary;
}
