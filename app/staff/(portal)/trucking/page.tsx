"use client";

import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { Truck, MapPin, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists or I'll use inline class logic

interface Trip {
  id: string;
  startLocation: string;
  endLocation: string;
  status: string;
  driver: { name: string };
  shipment?: { waybillNumber: string };
  checkIns: {
    latitude: number;
    longitude: number;
    location: string;
    status: string;
    timestamp: string;
  }[];
}

export default function TruckingDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTripData, setSelectedTripData] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all active trips
  useEffect(() => {
    fetchTrips();
  }, []);

  // Poll selected trip details
  useEffect(() => {
    if (!selectedTripId) return;

    fetchTripDetails(selectedTripId);
    const interval = setInterval(() => {
      fetchTripDetails(selectedTripId);
    }, 5000); // 5s poll

    return () => clearInterval(interval);
  }, [selectedTripId]);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/driver/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0 && !selectedTripId) {
          setSelectedTripId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/driver/trips/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTripData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentCheckIn = selectedTripData?.checkIns?.[selectedTripData.checkIns.length - 1];

  const mapCenter: [number, number] = currentCheckIn 
    ? [currentCheckIn.latitude, currentCheckIn.longitude]
    : [-6.3690, 34.8888]; // Default Tanzania

  const routePath: [number, number][] = selectedTripData?.checkIns?.map(c => [c.latitude, c.longitude]) || [];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar List */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Active Fleet
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{trips.length}</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-slate-500">Loading fleet...</div>
          ) : trips.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <Truck className="w-10 h-10 mb-2 opacity-20" />
              <p>No active trips</p>
            </div>
          ) : (
            trips.map(trip => (
              <button
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border",
                  selectedTripId === trip.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-200"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {trip.shipment?.waybillNumber || 'Unassigned'}
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                    trip.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {trip.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="truncate max-w-[80px]">{trip.startLocation}</span>
                  <span className="text-slate-300">→</span>
                  <span className="truncate max-w-[80px] font-medium text-slate-700 dark:text-slate-300">{trip.endLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {trip.driver.name.charAt(0)}
                  </div>
                  {trip.driver.name}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex flex-col">
        {selectedTripData ? (
          <>
            <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-700 mb-1">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Live Tracking: {selectedTripData.shipment?.waybillNumber}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  Last update: {currentCheckIn ? new Date(currentCheckIn.timestamp).toLocaleTimeString() : 'Not started'}
                </div>
              </div>
              
              {currentCheckIn && (
                <div className={cn(
                  "px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold",
                  currentCheckIn.status === 'BREAKDOWN' ? "bg-red-50 text-red-700 border border-red-200" :
                  currentCheckIn.status === 'RESTING' ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                  "bg-green-50 text-green-700 border border-green-200"
                )}>
                  {currentCheckIn.status === 'BREAKDOWN' && <AlertTriangle className="w-4 h-4" />}
                  Status: {currentCheckIn.status}
                </div>
              )}
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-100">
              <Map 
                center={mapCenter}
                zoom={currentCheckIn ? 13 : 6}
                startPoint={{ lat: -6.7924, lng: 39.2083, label: selectedTripData.startLocation }} // Mock start coords if not in DB
                endPoint={{ lat: -6.1630, lng: 35.7516, label: selectedTripData.endLocation }} // Mock end coords
                currentLocation={currentCheckIn ? {
                  lat: currentCheckIn.latitude,
                  lng: currentCheckIn.longitude,
                  label: currentCheckIn.location,
                  timestamp: new Date(currentCheckIn.timestamp).toLocaleTimeString()
                } : undefined}
                checkIns={selectedTripData.checkIns?.map(c => ({
                  lat: c.latitude,
                  lng: c.longitude,
                  label: c.location,
                  timestamp: new Date(c.timestamp).toLocaleTimeString()
                }))}
                routePath={routePath}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MapPin className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a trip to view live tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
