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

/* ---------------------------------------------------------------------------
 * Client (customer) reports — operational only, no financial figures.
 * ------------------------------------------------------------------------- */

/** An unfinished consignment is flagged as delayed this many days after booking. */
export const PENDING_ALERT_DAYS = 7;

export interface ClientSummary {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  contactPerson: string | null;
  isActive: boolean;
}

export interface ClientCargoRow extends CargoRow {
  clientReference: string | null;
  cargoDetails: string | null;
  packages: number | null;
  weight: number | null;
  serviceType: string | null;
  receiverPhone: string;
}

export interface ClientException {
  waybillNumber: string;
  reason: string;
  days: number;
}

export interface ClientReportTotals {
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  returned: number;
  cancelled: number;
  totalWeight: number;
  totalPackages: number;
  averageTransitHours: number | null;
}

export interface ClientReport {
  client: ClientSummary;
  period: ReportPeriod;
  totals: ClientReportTotals;
  rows: ClientCargoRow[];
  exceptions: ClientException[];
}

const clientSelect = {
  id: true,
  code: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  contactPerson: true,
  notes: true,
  isActive: true,
} as const;

/** Find clients by name, code or phone — used to pick the report subject. */
export async function searchClients(query: string, limit = 10): Promise<ClientSummary[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    return await withTimeout(
      db.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
          ],
        },
        orderBy: { name: 'asc' },
        take: limit,
        select: clientSelect,
      })
    );
  } catch (error) {
    console.error('[REPORTS] client search failed:', error);
    return [];
  }
}

/** List registered clients, optionally filtered by name, code or phone. */
export async function listClients(query = '', limit = 100): Promise<ClientSummary[]> {
  const q = query.trim();
  try {
    return await withTimeout(
      db.customer.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { code: { contains: q, mode: 'insensitive' as const } },
                { phone: { contains: q } },
                { contactPerson: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: clientSelect,
      })
    );
  } catch (error) {
    console.error('[REPORTS] client list failed:', error);
    return [];
  }
}

function isOpen(status: string): boolean {
  return status !== 'DELIVERED' && status !== 'CANCELLED';
}

function buildTotals(rows: ClientCargoRow[]): ClientReportTotals {
  const totals: ClientReportTotals = {
    total: rows.length,
    delivered: 0,
    inTransit: 0,
    pending: 0,
    returned: 0,
    cancelled: 0,
    totalWeight: 0,
    totalPackages: 0,
    averageTransitHours: null,
  };

  let transitSum = 0;
  let transitCount = 0;

  for (const row of rows) {
    if (row.status === 'DELIVERED') totals.delivered += 1;
    else if (row.status === 'PENDING') totals.pending += 1;
    else if (row.status === 'RETURNED') totals.returned += 1;
    else if (row.status === 'CANCELLED') totals.cancelled += 1;
    else totals.inTransit += 1;

    if (typeof row.weight === 'number') totals.totalWeight += row.weight;
    if (typeof row.packages === 'number') totals.totalPackages += row.packages;

    if (row.deliveredAt && row.pickedUpAt) {
      const ms = new Date(row.deliveredAt).getTime() - new Date(row.pickedUpAt).getTime();
      if (ms > 0) {
        transitSum += ms;
        transitCount += 1;
      }
    }
  }

  if (transitCount > 0) {
    totals.averageTransitHours = Math.round((transitSum / transitCount / 3600000) * 10) / 10;
  }

  return totals;
}

function buildExceptions(rows: ClientCargoRow[]): ClientException[] {
  const now = Date.now();
  const exceptions: ClientException[] = [];

  for (const row of rows) {
    if (!isOpen(row.status)) continue;
    const days = Math.floor((now - new Date(row.bookedAt).getTime()) / 86400000);
    if (days < PENDING_ALERT_DAYS) continue;
    exceptions.push({
      waybillNumber: row.waybillNumber,
      reason:
        row.status === 'RETURNED'
          ? 'Returned — awaiting action'
          : `Still ${row.status.replace(/_/g, ' ').toLowerCase()}`,
      days,
    });
  }

  return exceptions.sort((a, b) => b.days - a.days);
}

function toClientRow(row: {
  waybillNumber: string;
  currentStatus: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  origin: string;
  destination: string;
  createdAt: Date;
  pickedUpAt: Date | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  createdByName: string | null;
  dispatcherName: string | null;
  clientReference: string | null;
  cargoDetails: string | null;
  packageCount: number | null;
  weight: number | null;
  serviceType: string | null;
}): ClientCargoRow {
  return {
    ...toCargoRow(row),
    clientReference: row.clientReference,
    cargoDetails: row.cargoDetails,
    packages: row.packageCount,
    weight: row.weight,
    serviceType: row.serviceType,
    receiverPhone: row.receiverPhone,
  };
}

/** Full operational report for one client over a period. */
export async function getClientReport(
  customerId: string,
  period: ReportPeriod
): Promise<ClientReport | null> {
  try {
    const client = await withTimeout(
      db.customer.findUnique({ where: { id: customerId }, select: clientSelect })
    );
    if (!client) return null;

    const since = periodStart(period);
    const where: Record<string, unknown> = { customerId };
    if (since) where.createdAt = { gte: since };

    const shipments = await withTimeout(
      db.shipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_ROWS,
        select: {
          waybillNumber: true,
          currentStatus: true,
          senderName: true,
          receiverName: true,
          receiverPhone: true,
          origin: true,
          destination: true,
          createdAt: true,
          pickedUpAt: true,
          dispatchedAt: true,
          deliveredAt: true,
          createdByName: true,
          dispatcherName: true,
          clientReference: true,
          cargoDetails: true,
          packageCount: true,
          weight: true,
          serviceType: true,
        },
      })
    );

    const rows = shipments.map(toClientRow);

    return {
      client,
      period,
      totals: buildTotals(rows),
      rows,
      exceptions: buildExceptions(rows),
    };
  } catch (error) {
    console.error('[REPORTS] client report failed:', error);
    return null;
  }
}
