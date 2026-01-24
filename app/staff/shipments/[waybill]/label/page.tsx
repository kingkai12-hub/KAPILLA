"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

export default function LabelPage({ params }: { params: { waybill: string } }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Print Button (Hidden when printing) */}
      <button
        onClick={handlePrint}
        className="mb-8 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 print:hidden"
      >
        <Printer className="w-5 h-5" />
        Print Label
      </button>

      {/* Label Container */}
      <div className="bg-white p-8 w-[100mm] h-[150mm] shadow-2xl flex flex-col justify-between border-2 border-gray-900 print:shadow-none print:border-2 print:border-black box-border relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter uppercase">Kapilla</h1>
            <p className="text-xs font-bold uppercase tracking-widest">Express Logistics</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-mono font-black">{params.waybill}</h2>
            <p className="text-xs font-bold mt-1">STANDARD GROUND</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex border-b-2 border-black py-4">
          <div className="w-1/2 border-r-2 border-black pr-4">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Origin</p>
            <p className="text-xl font-bold leading-none">DAR ES SALAAM</p>
            <p className="text-xs font-medium mt-1">Main Hub, TZ</p>
          </div>
          <div className="w-1/2 pl-4">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Destination</p>
            <p className="text-2xl font-black leading-none">MWANZA</p>
            <p className="text-xs font-medium mt-1">Rock City Branch</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 gap-4 py-4 border-b-2 border-black">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">To (Receiver)</p>
            <p className="text-sm font-bold">Jane Doe</p>
            <p className="text-xs">Plot 45, Kenyatta Road</p>
            <p className="text-xs">+255 755 123 456</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">From (Sender)</p>
            <p className="text-xs font-bold">John Smith</p>
            <p className="text-xs">Posta Mpya, Dar es Salaam</p>
          </div>
        </div>

        {/* Barcode Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
          <QRCodeSVG value={`https://kapilla-group.com/track/${params.waybill}`} size={120} />
          <p className="text-[10px] font-mono mt-2 text-center">Scan to update status or track shipment</p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black pt-2 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold">Weight: 2.5 KG</p>
            <p className="text-[10px] font-bold">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
             <p className="text-[8px] font-mono text-gray-500">Printed via Kapilla Staff Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
