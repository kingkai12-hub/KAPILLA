"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Package, MapPin, Calendar, Phone, CreditCard, Scale, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function LabelPage() {
  const params = useParams();
  const rawWaybill = params?.waybill;
  const waybill = Array.isArray(rawWaybill) ? rawWaybill[0] : rawWaybill;

  const [shipment, setShipment] = useState<any>(null);
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
        console.error("Failed to fetch shipment", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [waybill]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-900">Loading Document...</div>;
  }

  // Fallback data
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
    weight: '0.0',
    type: '',
    price: 0,
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mb-8 flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-800 transition-all hover:scale-105 print:hidden"
      >
        <Printer className="w-5 h-5" />
        Print Waybill / POD
      </button>

      {/* A4 Document Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full print:h-full box-border relative text-black font-sans text-sm">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Logo Placeholder */}
            <div className="w-16 h-16 bg-blue-900 text-white flex items-center justify-center rounded-lg font-bold text-3xl print:text-black print:border-2 print:border-black print:bg-transparent">K</div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-black">Kapilla Group Limited</h1>
              <div className="text-xs font-bold text-gray-600 print:text-black space-y-0.5 mt-1">
                <p>P.O. BOX 71729</p>
                <p>DAR ES SALAAM, TANZANIA</p>
                <p>Tel: +255 123 456 789</p>
                <p>Email: info@kapilla-group.com</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter">PROOF OF DELIVERY</h2>
            <p className="text-xs font-bold uppercase text-black mt-1">Consignment Note</p>
            <div className="mt-2 border-2 border-black p-2 inline-block">
              <p className="text-lg font-mono font-bold">{data.waybillNumber}</p>
            </div>
          </div>
        </div>

        {/* Barcode / QR Section */}
        <div className="flex justify-between items-center mb-6 bg-gray-50 print:bg-transparent p-4 border border-gray-200 print:border-black rounded-lg">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-gray-500 print:text-black mb-1">Tracking Number</p>
            <p className="text-xl font-mono font-bold">{data.waybillNumber}</p>
            <p className="text-xs text-gray-500 print:text-black mt-1">Date: {new Date(data.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <QRCodeSVG value={`https://kapilla-group.com/track/${data.waybillNumber}`} size={80} />
          </div>
        </div>

        {/* Route Info */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black mb-6">
          <div className="p-3 border-r-2 border-black">
            <p className="text-[10px] font-bold uppercase text-gray-500 print:text-black mb-1">Origin</p>
            <p className="text-xl font-black uppercase">{data.origin}</p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase text-gray-500 print:text-black mb-1">Destination</p>
            <p className="text-xl font-black uppercase">{data.destination}</p>
          </div>
        </div>

        {/* Sender & Receiver Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Sender */}
          <div className="border border-gray-300 print:border-black rounded p-4">
            <h3 className="text-xs font-bold uppercase bg-black text-white print:text-black print:bg-transparent print:border print:border-black inline-block px-2 py-0.5 mb-3">From (Sender)</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{data.senderName}</p>
              <p className="text-sm">{data.senderPhone}</p>
              <p className="text-sm uppercase mt-2">{data.senderAddress}</p>
            </div>
          </div>

          {/* Receiver */}
          <div className="border border-gray-300 print:border-black rounded p-4">
            <h3 className="text-xs font-bold uppercase bg-black text-white print:text-black print:bg-transparent print:border print:border-black inline-block px-2 py-0.5 mb-3">To (Receiver)</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{data.receiverName}</p>
              <p className="text-sm">{data.receiverPhone}</p>
              <p className="text-sm uppercase mt-2">{data.receiverAddress}</p>
            </div>
          </div>
        </div>

        {/* Shipment Details Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase text-black mb-2">Shipment Particulars</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead className="bg-gray-100 print:bg-gray-200">
              <tr>
                <th className="border border-black p-2 text-left w-1/4">Type</th>
                <th className="border border-black p-2 text-center w-1/4">Weight (KG)</th>
                <th className="border border-black p-2 text-center w-1/4">Service</th>
                <th className="border border-black p-2 text-right w-1/4">Declared Value (TZS)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-3 font-bold">{data.type || 'Standard'}</td>
                <td className="border border-black p-3 text-center font-bold">{data.weight}</td>
                <td className="border border-black p-3 text-center">Standard Delivery</td>
                <td className="border border-black p-3 text-right font-bold">{data.price?.toLocaleString() || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Instructions */}
        <div className="mb-8 border border-black p-3 h-20">
          <p className="text-[10px] font-bold uppercase text-black mb-1">Special Instructions / Remarks</p>
          <p className="text-sm italic">{data.remarks || 'None'}</p>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-2 gap-8 mt-auto">
          {/* Dispatch / Driver */}
          <div className="border-t-2 border-black pt-2">
             <p className="text-xs font-bold uppercase mb-8">Dispatched By (Driver/Agent):</p>
             <div className="space-y-4">
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Name:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Signature:</span>
                   <div className="flex-1 border-b border-dotted border-black h-8"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Date:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
             </div>
          </div>

          {/* Receiver */}
          <div className="border-t-2 border-black pt-2">
             <p className="text-xs font-bold uppercase mb-8">Received By (Consignee):</p>
             <div className="space-y-4">
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Name:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">ID No:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Signature:</span>
                   <div className="flex-1 border-b border-dotted border-black h-8"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Date:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="mt-8 pt-4 border-t border-gray-300 print:border-black text-[9px] text-gray-500 print:text-black text-justify leading-tight">
          <p className="font-bold mb-1">TERMS AND CONDITIONS OF CARRIAGE</p>
          <p>
            1. Kapilla Group Limited (hereinafter referred to as "The Carrier") accepts goods for carriage subject to the conditions herein.
            2. The Carrier shall not be liable for any loss or damage to goods unless such loss or damage is proven to be caused by the negligence of the Carrier.
            3. The Carrier's liability is limited to the declared value of the goods or a maximum liability limit as per standard policy, whichever is lower.
            4. Claims must be notified in writing within 7 days of delivery.
            5. This waybill constitutes the entire agreement between the parties.
          </p>
          <p className="mt-2 text-center font-bold">THANK YOU FOR CHOOSING KAPILLA GROUP LIMITED</p>
        </div>

      </div>
    </div>
  );
}