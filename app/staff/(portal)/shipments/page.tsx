"use client";

import React, { useEffect, useState } from 'react';
import { Package, Search, Printer, Trash2, Eye, FileText, CheckCircle, ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      }
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (waybill: string) => {
    if (!confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/shipments/${waybill}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShipments(shipments.filter(s => s.waybillNumber !== waybill));
      } else {
        alert('Failed to delete shipment');
      }
    } catch (error) {
      console.error("Failed to delete", error);
      alert('Error deleting shipment');
    }
  };

  const filteredShipments = shipments.filter(s => 
    s.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shipments</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track all shipments</p>
        </div>
        <Link 
          href="/staff/shipments/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          New Shipment
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Waybill, Sender, or Receiver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Waybill</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Receiver</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading shipments...</td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No shipments found</td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr key={shipment.waybillNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                      {shipment.waybillNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{shipment.senderName}</div>
                      <div className="text-xs text-slate-400">{shipment.origin}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{shipment.receiverName}</div>
                      <div className="text-xs text-slate-400">{shipment.destination}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${shipment.currentStatus === 'DELIVERED' 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                        }
                      `}>
                        {shipment.currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Update Status */}
                        <Link
                          href={`/staff/tracking/update?waybill=${shipment.waybillNumber}`}
                          title="Update Status"
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        >
                          <ScanLine className="w-4 h-4" />
                        </Link>

                        {/* Print Waybill */}
                        <button
                          onClick={() => window.open(`/staff/shipments/${shipment.waybillNumber}/label`, '_blank')}
                          title="Print Waybill / POD Form"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Print POD (if delivered) */}
                        {shipment.currentStatus === 'DELIVERED' && (
                          <button
                            onClick={() => window.open(`/staff/shipments/${shipment.waybillNumber}/pod`, '_blank')}
                            title="Print Signed POD"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(shipment.waybillNumber)}
                          title="Delete Shipment"
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
