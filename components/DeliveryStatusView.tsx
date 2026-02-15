'use client';

import React from 'react';
import { Package, CheckCircle, Clock, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryStatusViewProps {
  status: string;
  deliveredAt?: string | Date | null;
  receivedBy?: string | null;
  receiverSignature?: string | null;
  proofOfDelivery?: string | null;
  destination: string;
  waybillNumber: string;
}

export function DeliveryStatusView({
  status,
  deliveredAt,
  receivedBy,
  receiverSignature,
  proofOfDelivery,
  destination,
  waybillNumber,
}: DeliveryStatusViewProps) {
  // Show this view when cargo has arrived at destination (IN_TRANSIT status)
  if (status === 'IN_TRANSIT') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 border-4 border-blue-200 animate-pulse">
            <Package className="w-10 h-10 text-blue-600" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-black text-blue-900 mb-2">
              Cargo Has Arrived! 🎉
            </h2>
            <p className="text-lg text-blue-700 font-semibold">
              Your shipment is at {destination}
            </p>
          </div>

          {/* Message */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <p className="text-blue-900 font-bold mb-2">
                  Waiting for Pickup
                </p>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Your cargo has safely arrived at the destination and is ready for collection. 
                  Please contact our staff or wait for the delivery confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Waybill Info */}
          <div className="bg-blue-100/50 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
              Waybill Number
            </p>
            <p className="text-xl font-mono font-black text-blue-900">
              {waybillNumber}
            </p>
          </div>

          {/* Note */}
          <p className="text-sm text-blue-600 italic">
            The tracking map will be available again once delivery is confirmed by our staff.
          </p>
        </div>
      </div>
    );
  }

  // Show this view when cargo has been delivered (DELIVERED status)
  if (status === 'DELIVERED') {
    const deliveryDate = deliveredAt ? new Date(deliveredAt) : null;

    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200 shadow-xl">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 border-4 border-green-200">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-black text-green-900 mb-2">
              Cargo Delivered Successfully! ✅
            </h2>
            <p className="text-lg text-green-700 font-semibold">
              Your shipment has been picked up
            </p>
          </div>

          {/* Delivery Details */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-green-200 space-y-4">
            {/* Delivery Time */}
            {deliveryDate && (
              <div className="flex items-center justify-between py-3 border-b border-green-100">
                <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                  Delivered At
                </span>
                <span className="text-green-900 font-bold">
                  {format(deliveryDate, 'PPpp')}
                </span>
              </div>
            )}

            {/* Received By */}
            {receivedBy && (
              <div className="flex items-center justify-between py-3 border-b border-green-100">
                <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                  Received By
                </span>
                <span className="text-green-900 font-bold">
                  {receivedBy}
                </span>
              </div>
            )}

            {/* Destination */}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                Destination
              </span>
              <span className="text-green-900 font-bold">
                {destination}
              </span>
            </div>
          </div>

          {/* Proof of Delivery Actions */}
          {(proofOfDelivery || receiverSignature) && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wide">
                Proof of Delivery
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Preview Button */}
                <button
                  onClick={() => {
                    const proof = proofOfDelivery || receiverSignature;
                    if (proof) {
                      // Open in new window
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(`
                          <html>
                            <head>
                              <title>Proof of Delivery - ${waybillNumber}</title>
                              <style>
                                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
                                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                              </style>
                            </head>
                            <body>
                              <img src="${proof}" alt="Proof of Delivery" />
                            </body>
                          </html>
                        `);
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Eye className="w-5 h-5" />
                  Preview Proof
                </button>

                {/* Download Button */}
                <button
                  onClick={() => {
                    const proof = proofOfDelivery || receiverSignature;
                    if (proof) {
                      const link = document.createElement('a');
                      link.href = proof;
                      link.download = `POD_${waybillNumber}_${Date.now()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-green-700 font-bold rounded-xl border-2 border-green-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Download Proof
                </button>
              </div>
            </div>
          )}

          {/* Waybill Info */}
          <div className="bg-green-100/50 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">
              Waybill Number
            </p>
            <p className="text-xl font-mono font-black text-green-900">
              {waybillNumber}
            </p>
          </div>

          {/* Thank You Message */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-green-200">
            <p className="text-green-800 font-semibold">
              Thank you for choosing our logistics service! 🚚
            </p>
            <p className="text-sm text-green-600 mt-1">
              We hope to serve you again soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For other statuses, return null (show normal tracking)
  return null;
}
