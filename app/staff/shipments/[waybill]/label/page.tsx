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
    cargoDetails: '',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
      <style>
        {`
          @page {
            size: A4;
            margin: 5mm;
          }
          @media print {
            .print-fit {
              transform: scale(0.85);
              transform-origin: top left;
            }
            .print-container {
              height: 280mm;
              max-height: 280mm;
              overflow: hidden;
            }
            .no-break {
              break-inside: avoid-page;
              page-break-inside: avoid;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mb-8 flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-800 transition-all hover:scale-105 print:hidden"
      >
        <Printer className="w-5 h-5" />
        Print Waybill / POD
      </button>

      {/* A4 Document Container */}
      <div className="bg-white w-[210mm] min-h-0 p-[15mm] shadow-2xl print:shadow-none print:w-full print:max-w-[210mm] box-border relative text-black font-sans text-sm mx-auto print:p-[3mm] print:m-0 print-fit print-container no-break">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div className="flex items-start gap-4">
            <img src="/logo.png" alt="Logo" className="w-64 h-64 -mt-8 object-contain print:w-20 print:h-20 print:mt-0 print:invert-0" />
            <div className="mt-8">
              {/* <h1 className="text-2xl font-black uppercase tracking-wide text-black">Kapilla Group Limited</h1> */}
              <div className="text-xs font-bold text-gray-600 print:text-black space-y-0.5 mt-1">
                <p>P.O. BOX 71729</p>
                <p>DAR ES SALAAM, TANZANIA</p>
                <p>Tel: +255 766 724 062</p>
                <p>Tel: +255 756 656 218</p>
                <p>Email: express@kapillagroup.co.tz</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl print:text-xl font-black text-black uppercase tracking-tighter">WAYBILL</h2>
            <p className="text-xs font-bold uppercase text-black mt-1">Consignment Note</p>
            <div className="mt-2 border-2 border-black p-2 inline-block">
              <p className="text-lg font-mono font-bold">{data.waybillNumber}</p>
            </div>
          </div>
        </div>

        {/* Barcode / QR Section */}
        <div className="flex justify-between items-center mb-3 bg-gray-50 print:bg-transparent p-3 border border-gray-200 print:border-black rounded-lg no-break">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-gray-500 print:text-black mb-1">Tracking Number</p>
            <p className="text-base font-mono font-bold">{data.waybillNumber}</p>
            <p className="text-xs text-gray-500 print:text-black mt-1">Date: {new Date(data.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <QRCodeSVG value={data.waybillNumber} size={56} />
          </div>
        </div>

        {/* Route Info */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black mb-3 no-break">
          <div className="p-2 border-r-2 border-black">
            <p className="text-[10px] font-bold uppercase text-gray-500 print:text-black mb-1">Origin</p>
            <p className="text-lg font-black uppercase">{data.origin}</p>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-bold uppercase text-gray-500 print:text-black mb-1">Destination</p>
            <p className="text-lg font-black uppercase">{data.destination}</p>
          </div>
        </div>

        {/* Sender & Receiver Details */}
        <div className="grid grid-cols-2 gap-3 mb-3 no-break">
          {/* Sender */}
          <div className="border border-gray-300 print:border-black rounded p-3">
            <h3 className="text-xs font-bold uppercase bg-black text-white print:text-black print:bg-transparent print:border print:border-black inline-block px-2 py-0.5 mb-3">From (Sender)</h3>
            <div className="space-y-1">
              <p className="font-bold text-base">{data.senderName}</p>
              <p className="text-sm">{data.senderPhone}</p>
              <p className="text-sm uppercase mt-2">{data.senderAddress}</p>
            </div>
          </div>

          {/* Receiver */}
          <div className="border border-gray-300 print:border-black rounded p-3">
            <h3 className="text-xs font-bold uppercase bg-black text-white print:text-black print:bg-transparent print:border print:border-black inline-block px-2 py-0.5 mb-3">To (Receiver)</h3>
            <div className="space-y-1">
              <p className="font-bold text-base">{data.receiverName}</p>
              <p className="text-sm">{data.receiverPhone}</p>
              <p className="text-sm uppercase mt-2">{data.receiverAddress}</p>
            </div>
          </div>
        </div>

        {/* Shipment Details Table */}
        <div className="mb-3 no-break">
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
                <td className="border border-black p-2 font-bold">{data.type || 'Standard'}</td>
                <td className="border border-black p-2 text-center font-bold">{data.weight}</td>
                <td className="border border-black p-2 text-center">Standard Delivery</td>
                <td className="border border-black p-2 text-right font-bold">{data.price?.toLocaleString() || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Instructions */}
        <div className="mb-4 border border-black p-3 min-h-20 no-break">
          <p className="text-[10px] font-bold uppercase text-black mb-1">Cargo Details / Description</p>
          <p className="text-sm text-black">{data.cargoDetails || 'No additional details provided.'}</p>
          
          <div className="mt-4 border-t border-black pt-2">
            <p className="text-[10px] font-bold uppercase text-black mb-1">Remarks</p>
            <p className="text-sm italic text-black">{data.remarks || 'None'}</p>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-2 gap-4 mt-auto no-break">
          {/* Dispatch / Driver */}
          <div className="border-t-2 border-black pt-2">
             <p className="text-xs font-bold uppercase mb-3">Dispatched By (Dispatcher/Agent):</p>
             <div className="space-y-4">
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16 font-bold">Name:</span>
                   <div className="flex-1 border-b border-dotted border-black font-mono font-bold text-sm uppercase">
                     {data.dispatcherName || '_________________'}
                   </div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16 font-bold">Sign (ID):</span>
                   <div className="flex-1 border-b border-dotted border-black font-mono font-bold text-sm uppercase">
                     {data.dispatcherSignature || '_________________'}
                   </div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16 font-bold">Date:</span>
                   <div className="flex-1 border-b border-dotted border-black font-mono font-bold text-sm">
                     {data.createdAt ? new Date(data.createdAt).toLocaleString() : '_________________'}
                   </div>
                </div>
             </div>
          </div>

          {/* Receiver */}
          <div className="border-t-2 border-black pt-2">
             <p className="text-xs font-bold uppercase mb-6">Received By (Consignee):</p>
             <div className="space-y-4">
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Name:</span>
                   <div className="flex-1 border-b border-dotted border-black font-mono font-bold pl-2 text-sm">
                     {data.receivedBy || ''}
                   </div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">ID No:</span>
                   <div className="flex-1 border-b border-dotted border-black"></div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Signature:</span>
                   <div className="flex-1 border-b border-dotted border-black h-8 relative">
                     {data.receiverSignature && (
                       <img 
                         src={data.receiverSignature} 
                         alt="Signature" 
                         className="h-full object-contain mix-blend-multiply absolute bottom-0 left-0" 
                       />
                     )}
                   </div>
                </div>
                <div className="flex items-end gap-2">
                   <span className="text-xs w-16">Date:</span>
                   <div className="flex-1 border-b border-dotted border-black font-mono pl-2 text-sm">
                     {data.currentStatus === 'DELIVERED' ? new Date(data.updatedAt).toLocaleDateString() : ''}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="mt-5 pt-3 border-t border-gray-300 print:border-black text-[9px] text-gray-500 print:text-black text-justify leading-tight no-break">
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
