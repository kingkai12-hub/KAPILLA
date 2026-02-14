"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Package, Search, Printer, Trash2, Eye, FileText, CheckCircle, ScanLine, Edit, X } from 'lucide-react';
import Link from 'next/link';
import SignatureCanvas from 'react-signature-canvas';
import { locationCoords } from '@/lib/locations';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  // Status Edit State
  const [editingStatusShipment, setEditingStatusShipment] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateLocation, setUpdateLocation] = useState('Dar es Salaam'); // Default location
  const [receivedBy, setReceivedBy] = useState('');
  const sigCanvas = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchShipments();
    // Get user role from local storage
    const userStr = localStorage.getItem('kapilla_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || '');
    }
  }, []);

  const fetchShipments = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch('/api/shipments', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      } else {
        console.error("Failed to fetch shipments, status:", res.status);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("Fetch shipments timed out");
      } else {
        console.error("Failed to fetch shipments", error);
      }
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

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatusShipment) return;
    setIsSubmitting(true);

    let signatureData = null;
    if (newStatus === 'DELIVERED') {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        } else if (!editingStatusShipment.receiverSignature) {
             alert('Please provide a signature');
             setIsSubmitting(false);
             return;
        }
        
        if (!receivedBy && !editingStatusShipment.receivedBy) {
             alert('Please enter receiver name');
             setIsSubmitting(false);
             return;
        }
    }

    try {
        const res = await fetch(`/api/shipments/${editingStatusShipment.waybillNumber}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: newStatus,
                signature: signatureData,
                receivedBy: receivedBy || editingStatusShipment.receivedBy,
                location: updateLocation // Add the location to the request body
            })
        });

        if (res.ok) {
            setEditingStatusShipment(null);
            fetchShipments();
            setReceivedBy('');
            setNewStatus('');
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to update status');
        }
    } catch (error) {
        console.error(error);
        alert('Error updating status');
    } finally {
        setIsSubmitting(false);
    }
  };

  const openStatusModal = (shipment: any) => {
    setEditingStatusShipment(shipment);
    setNewStatus(shipment.currentStatus);
    setReceivedBy(shipment.receivedBy || '');
  };

  const filteredShipments = shipments.filter(s => 
    s.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Status Edit Modal */}
      {editingStatusShipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg dark:text-white">Update Status</h3>
              <button 
                onClick={() => setEditingStatusShipment(null)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Location</label>
                <select
                  value={updateLocation}
                  onChange={(e) => setUpdateLocation(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white"
                >
                   {Object.keys(locationCoords).map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
              </div>

              {newStatus === 'DELIVERED' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Received By</label>
                    <input
                      type="text"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white"
                      placeholder="Receiver's Name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Signature</label>
                    <div className="border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white max-w-full overflow-x-auto">
                      <SignatureCanvas 
                        ref={sigCanvas}
                        penColor="black"
                        canvasProps={{width: 320, height: 140, className: 'signature-canvas'}} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => sigCanvas.current?.clear()}
                      className="text-xs text-red-500 mt-1 hover:underline"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shipments</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track all shipments</p>
        </div>
        <Link 
          href="/staff/shipments/create"
          className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold w-full sm:w-auto"
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
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-medium">
              <tr>
                <th className="px-3 sm:px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Waybill</th>
                <th className="px-3 sm:px-6 py-4">Sender</th>
                <th className="px-3 sm:px-6 py-4">Receiver</th>
                <th className="px-3 sm:px-6 py-4">Status</th>
                <th className="px-3 sm:px-6 py-4">Date</th>
                <th className="px-3 sm:px-6 py-4 text-right">Actions</th>
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
                    <td className="px-3 sm:px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900">
                      {shipment.waybillNumber}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{shipment.senderName}</div>
                      <div className="text-xs text-slate-400">{shipment.origin}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{shipment.receiverName}</div>
                      <div className="text-xs text-slate-400">{shipment.destination}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${shipment.currentStatus === 'DELIVERED' 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                        }
                      `}>
                        {shipment.currentStatus}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Status - New (Disabled if Delivered) */}
                        {shipment.currentStatus !== 'DELIVERED' && (
                          <button
                            onClick={() => openStatusModal(shipment)}
                            title="Edit Shipment Status"
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Add Location Scan */}
                        <Link
                          href={`/staff/tracking/update?waybill=${shipment.waybillNumber}`}
                          title="Add Tracking Scan"
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

                        {/* Delete - Only Admin */}
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(shipment.waybillNumber)}
                            title="Delete Shipment"
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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