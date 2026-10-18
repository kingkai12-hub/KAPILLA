import { cookies } from 'next/headers';
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

/**
 * Report access is granted per-user by an admin (User.canViewReports).
 * Admins always have access so they can manage the permission.
 */
export async function hasReportAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('kapilla_uid')?.value;
    if (!userId) return false;
    const user = await withTimeout(
      db.user.findUnique({
        where: { id: userId },
        select: { role: true, canViewReports: true },
      })
    );
    if (!user) return false;
    return user.role === 'ADMIN' || user.canViewReports;
  } catch (error) {
    console.error('[REPORTS] access check failed', error);
    return false;
  }
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
  return REPORT_PERIODS.find((r) => r.key === value)?.key ?? 'all';
}

export function periodLabel(period: ReportPeriod): string {
  return REPORT_PERIODS.find((r) => r.key === period)?.label ?? 'All time';
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

export interface WaybillEvent {
  timestamp: string;
  status: string;
  location: string;
  remarks: string | null;
  staffName: string | null;
}

export interface WaybillReport {
  waybillNumber: string;
  status: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string | null;
  origin: string;
  destination: string;
  weight: number | null;
  price: number | null;
  cargoDetails: string | null;
  bookedAt: string;
  pickedUpAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  staff: string | null;
  receivedBy: string | null;
  events: WaybillEvent[];
}

export interface TransportReport {
  query: string;
  period: ReportPeriod;
  /** Set when the query matched a single waybill exactly. */
  waybill: WaybillReport | null;
  /** Set when the query matched a company / sender / receiver name. */
  rows: CargoRow[];
}

const MAX_ROWS = 500;

const cargoSelect = {
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
} as const;

function toCargoRow(row: {
  waybillNumber: string;
  currentStatus: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  createdAt: Date;
  pickedUpAt: Date | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  createdByName: string | null;
  dispatcherName: string | null;
}): CargoRow {
  return {
    waybillNumber: row.waybillNumber,
    status: row.currentStatus,
    senderName: row.senderName,
    receiverName: row.receiverName,
    origin: row.origin,
    destination: row.destination,
    bookedAt: row.createdAt.toISOString(),
    pickedUpAt: row.pickedUpAt ? row.pickedUpAt.toISOString() : null,
    dispatchedAt: row.dispatchedAt ? row.dispatchedAt.toISOString() : null,
    deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
    staff: row.createdByName ?? row.dispatcherName ?? null,
  };
}

/**
 * Search the transportation records.
 *
 * - If the query matches a waybill number exactly, the single shipment report is
 *   returned in `waybill`.
 * - Otherwise the query is treated as a company / sender / receiver name and all
 *   matching shipments within the selected period are returned in `rows`.
 */
export async function searchTransportReport(
  query: string,
  period: ReportPeriod
): Promise<TransportReport> {
  const q = query.trim();
  const report: TransportReport = { query: q, period, waybill: null, rows: [] };
  if (!q) return report;

  const since = periodStart(period);

  try {
    // 1) Exact waybill lookup — a specific cargo report.
    const shipment = await withTimeout(
      db.shipment.findFirst({
        where: { waybillNumber: { equals: q, mode: 'insensitive' } },
        include: { events: { orderBy: { timestamp: 'asc' } } },
      })
    );

    if (shipment) {
      report.waybill = {
        waybillNumber: shipment.waybillNumber,
        status: shipment.currentStatus,
        senderName: shipment.senderName,
        senderPhone: shipment.senderPhone,
        senderAddress: shipment.senderAddress,
        receiverName: shipment.receiverName,
        receiverPhone: shipment.receiverPhone,
        receiverAddress: shipment.receiverAddress,
        origin: shipment.origin,
        destination: shipment.destination,
        weight: shipment.weight,
        price: shipment.price,
        cargoDetails: shipment.cargoDetails,
        bookedAt: shipment.createdAt.toISOString(),
        pickedUpAt: shipment.pickedUpAt ? shipment.pickedUpAt.toISOString() : null,
        dispatchedAt: shipment.dispatchedAt ? shipment.dispatchedAt.toISOString() : null,
        deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.toISOString() : null,
        staff: shipment.createdByName ?? shipment.dispatcherName ?? null,
        receivedBy: shipment.receivedBy,
        events: shipment.events.map((event) => ({
          timestamp: event.timestamp.toISOString(),
          status: event.status,
          location: event.location,
          remarks: event.remarks,
          staffName: event.staffName,
        })),
      };
      return report;
    }

    // 2) Company / customer / partial-waybill search — all matches in the period.
    const where: Record<string, unknown> = {
      OR: [
        { senderName: { contains: q, mode: 'insensitive' as const } },
        { receiverName: { contains: q, mode: 'insensitive' as const } },
        { waybillNumber: { contains: q, mode: 'insensitive' as const } },
      ],
    };
    if (since) where.createdAt = { gte: since };

    const rows = await withTimeout(
      db.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_ROWS,
        select: cargoSelect,
      })
    );
    report.rows = rows.map(toCargoRow);
  } catch (error) {
    console.error('[REPORTS] transport search failed:', error);
  }

  return report;
}
