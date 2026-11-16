import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import ConfirmDeliveryForm from '@/components/ConfirmDeliveryForm';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['ADMIN', 'STAFF', 'OPERATION_MANAGER', 'MANAGER', 'MD', 'CEO', 'ACCOUNTANT'];
const TIMEOUT_MS = 5000;

// `P` is intentionally unconstrained: when a caller passes an untyped (`any`)
// Prisma query, the result keeps that type instead of widening to `{}`.
async function withTimeout<P>(promise: P, timeoutMs: number = TIMEOUT_MS): Promise<Awaited<P>> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)),
  ]) as Promise<Awaited<P>>;
}

/**
 * Dedicated hand-over screen. The dashboard alert, the shipments list and the
 * arrival email/SMS all funnel to this single confirm action, so a staff member
 * never lands on the read-only report and wonders why nothing happens.
 */
export default async function ConfirmDeliveryPage({
  params,
}: {
  params: Promise<{ waybill: string }>;
}) {
  const { waybill } = await params;

  // Role gate — degrade gracefully instead of crashing on a DB hiccup.
  let role: string | null = null;
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('kapilla_uid')?.value;
    if (userId) {
      const user = await withTimeout(
        db.user.findUnique({ where: { id: userId }, select: { role: true } })
      );
      role = user?.role ?? null;
    }
  } catch (error) {
    console.error('[CONFIRM_DELIVERY] role check failed', error);
  }

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            Access Restricted
          </h1>
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const shipment = await withTimeout(
    db.shipment.findFirst({
      where: { waybillNumber: { equals: waybill, mode: 'insensitive' } },
      select: {
        waybillNumber: true,
        receiverName: true,
        destination: true,
        currentStatus: true,
        receiverSignature: true,
        receivedBy: true,
      },
    })
  ).catch((error) => {
    console.error('[CONFIRM_DELIVERY] load failed', error);
    return null;
  });

  if (!shipment) notFound();

  const alreadyDelivered = shipment.currentStatus === 'DELIVERED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/staff/shipments/${encodeURIComponent(shipment.waybillNumber)}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to waybill
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Delivery confirmation
        </p>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
          #{shipment.waybillNumber}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Capture the receiver&apos;s signature to hand over the cargo. The shipment is marked
          delivered automatically.
        </p>
      </div>

      {alreadyDelivered ? (
        <div className="glass-strong rounded-2xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-4 border-green-200">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            This shipment is already delivered
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nothing else to confirm. You can view the signed proof of delivery.
          </p>
          <Link
            href={`/waybill/${encodeURIComponent(shipment.waybillNumber)}/pod`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold transition-colors"
          >
            View proof of delivery
          </Link>
        </div>
      ) : (
        <ConfirmDeliveryForm
          waybillNumber={shipment.waybillNumber}
          receiverName={shipment.receiverName}
          destination={shipment.destination}
          existingSignature={shipment.receiverSignature}
          existingReceivedBy={shipment.receivedBy}
        />
      )}
    </div>
  );
}
