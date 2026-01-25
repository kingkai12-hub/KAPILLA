"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { ScanLine, Save, RotateCcw, PenTool, Printer } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useSearchParams } from 'next/navigation';

function UpdateTrackingContent() {
  const searchParams = useSearchParams();
  const [waybill, setWaybill] = useState('');
  
  useEffect(() => {
    const queryWaybill = searchParams.get('waybill');
    if (queryWaybill) {
      setWaybill(queryWaybill);
    }
  }, [searchParams]);

  const [status, setStatus] = useState('IN_TRANSIT');
  const [location, setLocation] = useState('Dar es Salaam Hub');
  const [remarks, setRemarks] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  
  // Signature State
  const sigCanvas = useRef<any>(null);
  const [signature, setSignature] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybill) return;

    let signatureData = null;
    if (status === 'DELIVERED') {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      } else {
        alert('Please provide a signature for delivery.');
        return;
      }
      
      if (!receivedBy.trim()) {
        alert('Please enter the name of the receiver.');
        return;
      }
    }

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybillNumber: waybill,
          status,
          location,
          remarks,
          receivedBy: status === 'DELIVERED' ? receivedBy : undefined,
          signature: signatureData
        }),
      });

      if (res.ok) {
        const newScan = {
          id: Date.now(),
          waybill,
          status,
          location,
          time: new Date().toLocaleTimeString(),
        };

        setRecentScans([newScan, ...recentScans]);
        setWaybill(''); // Clear for next scan
        setRemarks('');
        setReceivedBy('');
        if (sigCanvas.current) sigCanvas.current.clear();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to update'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white text-slate-900 tracking-tight">Update Tracking</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Scan or enter waybill to update shipment status.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <form onSubmit={handleScan} className="p-8 space-y-6">
          
          {/* Waybill Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Waybill Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ScanLine className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={waybill}
                onChange={(e) => setWaybill(e.target.value.toUpperCase())}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono uppercase placeholder:text-slate-400"
                placeholder="Scan or type waybill..."
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Select */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full py-3 px-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="PENDING">Pending</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED_ATTEMPT">Failed Attempt</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full py-3 px-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. Dar es Salaam Hub"
              />
            </div>
          </div>

          {/* Receiver Info & Signature (Only visible if Delivered) */}
          {status === 'DELIVERED' && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              
              {/* Receiver Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Received By (Name)</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="block w-full py-3 px-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter receiver's name"
                  required={status === 'DELIVERED'}
                />
              </div>

              <div className="flex justify-between items-center mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <PenTool className="w-4 h-4" />
                  Receiver Signature
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden cursor-crosshair">
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'signature-canvas w-full h-40'
                  }} 
                  backgroundColor="transparent"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Sign above to confirm receipt.</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform active:scale-[0.98]"
          >
            <Save className="mr-2 h-5 w-5" />
            Update Status
          </button>
        </form>
      </div>

      {/* Recent Scans List */}
      {recentScans.length > 0 && (
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Updates</h3>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentScans.map((scan) => (
              <li key={scan.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{scan.waybill}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{scan.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      scan.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      scan.status === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {scan.status.replace(/_/g, ' ')}
                    </span>
                    {scan.status === 'DELIVERED' && (
                      <button
                        onClick={() => window.open(`/staff/shipments/${scan.waybill}/pod`, '_blank')}
                        className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                        title="Print Proof of Delivery"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-1 flex justify-between items-center text-xs text-slate-400">
                  <span>{scan.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function UpdateTrackingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdateTrackingContent />
    </Suspense>
  );
}