"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Package, Truck, Calendar, MapPin, Phone } from 'lucide-react';
import { db } from '@/lib/db';

// We need to fetch data client-side or use a server component. 
// Since this is a "use client" component (due to window.print), we'll fetch data.
// For now, I'll assume the params are passed and I might need to fetch details if not available.
// However, the previous implementation didn't fetch real data, it just used static/placeholder data except for the waybill number.
// I should probably try to fetch the real shipment data if possible.

export default function LabelPage({ params }: { params: { waybill: string } }) {
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch shipment details to populate the label
    const fetchShipment = async () => {
      try {
        const res = await fetch(`/api/shipments/${params.waybill}`);
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
  }, [params.waybill]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Label...</div>;
  }

  // Fallback if shipment not found (or just use params for basic display if desired)
  const data = shipment || {
    waybillNumber: params.waybill,
    senderName: 'Sender Name',
    senderPhone: 'Sender Phone',
    senderAddress: 'Sender Address',
    receiverName: 'Receiver Name',
    receiverPhone: 'Receiver Phone',
    receiverAddress: 'Receiver Address',
    origin: 'Origin City',
    destination: 'Destination City',
    weight: '0.0',
    type: 'Parcel',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Print Button (Hidden when printing) */}
      <button
        onClick={handlePrint}
        className="mb-8 flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-blue-800 transition-all hover:scale-105 print:hidden"
      >
        <Printer className="w-5 h-5" />
        Print Waybill
      </button>

      {/* Label Container - Standard 4x6 inch (100x150mm) approx */}
      <div className="bg-white w-[100mm] min-h-[150mm] shadow-2xl flex flex-col border border-gray-300 print:shadow-none print:border-none box-border relative overflow-hidden text-black font-sans">
        
        {/* Header Section */}
        <div className="border-b-2 border-black p-4 flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">KAPILLA<span className="text-blue-900 print:text-black">GROUP</span></h1>
            <p className="text-[10px] font-bold uppercase mt-1">Kapilla Group Limited</p>
            <p className="text-[9px] leading-tight">P.O. BOX 71729</p>
            <p className="text-[9px] leading-tight">DAR ES SALAAM, TANZANIA</p>
          </div>
          <div className="text-right">
             <div className="border-2 border-black px-2 py-1 inline-block">
                <p className="text-xs font-bold uppercase">Standard</p>
             </div>
          </div>
        </div>

        {/* Waybill & Barcode Section */}
        <div className="border-b-2 border-black p-4 flex flex-col items-center justify-center bg-gray-50 print:bg-white">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-500">Waybill Number</p>
          <h2 className="text-4xl font-mono font-black tracking-wider mb-3">{data.waybillNumber}</h2>
          <QRCodeSVG value={`https://kapilla-group.com/track/${data.waybillNumber}`} size={80} level="H" />
        </div>

        {/* Route Section */}
        <div className="flex border-b-2 border-black">
          <div className="w-1/2 p-3 border-r-2 border-black">
             <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Origin</p>
             <p className="text-xl font-black uppercase leading-none">{data.origin}</p>
          </div>
          <div className="w-1/2 p-3">
             <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Destination</p>
             <p className="text-xl font-black uppercase leading-none">{data.destination}</p>
          </div>
        </div>

        {/* Address Details */}
        <div className="flex-1 grid grid-cols-1 divide-y-2 divide-black">
          {/* Sender */}
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase bg-black text-white inline-block px-1 mb-1">FROM (SENDER)</p>
            <p className="font-bold text-sm">{data.senderName}</p>
            <p className="text-xs">{data.senderPhone}</p>
            <p className="text-xs text-gray-700 leading-tight mt-1 uppercase">{data.senderAddress}</p>
          </div>

          {/* Receiver */}
          <div className="p-3">
             <p className="text-[10px] font-bold uppercase bg-black text-white inline-block px-1 mb-1">TO (RECEIVER)</p>
             <p className="font-bold text-lg">{data.receiverName}</p>
             <p className="text-sm">{data.receiverPhone}</p>
             <p className="text-xs text-gray-700 leading-tight mt-1 uppercase">{data.receiverAddress}</p>
          </div>
        </div>

        {/* Shipment Details Footer */}
        <div className="border-t-2 border-black p-3 grid grid-cols-3 gap-2 bg-gray-50 print:bg-white">
           <div>
              <p className="text-[9px] font-bold uppercase text-gray-500">Weight</p>
              <p className="text-sm font-bold">{data.weight} KG</p>
           </div>
           <div>
              <p className="text-[9px] font-bold uppercase text-gray-500">Type</p>
              <p className="text-sm font-bold uppercase">{data.type}</p>
           </div>
           <div>
              <p className="text-[9px] font-bold uppercase text-gray-500">Date</p>
              <p className="text-sm font-bold">{new Date(data.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
        
        {/* Disclaimer / Footer */}
        <div className="border-t-2 border-black p-2 text-center">
           <p className="text-[8px] uppercase text-gray-500 leading-tight">
             Received in good order and condition. Subject to Kapilla Group Ltd Terms & Conditions.
             <br/>
             Authorized Signature _______________________
           </p>
        </div>
      </div>
      
      <p className="mt-6 text-gray-500 text-sm print:hidden">Tip: Adjust print settings to "None" for margins.</p>
    </div>
  );
}
