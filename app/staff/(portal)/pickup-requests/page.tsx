"use client";

import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle, Clock, PackagePlus, Search, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PickupRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/pickup-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueWaybill = (request: any) => {
    // Navigate to create shipment page with pre-filled data
    const query = new URLSearchParams({
      senderName: request.senderName,
      senderPhone: request.senderPhone,
      pickupAddress: request.pickupAddress,
      destination: request.destination,
      cargoDetails: request.cargoDetails,
      weight: request.estimatedWeight || '',
      pickupRequestId: request.id
    }).toString();
    
    router.push(`/staff/shipments/create?${query}`);
  };

  const filteredRequests = requests.filter(req => 
    req.senderName.toLowerCase().includes(search.toLowerCase()) ||
    req.senderPhone.includes(search) ||
    req.pickupAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pickup Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer pickup requests and issue waybills.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search requests..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Requests Found</h3>
              <p className="text-slate-500">There are no pending pickup requests matching your search.</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className={`bg-white dark:bg-slate-800 p-6 rounded-xl border transition-all hover:shadow-md flex flex-col md:flex-row gap-6 items-start md:items-center justify-between
                  ${req.status === 'ISSUED' ? 'border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700'}
                `}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border
                      ${req.status === 'ISSUED' 
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'}
                    `}>
                      {req.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{req.senderName}</h3>
                      <p className="text-sm text-slate-500">{req.senderPhone}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-900 dark:text-white">Pickup:</span> {req.pickupAddress}</p>
                      <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-900 dark:text-white">Dest:</span> {req.destination}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold">Cargo:</span> {req.cargoDetails}</p>
                    {req.estimatedWeight && <p className="text-slate-500 mt-1">Est. Weight: {req.estimatedWeight}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {req.status === 'PENDING' ? (
                    <button
                      onClick={() => handleIssueWaybill(req)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Issue Waybill
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      Waybill Issued
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
