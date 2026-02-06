"use client";

import React, { useState, useEffect } from 'react';
import { Printer, Save, RefreshCw } from 'lucide-react';

const tanzaniaLocations = {
  "Major Cities": [
    "Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Mbeya", "Morogoro", "Tanga", "Zanzibar City"
  ],
  "Regional Centers": [
    "Moshi", "Tabora", "Iringa", "Kigoma", "Songea", "Sumbawanga", "Shinyanga", "Musoma", "Bukoba", "Lindi", "Mtwara", "Singida"
  ],
  "Towns & Districts": [
    "Kahama", "Geita", "Bagamoyo", "Mafia", "Tunduma", "Makambako", "Njombe", "Bariadi", "Babati", "Kibaha", "Chalinze", "Mikumi", "Ifakara"
  ],
  "International": [
    "Nairobi (Kenya)", "Mombasa (Kenya)", "Kampala (Uganda)", "Kigali (Rwanda)", "Bujumbura (Burundi)", "Lubumbashi (DRC)", "Lusaka (Zambia)", "Lilongwe (Malawi)"
  ]
};

import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateShipment() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedUser = localStorage.getItem('kapilla_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Auto-fill from pickup request if params exist
    if (searchParams) {
      const senderName = searchParams.get('senderName') || '';
      const senderPhone = searchParams.get('senderPhone') || '';
      const senderAddress = searchParams.get('pickupAddress') || ''; // Map pickup address to sender address
      const destination = searchParams.get('destination') || '';
      const cargoDetails = searchParams.get('cargoDetails') || '';
      const weight = searchParams.get('weight') || '';
      
      if (senderName) {
        setFormData(prev => ({
          ...prev,
          senderName,
          senderPhone,
          senderAddress,
          destination,
          cargoDetails,
          weight
        }));
      }
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    senderName: '', senderPhone: '', senderAddress: '', senderEmail: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    origin: 'Dar es Salaam', destination: '',
    weight: '', type: 'Parcel', cargoDetails: ''
  });
  const [generatedWaybill, setGeneratedWaybill] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Phone Number Validation: Only numbers, max 10 digits
    if (name === 'senderPhone' || name === 'receiverPhone') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    // Weight Validation: Only numbers and decimal point
    else if (name === 'weight') {
      newValue = value.replace(/[^0-9.]/g, '');
    }
    // Title Case (Names, Cities, Addresses)
    else if (['senderName', 'receiverName', 'origin', 'destination', 'senderAddress', 'receiverAddress'].includes(name)) {
      newValue = value.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    // Sentence Case (Cargo Details)
    else if (name === 'cargoDetails') {
      if (newValue.length > 0) {
        newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
      }
    }

    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dispatcherName: user?.name || 'Unknown',
        dispatcherSignature: user?.workId || 'N/A'
      };

      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || 'Failed to create shipment');
      }

      // If this was from a pickup request, mark it as ISSUED
      const pickupRequestId = searchParams?.get('pickupRequestId');
      if (pickupRequestId) {
        await fetch(`/api/pickup-requests/${pickupRequestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ISSUED' }),
        });
      }

      setGeneratedWaybill(data.waybillNumber);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error creating shipment: ${errorMessage}`);
    }
  };

  const handleReset = () => {
    setGeneratedWaybill(null);
    setFormData({
      senderName: '', senderPhone: '', senderAddress: '', senderEmail: '',
      receiverName: '', receiverPhone: '', receiverAddress: '',
      origin: 'Dar es Salaam', destination: '',
      weight: '', type: 'Parcel', cargoDetails: ''
    });
  };

  if (generatedWaybill) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-lg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="bg-green-50 dark:bg-green-900/20 p-5 sm:p-6 border-b border-green-100 dark:border-green-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">Shipment Created!</h2>
            <p className="text-green-600 dark:text-green-300 text-sm">Waybill generated successfully.</p>
          </div>
          <div className="sm:text-right">
            <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Waybill Number</span>
            <span className="block text-2xl sm:text-3xl font-mono font-black text-slate-950 dark:text-white tracking-wider overflow-x-auto whitespace-nowrap">{generatedWaybill}</span>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">From (Sender)</h3>
              <p className="font-bold text-base sm:text-lg text-slate-950 dark:text-white">{formData.senderName}</p>
              <p className="text-slate-700 dark:text-slate-300">{formData.senderPhone}</p>
              {formData.senderEmail && (
                <p className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block" title="Notification Sent"></span>
                  {formData.senderEmail}
                </p>
              )}
              <p className="text-slate-700 dark:text-slate-300 text-sm">{formData.senderAddress}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">To (Receiver)</h3>
              <p className="font-bold text-base sm:text-lg text-slate-950 dark:text-white">{formData.receiverName}</p>
              <p className="text-slate-700 dark:text-slate-300">{formData.receiverPhone}</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm">{formData.receiverAddress}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Origin</h3>
              <p className="font-medium text-slate-950 dark:text-white">{formData.origin}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Destination</h3>
              <p className="font-medium text-slate-950 dark:text-white">{formData.destination}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Weight / Type</h3>
              <p className="font-medium text-slate-950 dark:text-white">{formData.weight} kg / {formData.type}</p>
            </div>
          </div>

          {formData.cargoDetails && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">Cargo Details</h3>
              <p className="text-slate-950 dark:text-white">{formData.cargoDetails}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={() => window.open(`/staff/shipments/${generatedWaybill}/label`, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-950 transition-colors font-semibold"
            >
              <Printer className="w-5 h-5" />
              Print Waybill / POD
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors font-semibold text-slate-900 dark:text-white"
            >
              <RefreshCw className="w-5 h-5" />
              New Shipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Shipment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fill the sender, receiver, and package details to generate a waybill.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sender Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Sender Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input required type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input required type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address / Location</label>
              <textarea name="senderAddress" value={formData.senderAddress} onChange={handleChange} rows={2} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
          </div>

          {/* Receiver Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Receiver Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input required type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input required type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address / Location</label>
              <textarea name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} rows={2} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
          </div>
        </div>

        {/* Shipment Info */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Package Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Origin City</label>
              <select name="origin" value={formData.origin} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950">
                <option value="">Select Origin</option>
                {Object.entries(tanzaniaLocations).map(([category, cities]) => (
                  <optgroup key={category} label={category}>
                    {cities.sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Destination City</label>
              <select name="destination" value={formData.destination} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950">
                <option value="">Select Destination</option>
                {Object.entries(tanzaniaLocations).map(([category, cities]) => (
                  <optgroup key={category} label={category}>
                    {cities.sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950">
                <option>Parcel</option>
                <option>Document</option>
                <option>Fragile</option>
                <option>Heavy Cargo</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Additional Details / Cargo Description</label>
            <textarea name="cargoDetails" value={formData.cargoDetails} onChange={handleChange} rows={3} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm py-3 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950" placeholder="Describe contents, special handling instructions, etc." />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          >
            <Save className="w-5 h-5" />
            Generate Waybill
          </button>
        </div>
      </form>
    </div>
  );
}
