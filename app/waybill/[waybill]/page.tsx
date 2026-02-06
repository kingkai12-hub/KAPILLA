"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WaybillDisplayPage() {
  const params = useParams();
  const rawWaybill = params?.waybill;
  const waybill = Array.isArray(rawWaybill) ? rawWaybill[0] : rawWaybill;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
        <div className="text-slate-700 text-lg font-semibold">Hello, here is your waybill no</div>
        <div className="mt-4 text-4xl font-black tracking-widest text-slate-900 whitespace-nowrap">{waybill || ''}</div>
        <div className="mt-6 text-sm text-slate-600">
          You can use this number to track your shipment.
        </div>
        <div className="mt-6">
          <Link
            href={`/tracking?waybill=${encodeURIComponent(waybill || '')}`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-5 py-2.5 text-white font-semibold hover:bg-blue-800 transition-colors"
          >
            Track Shipment
          </Link>
        </div>
      </div>
    </div>
  );
}
