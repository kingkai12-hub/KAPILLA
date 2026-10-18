'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function WaybillDisplayPage() {
  const params = useParams();
  const rawWaybill = params?.waybill;
  const waybill = Array.isArray(rawWaybill) ? rawWaybill[0] : rawWaybill;

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center safe-page">
      <div className="w-full max-w-xl bg-white border border-navy-100 rounded-lg shadow-soft p-6 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <span className="bg-navy-50 border border-navy-100 p-2 rounded-md">
            <Image
              src="/logo.png"
              alt="Kapilla Group Ltd"
              width={40}
              height={40}
              className="w-9 h-9 object-contain"
              priority
            />
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-semibold text-navy-900">Your waybill number</h1>
        <div className="mt-4 text-3xl sm:text-4xl font-bold tracking-widest text-navy-900 whitespace-nowrap overflow-x-auto">
          {waybill || ''}
        </div>
        <p className="mt-6 text-sm text-charcoal-light leading-relaxed">
          Use this number to track your consignment from booking through to delivery.
        </p>
        <div className="mt-8">
          <Link
            href={`/?waybill=${encodeURIComponent(waybill || '')}`}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-navy-900 font-semibold hover:bg-accent-dark transition-colors"
          >
            Track Consignment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
