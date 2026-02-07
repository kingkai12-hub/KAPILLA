"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Package, MapPin, Scale, FileText } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <style>
        {`
          @page {
            size: A4;
            margin: 8mm;
          }
          @media print {
            .no-break {
              break-inside: avoid-page;
              page-break-inside: avoid;
            }
            .print-hidden {
              display: none !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>

      <button
        onClick={handlePrint}
        className="mb-6 print-hidden flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition-all"
      >
        <Printer className="w-5 h-5" />
        Print Waybill
      </button>

      <div className="w-full overflow-x-auto">
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl box-border relative text-black font-sans text-sm mx-auto no-break">
          <div className="bg-white p-3 border-b border-slate-200">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-white rounded-lg">
                  <img src="/logo.png" alt="Logo" className="w-36 h-36 object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-black leading-tight tracking-wide">KAPILLA GROUP LIMITED</div>
                  <div className="text-[11px] font-bold leading-snug text-slate-700">
                    <div>P.O. BOX 71729, Dar es Salaam, Tanzania</div>
                    <div>Tel: +255 766 724 062 | +255 756 656 218</div>
                    <div>Email: express@kapillagroup.co.tz</div>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-600">Waybill / Consignment Note</div>
                <div className="mt-1 inline-block rounded-lg bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200">
                  <div className="text-[10px] font-semibold uppercase text-slate-600">Tracking No</div>
                  <div className="text-xl font-mono font-bold leading-tight">{data.waybillNumber}</div>
                </div>
              </div>
            </div>
          </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-800" />
                <div className="text-xs font-semibold text-slate-700 uppercase">Shipment</div>
              </div>
              <div className="mt-1 text-xs text-slate-600">Date: {new Date(data.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="bg-white p-2 rounded-md border border-slate-200">
              <QRCodeSVG value={`https://kapillagroup.vercel.app/waybill/${encodeURIComponent(data.waybillNumber)}`} size={64} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <div className="text-[10px] font-semibold uppercase text-slate-500">Origin</div>
              </div>
              <div className="mt-1 text-lg font-bold uppercase text-slate-900">{data.origin}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-700" />
                <div className="text-[10px] font-semibold uppercase text-slate-500">Destination</div>
              </div>
              <div className="mt-1 text-lg font-bold uppercase text-slate-900">{data.destination}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase text-slate-800">From (Sender)</div>
              <div className="mt-2">
                <div className="text-sm font-semibold text-slate-900">{data.senderName}</div>
                <div className="text-xs text-slate-700">{data.senderPhone}</div>
                <div className="mt-1 text-xs uppercase text-slate-700">{data.senderAddress}</div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold uppercase text-slate-800">To (Receiver)</div>
              <div className="mt-2">
                <div className="text-sm font-semibold text-slate-900">{data.receiverName}</div>
                <div className="text-xs text-slate-700">{data.receiverPhone}</div>
                <div className="mt-1 text-xs uppercase text-slate-700">{data.receiverAddress}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-700">Shipment Particulars</div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-white">
                  <th className="border-t border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 w-[35%]">Type</th>
                  <th className="border-t border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 w-[25%]">
                    <span className="inline-flex items-center gap-1 justify-center">
                      <Scale className="w-3.5 h-3.5" />
                      Weight
                    </span>
                  </th>
                  <th className="border-t border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 w-[40%]">Service</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-t border-slate-200 px-3 py-2 font-semibold">{data.type || 'Standard'}</td>
                  <td className="border-t border-slate-200 px-3 py-2 text-center font-semibold">{data.weight}</td>
                  <td className="border-t border-slate-200 px-3 py-2 text-center">Standard Delivery</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" />
              <div className="text-xs font-bold uppercase text-slate-700">Cargo Details</div>
            </div>
            <div className="mt-2 text-xs text-slate-800">{data.cargoDetails || 'No additional details provided.'}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-bold uppercase text-slate-800">Dispatched By (Dispatcher/Agent)</div>
              <div className="mt-2 grid gap-2">
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Name:</div>
                  <div className="border-b border-dotted border-slate-500 font-mono text-xs font-semibold uppercase">{data.dispatcherName || '_________________'}</div>
                </div>
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Sign (ID):</div>
                  <div className="border-b border-dotted border-slate-500 font-mono text-xs font-semibold uppercase">{data.dispatcherSignature || '_________________'}</div>
                </div>
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Date:</div>
                  <div className="border-b border-dotted border-slate-500 font-mono text-xs font-semibold">{data.createdAt ? new Date(data.createdAt).toLocaleString() : '_________________'}</div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-bold uppercase text-slate-800">Received By (Consignee)</div>
              <div className="mt-2 grid gap-2">
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Name:</div>
                  <div className="border-b border-dotted border-slate-500 font-mono text-xs font-semibold">{data.receivedBy || ''}</div>
                </div>
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">ID No:</div>
                  <div className="border-b border-dotted border-slate-500" />
                </div>
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Signature:</div>
                  <div className="border-b border-dotted border-slate-500 h-8 relative">
                    {data.receiverSignature && (
                      <img
                        src={data.receiverSignature}
                        alt="Signature"
                        className="h-full object-contain mix-blend-multiply absolute bottom-0 left-0"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[62px_1fr] gap-2 items-end">
                  <div className="text-[11px] text-slate-600">Date:</div>
                  <div className="border-b border-dotted border-slate-500 font-mono text-xs font-semibold">{data.currentStatus === 'DELIVERED' ? new Date(data.updatedAt).toLocaleDateString() : ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-2 text-[9px] text-slate-500 leading-tight">
            <div className="font-bold text-slate-600">TERMS AND CONDITIONS OF CARRIAGE</div>
            <div className="mt-1">
              1. Kapilla Group Limited (hereinafter referred to as "The Carrier") accepts goods for carriage subject to the conditions herein.
              2. The Carrier shall not be liable for any loss or damage to goods unless such loss or damage is proven to be caused by the negligence of the Carrier.
              3. The Carrier's liability is limited to the declared value of the goods or a maximum liability limit as per standard policy, whichever is lower.
              4. Claims must be notified in writing within 7 days of delivery.
              5. This waybill constitutes the entire agreement between the parties.
            </div>
            <div className="mt-2 text-center font-bold text-slate-600">THANK YOU FOR CHOOSING KAPILLA GROUP LIMITED</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
