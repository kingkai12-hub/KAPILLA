"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function ProofOfDeliveryPage() {
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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipment();
  }, [waybill]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center">Loading Receipt...</div>;
  if (!shipment) return <div className="p-8 text-center">Shipment not found.</div>;

  // Only allow printing if delivered
  const isDelivered = shipment.currentStatus === 'DELIVERED';

  if (!isDelivered) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipt Unavailable</h1>
          <p className="text-gray-600 mb-6">
            Proof of Delivery can only be generated after the shipment has been marked as <strong>DELIVERED</strong>.
          </p>
          <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
            Current Status: <span className="font-bold text-blue-600">{shipment.currentStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="mb-8 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition-transform hover:scale-105 print:hidden"
      >
        <Printer className="w-5 h-5" />
        Print Proof of Delivery
      </button>

      {/* A4 Paper Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl print:shadow-none print:w-[210mm] print:h-auto print:min-h-0 box-border relative text-black mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain print:invert-0" />
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
            <p className="text-sm font-mono mt-1 text-black font-bold">REF: {shipment.waybillNumber}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-green-800 font-bold text-lg">Shipment Delivered Successfully</p>
            <p className="text-green-600 text-sm">Confirmed on {new Date(shipment.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold uppercase text-black mb-4 tracking-wider border-b pb-2">Sender Information</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{shipment.senderName}</p>
              <p className="text-black">{shipment.senderPhone}</p>
              <p className="text-black">{shipment.senderAddress || 'N/A'}</p>
              <p className="text-sm text-black mt-2">Origin: {shipment.origin}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-black mb-4 tracking-wider border-b pb-2">Receiver Information</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{shipment.receiverName}</p>
              <p className="text-black">{shipment.receiverPhone}</p>
              <p className="text-black">{shipment.receiverAddress || 'N/A'}</p>
              <p className="text-sm text-black mt-2">Destination: {shipment.destination}</p>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="mb-12">
          <h3 className="text-xs font-bold uppercase text-black mb-4 tracking-wider border-b pb-2">Shipment Details</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 print:bg-transparent">
              <tr>
                <th className="text-left p-3 font-semibold text-black">Description</th>
                <th className="text-left p-3 font-semibold text-black">Weight</th>
                <th className="text-left p-3 font-semibold text-black">Service</th>
                <th className="text-right p-3 font-semibold text-black">Declared Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 print:border-black">
                <td className="p-3">
                  <p className="font-bold">{shipment.type}</p>
                  <p className="text-xs text-gray-600 print:text-black">{shipment.cargoDetails}</p>
                </td>
                <td className="p-3">{shipment.weight} KG</td>
                <td className="p-3">Standard Ground</td>
                <td className="p-3 text-right">Tzs {shipment.price?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="border-2 border-slate-900 rounded-xl p-6 mb-8 bg-slate-50">
          <h3 className="text-sm font-bold uppercase text-slate-900 mb-6 text-center">Receiver Acknowledgment</h3>
          
          <div className="flex justify-around items-end">
            <div className="text-center">
              {shipment.receiverSignature ? (
                <img src={shipment.receiverSignature} alt="Signature" className="h-20 mx-auto mb-2 mix-blend-multiply" />
              ) : (
                <div className="h-20 w-32 border-b border-dashed border-slate-400 mx-auto mb-2"></div>
              )}
              <p className="text-xs font-bold border-t border-slate-300 pt-2 px-8 uppercase">Signature</p>
            </div>

            <div className="text-center">
              <div className="h-20 flex items-end justify-center pb-2">
                 <span className="text-lg font-mono font-bold">{shipment.receivedBy || shipment.receiverName}</span>
              </div>
              <p className="text-xs font-bold border-t border-slate-300 pt-2 px-8 uppercase">Received By</p>
            </div>

            <div className="text-center">
              <div className="h-20 flex items-end justify-center pb-2">
                <span className="text-lg font-mono">{new Date(shipment.updatedAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs font-bold border-t border-slate-300 pt-2 px-8 uppercase">Time</p>
            </div>
          </div>
          
          <p className="text-[10px] text-black text-center mt-6">
            By signing above, the receiver acknowledges receipt of the shipment in good order and condition.
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] flex justify-between items-center border-t border-black pt-4">
          <div className="text-xs text-black">
            <p>Kapilla Logistics Ltd.</p>
            <p>www.kapilla-group.com</p>
          </div>
          <QRCodeSVG value={`https://kapilla-group.com/track/${waybill}`} size={60} />
        </div>

      </div>
    </div>
  );
}