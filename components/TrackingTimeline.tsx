"use client";

import React from 'react';
import { CheckCircle, Truck, Package, MapPin, AlertCircle } from 'lucide-react';

// Types matching our schema roughly
export type TrackingEvent = {
  id: string;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'CUSTOMS_CLEARANCE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_ATTEMPT';
  location: string;
  timestamp: string;
  remarks?: string;
};

export type ShipmentData = {
  waybillNumber: string;
  origin: string;
  destination: string;
  currentStatus: TrackingEvent['status'];
  events: TrackingEvent[];
};

const statusConfig = {
  PENDING: { icon: Package, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Pending' },
  PICKED_UP: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Picked Up' },
  IN_TRANSIT: { icon: Truck, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'In Transit' },
  CUSTOMS_CLEARANCE: { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Customs Clearance' },
  OUT_FOR_DELIVERY: { icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Out for Delivery' },
  DELIVERED: { icon: Package, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
  FAILED_ATTEMPT: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed Attempt' },
};

export default function TrackingTimeline({ shipment }: { shipment: ShipmentData }) {
  // Sort events by date descending (newest first)
  const sortedEvents = [...shipment.events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Waybill: {shipment.waybillNumber}</h2>
          <p className="text-gray-500 text-sm mt-1">
            From <span className="font-medium text-gray-900">{shipment.origin}</span> to <span className="font-medium text-gray-900">{shipment.destination}</span>
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${statusConfig[shipment.currentStatus]?.bg || 'bg-gray-100'} ${statusConfig[shipment.currentStatus]?.color || 'text-gray-600'}`}>
          {statusConfig[shipment.currentStatus]?.label || shipment.currentStatus}
        </div>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 space-y-8">
        {sortedEvents.map((event, index) => {
          const Config = statusConfig[event.status] || statusConfig.PENDING;
          const Icon = Config.icon;
          const isLatest = index === 0;

          return (
            <div key={event.id} className="relative pl-8">
              {/* Timeline Dot */}
              <div className={`absolute -left-[9px] top-0 p-1 rounded-full border-2 bg-white ${isLatest ? 'border-blue-500 scale-110' : 'border-gray-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
              </div>

              {/* Content Card */}
              <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 ${isLatest ? 'opacity-100' : 'opacity-75'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-5 h-5 ${Config.color}`} />
                    <h3 className={`font-semibold text-lg ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>
                      {Config.label}
                    </h3>
                  </div>
                  <p className="text-gray-600 font-medium">{event.location}</p>
                  {event.remarks && (
                    <p className="text-gray-500 text-sm mt-1 italic">"{event.remarks}"</p>
                  )}
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
