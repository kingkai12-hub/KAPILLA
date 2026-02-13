"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { ScanLine, MapPin, Navigation, Save, Calendar, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { locationCoords } from '@/lib/locations';
import ErrorBoundary from '@/components/ErrorBoundary';

function UpdateTrackingContent() {
  const searchParams = useSearchParams();
  const [waybill, setWaybill] = useState('');
  
  useEffect(() => {
    const queryWaybill = searchParams.get('waybill');
    if (queryWaybill) {
      setWaybill(queryWaybill);
    }
  }, [searchParams]);

  // Status is always IN_TRANSIT for tracking updates
  const status = 'IN_TRANSIT'; 
  
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');
  const [transportType, setTransportType] = useState<'AIR' | 'WATER' | 'LAND' | ''>('');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleLocationBlur = () => {
      setTimeout(() => {
        setShowSuggestions(false);
      }, 200);
  };

  const handleSuggestionClick = (place: string) => {
    setLocation(place);
    setShowSuggestions(false);
  };

  const handleLocationFocus = () => {
    const allLocations = Object.keys(locationCoords);

    if (!location) {
      setSuggestions(allLocations);
    } else {
      const filtered = allLocations.filter(loc =>
        loc.toLowerCase().includes(location.toLowerCase())
      );
      setSuggestions(filtered);
    }

    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (!location) {
      setShowSuggestions(true);
    }
  };

  // Update when location changes
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    
    if (newLocation) {
        const filtered = Object.keys(locationCoords).filter(loc => 
            loc.toLowerCase().includes(newLocation.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waybill) {
      alert('Please enter a Waybill Number.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waybillNumber: waybill,
          status,
          location,
          remarks,
          estimatedDelivery,
          estimatedDeliveryTime,
          transportType
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
        alert('Tracking update added successfully!');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to update'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white text-slate-900 tracking-tight">Add Tracking Scan</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Scan or enter waybill to add a location update.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <form onSubmit={handleScan} className="p-5 sm:p-8 space-y-6">
          
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

          <div className="grid grid-cols-1 gap-6">
            {/* Location Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  onFocus={handleLocationFocus}
                  onBlur={handleLocationBlur}
                  className="block w-full py-3 px-4 pl-10 border border-slate-200 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:border-transparent transition-all"
                  placeholder="Enter village, town, or city in Tanzania..."
                />
              
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto mt-1 divide-y divide-slate-100 dark:divide-slate-700 top-full left-0">
                      {suggestions.map((place) => (
                          <li 
                              key={place}
                              onMouseDown={() => handleSuggestionClick(place)}
                              className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-300 transition-colors"
                          >
                              {place}
                          </li>
                      ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">Enter any place in Tanzania where the shipment is currently located.</p>
            </div>

            {/* Estimated Delivery Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="block w-full py-3 px-4 pl-10 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Estimated Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    value={estimatedDeliveryTime}
                    onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                    className="block w-full py-3 px-4 pl-10 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 -mt-4">Optional: expected delivery date and time.</p>

            {/* Transport Type */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Transport Type</label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value as 'AIR' | 'WATER' | 'LAND' | '')}
                className="block w-full py-3 px-4 border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select Type</option>
                <option value="AIR">Air</option>
                <option value="WATER">Water</option>
                <option value="LAND">Land</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Optional: choose the transport mode.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white transition-all transform active:scale-[0.98] ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Add Tracking Scan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Scans List */}
      {recentScans.length > 0 && (
        <div className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Updates</h3>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentScans.map((scan) => (
              <li key={scan.id} className="px-5 sm:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{scan.waybill}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{scan.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                      {scan.status.replace(/_/g, ' ')}
                    </span>
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
      <ErrorBoundary>
        <UpdateTrackingContent />
      </ErrorBoundary>
    </Suspense>
  );
}
