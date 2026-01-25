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

export default function CreateShipment() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('kapilla_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const [formData, setFormData] = useState({
    senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    origin: 'Dar es Salaam', destination: '',
    weight: '', type: 'Parcel', cargoDetails: ''
  });
  const [generatedWaybill, setGeneratedWaybill] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      senderName: '', senderPhone: '', senderAddress: '',
      receiverName: '', receiverPhone: '', receiverAddress: '',
      origin: 'Dar es Salaam', destination: '',
      weight: '', type: 'Parcel', cargoDetails: ''
    });
  };

  if (generatedWaybill) {
    return (
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-green-50 p-6 border-b border-green-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-800">Shipment Created!</h2>
            <p className="text-green-600">Waybill generated successfully.</p>
          </div>
          <div className="text-right">
            <span className="block text-sm text-blue-900">Waybill Number</span>
            <span className="block text-3xl font-mono font-bold text-blue-950">{generatedWaybill}</span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">From (Sender)</h3>
              <p className="font-bold text-lg text-blue-950">{formData.senderName}</p>
              <p className="text-blue-900">{formData.senderPhone}</p>
              <p className="text-blue-900 text-sm">{formData.senderAddress}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">To (Receiver)</h3>
              <p className="font-bold text-lg text-blue-950">{formData.receiverName}</p>
              <p className="text-blue-900">{formData.receiverPhone}</p>
              <p className="text-blue-900 text-sm">{formData.receiverAddress}</p>
            </div>
          </div>

          <div className="border-t pt-6 grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Origin</h3>
              <p className="font-medium text-blue-950">{formData.origin}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Destination</h3>
              <p className="font-medium text-blue-950">{formData.destination}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Weight / Type</h3>
              <p className="font-medium text-blue-950">{formData.weight} kg / {formData.type}</p>
            </div>
          </div>

          {formData.cargoDetails && (
            <div className="border-t pt-6">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">Cargo Details</h3>
              <p className="text-blue-950">{formData.cargoDetails}</p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => window.open(`/staff/shipments/${generatedWaybill}/label`, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-md hover:bg-gray-900 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print Waybill / POD
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-6 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Shipment</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sender Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Sender Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input required type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input required type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address / Location</label>
              <textarea name="senderAddress" value={formData.senderAddress} onChange={handleChange} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
          </div>

          {/* Receiver Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Receiver Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input required type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input required type="tel" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address / Location</label>
              <textarea name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
          </div>
        </div>

        {/* Shipment Info */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Package Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Origin City</label>
              <select name="origin" value={formData.origin} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900">
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
              <label className="block text-sm font-medium text-gray-700">Destination City</label>
              <select name="destination" value={formData.destination} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900">
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
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900">
                <option>Parcel</option>
                <option>Document</option>
                <option>Fragile</option>
                <option>Heavy Cargo</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Additional Details / Cargo Description</label>
            <textarea name="cargoDetails" value={formData.cargoDetails} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" placeholder="Describe contents, special handling instructions, etc." />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          >
            <Save className="w-5 h-5" />
            Generate Waybill
          </button>
        </div>
      </form>
    </div>
  );
}
