'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function LabelPage() {
  const params = useParams();
  const rawWaybill = params?.waybill;
  const waybill = Array.isArray(rawWaybill) ? rawWaybill[0] : rawWaybill;

  const [shipment, setShipment] = useState<{
    waybillNumber: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string | null;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string | null;
    origin: string;
    destination: string;
    weight: number | null;
    type: string | null;
    cargoDetails: string | null;
    createdAt: string;
    dispatcherName: string | null;
    dispatcherSignature: string | null;
    receivedBy: string | null;
    receiverSignature: string | null;
    currentStatus: string;
    deliveredAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!waybill) {
      setLoading(false);
      return;
    }

    const fetchShipment = async () => {
      try {
        const res = await fetch(`/api/shipments/${waybill}`);
        if (res.ok) {
          const data = await res.json();
          setShipment(data);
        }
      } catch (error) {
        console.error('Failed to fetch shipment', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [waybill]);

  const handlePrint = () => {
    window.open(`/api/shipments/${waybill}/pdf`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const data = shipment || {
    waybillNumber: waybill,
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    origin: '',
    destination: '',
    weight: 0,
    type: '',
    cargoDetails: '',
    createdAt: new Date().toISOString(),
    dispatcherName: null,
    dispatcherSignature: null,
    receivedBy: null,
    receiverSignature: null,
    currentStatus: '',
    deliveredAt: null,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            .print-hidden { display: none !important; }
            .print-container { box-shadow: none !important; margin: 0 !important; }
          }
        `}
      </style>

      <button
        onClick={handlePrint}
        className="mb-4 print-hidden flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800"
      >
        <Printer className="w-5 h-5" />
        Print Waybill
      </button>

      <div
        className="print-container bg-white max-w-[210mm] mx-auto p-8 shadow-lg"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header with logo in center */}
        <div className="border-b pb-1 mb-1">
          <div className="grid grid-cols-3 gap-2 items-start">
            {/* Left: Company Details */}
            <div>
              <h1 className="text-sm font-bold">KAPILLA GROUP LIMITED</h1>
              <p className="text-[10px] mt-0.5">P.O Box 71729</p>
              <p className="text-[10px]">Sea Cliff Village, 10 Toure Drive, Msasani</p>
              <p className="text-[10px]">Dar es Salaam, Tanzania</p>
              <p className="text-[10px]">Tel: +255 766 724 062</p>
              <p className="text-[10px]">Email: info@kapillagroup.co.tz</p>
            </div>

            {/* Center: Logo - moderate size */}
            <div className="flex justify-center items-center">
              <img
                src="/kapila logo.png"
                alt="Kapilla Logo"
                className="h-14 w-auto object-contain"
              />
            </div>

            {/* Right: Waybill Info */}
            <div className="text-right">
              <p className="text-[10px] uppercase">Waybill / Consignment Note</p>
              <p className="text-base font-bold mt-0.5">{data.waybillNumber}</p>
              <p className="text-[10px]">Date: {new Date(data.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-gray-100 p-3">
            <p className="text-xs font-bold">ORIGIN</p>
            <p className="text-lg font-bold uppercase">{data.origin}</p>
          </div>
          <div className="bg-gray-100 p-3">
            <p className="text-xs font-bold">DESTINATION</p>
            <p className="text-lg font-bold uppercase">{data.destination}</p>
          </div>
        </div>

        {/* Sender and Receiver */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border p-3">
            <p className="text-sm font-bold mb-2">FROM (SENDER)</p>
            <p className="font-semibold">{data.senderName}</p>
            <p className="text-sm">{data.senderPhone}</p>
            <p className="text-sm">{data.senderAddress}</p>
          </div>
          <div className="border p-3">
            <p className="text-sm font-bold mb-2">TO (RECEIVER)</p>
            <p className="font-semibold">{data.receiverName}</p>
            <p className="text-sm">{data.receiverPhone}</p>
            <p className="text-sm">{data.receiverAddress}</p>
          </div>
        </div>

        {/* Dispatcher and Receiver */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border p-3">
            <p className="text-sm font-bold mb-2">DISPATCHED BY</p>
            <p className="text-sm">Name: {data.dispatcherName || '_______________'}</p>
            <p className="text-sm">Sign: {data.dispatcherSignature || '_______________'}</p>
            <p className="text-sm">Date: {new Date(data.createdAt).toLocaleString()}</p>
          </div>
          <div className="border p-3">
            <p className="text-sm font-bold mb-2">RECEIVED BY</p>
            <p className="text-sm">Name: {data.receivedBy || '_______________'}</p>
            <p className="text-sm">ID No: _______________</p>
            {data.receiverSignature ? (
              <div className="mt-2">
                <p className="text-sm">Signature:</p>
                <img src={data.receiverSignature} alt="Signature" className="h-8 object-contain" />
              </div>
            ) : (
              <p className="text-sm">Signature: _______________</p>
            )}
            {data.deliveredAt && (
              <p className="text-sm">Date: {new Date(data.deliveredAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t pt-4">
          <p className="text-xs font-bold text-center mb-2">TERMS AND CONDITIONS OF CARRIAGE</p>
          <div className="text-xs space-y-1">
            <p>
              1. Kapilla Group Limited accepts goods for carriage subject to the conditions herein.
            </p>
            <p>
              2. The Carrier shall not be liable for any loss or damage unless proven to be caused
              by negligence.
            </p>
            <p>
              3. Liability is limited to the declared value or maximum policy limit, whichever is
              lower.
            </p>
            <p>4. Claims must be notified in writing within 7 days of delivery.</p>
            <p>5. This waybill constitutes the entire agreement between the parties.</p>
          </div>
          <p className="text-sm font-bold text-center mt-4">
            THANK YOU FOR CHOOSING KAPILLA GROUP LIMITED
          </p>
          {/* QR Code at bottom center */}
          <div className="flex justify-center mt-3">
            <QRCodeSVG
              value={`https://kapillagroup.vercel.app/waybill/${encodeURIComponent(data.waybillNumber)}`}
              size={80}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
