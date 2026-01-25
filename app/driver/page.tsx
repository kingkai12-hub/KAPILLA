"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, Coffee, Truck, Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

interface Trip {
  id: string;
  startLocation: string;
  endLocation: string;
  driver: { name: string };
  shipment?: { waybillNumber: string };
}

export default function DriverInterface() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [queue, setQueue] = useState<any[]>([]);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // Load queue
    const savedQueue = localStorage.getItem('checkin_queue');
    if (savedQueue) setQueue(JSON.parse(savedQueue));

    // Load active trips
    fetchTrips();

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/driver/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckIn = (status: string, label: string) => {
    if (!activeTrip) return;
    setLoading(true);
    setStatusMessage('Acquiring GPS...');

    if (!navigator.geolocation) {
      setStatusMessage('GPS not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          tripId: activeTrip.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location: `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`, // Ideally reverse geocode here
          status: status,
          timestamp: new Date().toISOString()
        };

        if (isOnline) {
          setStatusMessage('Sending update...');
          try {
            const res = await fetch('/api/driver/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            
            if (res.ok) {
              setStatusMessage(`Update Sent: ${label}`);
              setTimeout(() => setStatusMessage(''), 3000);
            } else {
              throw new Error('Server error');
            }
          } catch (e) {
            saveToQueue(payload);
          }
        } else {
          saveToQueue(payload);
        }
        setLoading(false);
      },
      (error) => {
        setStatusMessage(`GPS Error: ${error.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const saveToQueue = (payload: any) => {
    const newQueue = [...queue, payload];
    setQueue(newQueue);
    localStorage.setItem('checkin_queue', JSON.stringify(newQueue));
    setStatusMessage('Offline: Saved to device');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const syncQueue = async () => {
    setLoading(true);
    const remaining = [];
    for (const item of queue) {
      try {
        await fetch('/api/driver/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch (e) {
        remaining.push(item);
      }
    }
    setQueue(remaining);
    localStorage.setItem('checkin_queue', JSON.stringify(remaining));
    setLoading(false);
    if (remaining.length === 0) setStatusMessage('All synced!');
  };

  if (!activeTrip) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Select Active Trip</h1>
        <div className="space-y-4">
          {trips.length === 0 ? (
            <p className="text-slate-500">No active trips found.</p>
          ) : (
            trips.map(trip => (
              <button 
                key={trip.id}
                onClick={() => setActiveTrip(trip)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left hover:border-blue-500 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{trip.shipment?.waybillNumber || 'No Waybill'}</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="text-sm text-slate-600">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> {trip.startLocation}</div>
                  <div className="pl-1 border-l border-slate-300 h-3 ml-1" />
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> {trip.endLocation}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 p-4 shadow-md flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">Trip #{activeTrip.shipment?.waybillNumber}</h2>
          <p className="text-xs text-slate-400">{activeTrip.startLocation} → {activeTrip.endLocation}</p>
        </div>
        <div className="flex items-center gap-3">
          {queue.length > 0 && (
            <button onClick={syncQueue} className="p-2 bg-yellow-600 rounded-full animate-pulse">
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          {isOnline ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-red-400" />}
        </div>
      </div>

      {/* Main Actions */}
      <div className="p-6 grid grid-cols-1 gap-4 mt-4">
        <button 
          onClick={() => handleCheckIn('OK', 'In Transit Update')}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all p-8 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
        >
          <Navigation className="w-10 h-10" />
          <span className="text-xl font-bold">Update Location</span>
          <span className="text-sm opacity-80">Just checking in</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleCheckIn('RESTING', 'Rest Stop')}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 p-6 rounded-xl flex flex-col items-center gap-2"
          >
            <Coffee className="w-8 h-8 text-yellow-400" />
            <span className="font-medium">Rest Break</span>
          </button>

          <button 
            onClick={() => handleCheckIn('BREAKDOWN', 'Vehicle Breakdown')}
            disabled={loading}
            className="bg-red-900/50 hover:bg-red-900/70 border border-red-800 p-6 rounded-xl flex flex-col items-center gap-2"
          >
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="font-medium">Breakdown</span>
          </button>
        </div>

        <button 
          onClick={() => handleCheckIn('ARRIVED', 'Arrived at Destination')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 p-6 rounded-xl flex items-center justify-center gap-3 mt-4"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="font-bold">Arrived at Destination</span>
        </button>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="fixed bottom-0 left-0 w-full bg-slate-800 border-t border-slate-700 p-4 text-center animate-in slide-in-from-bottom">
          <p className="text-sm font-medium text-blue-300">{statusMessage}</p>
        </div>
      )}
      
      {/* Offline Queue Indicator */}
      {queue.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-yellow-600/90 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
          {queue.length} updates pending sync
        </div>
      )}
    </div>
  );
}
