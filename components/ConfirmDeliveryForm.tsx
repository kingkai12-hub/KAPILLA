'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, User, MapPin, Eraser } from 'lucide-react';

interface ConfirmDeliveryFormProps {
  waybillNumber: string;
  receiverName: string;
  destination: string;
  existingSignature?: string | null;
  existingReceivedBy?: string | null;
}

/**
 * Hand-over confirmation: the staff member captures the receiver's name and
 * signature, and the shipment is marked DELIVERED in one action. There is no
 * status dropdown — confirming delivery *is* the status change.
 */
export default function ConfirmDeliveryForm({
  waybillNumber,
  receiverName,
  destination,
  existingSignature,
  existingReceivedBy,
}: ConfirmDeliveryFormProps) {
  const router = useRouter();
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [receivedBy, setReceivedBy] = useState(existingReceivedBy || receiverName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let signatureData: string | null = null;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    } else if (existingSignature) {
      // Keep the signature captured earlier, if any.
      signatureData = existingSignature;
    }

    if (!signatureData) {
      setError('Please capture the receiver\u2019s signature.');
      return;
    }
    if (!receivedBy.trim()) {
      setError('Please enter the name of the person receiving the cargo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/shipments/${encodeURIComponent(waybillNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          signature: signatureData,
          receivedBy: receivedBy.trim(),
          location: destination,
        }),
      });

      if (res.ok) {
        router.push(`/staff/shipments/${encodeURIComponent(waybillNumber)}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to confirm delivery. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleConfirm} className="glass-strong rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Shipment summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Receiver</span>
          </div>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white">{receiverName}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Destination</span>
          </div>
          <p className="mt-2 font-semibold text-slate-900 dark:text-white">{destination}</p>
        </div>
      </div>

      {/* Received by */}
      <div>
        <label
          htmlFor="receivedBy"
          className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
        >
          Received by (person collecting the cargo)
        </label>
        <input
          id="receivedBy"
          type="text"
          value={receivedBy}
          onChange={(e) => setReceivedBy(e.target.value)}
          className="w-full px-4 py-3 glass-input text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Full name of the person receiving the cargo"
          required
        />
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Receiver&apos;s signature
        </label>
        <div className="border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white max-w-full overflow-x-auto">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ width: 520, height: 180, className: 'signature-canvas w-full' }}
          />
        </div>
        <button
          type="button"
          onClick={() => sigCanvas.current?.clear()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 mt-2 hover:underline"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear signature
        </button>
        {!existingSignature && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            A signature is required before delivery can be confirmed.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        <CheckCircle2 className="w-5 h-5" />
        {isSubmitting ? 'Confirming…' : 'Confirm Delivery'}
      </button>
    </form>
  );
}
