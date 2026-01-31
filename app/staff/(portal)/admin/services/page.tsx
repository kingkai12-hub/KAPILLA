"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Truck, Ship, Plane, Package, ExternalLink, ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';

// Icon mapping for display
const iconMap: Record<string, any> = {
  Truck,
  Ship,
  Plane,
  Package
};

export default function ServiceManagement() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    icon: 'Truck',
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Add timestamp to force fresh fetch
      const res = await fetch(`/api/admin/services?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices(services.filter(s => s.id !== id));
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      alert('Failed to delete service');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const isEdit = !!editingService;
    const url = isEdit ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { ...formData, id: editingService.id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchServices();
        setIsModalOpen(false);
        setEditingService(null);
        resetForm();
        alert(isEdit ? 'Service updated successfully' : 'Service created successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      icon: 'Truck',
      sortOrder: 0,
      isActive: true
    });
  };

  const startEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      imageUrl: service.imageUrl,
      icon: service.icon,
      sortOrder: service.sortOrder,
      isActive: service.isActive
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingService(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Home Page Services</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage the services showcase section on the home page.</p>
        </div>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading services...</p>
        ) : services.map((service) => {
          const Icon = iconMap[service.icon] || Truck;
          return (
            <div key={service.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="relative h-48 bg-slate-100 dark:bg-slate-700">
                {service.imageUrl ? (
                  <Image 
                    src={service.imageUrl} 
                    alt={service.title} 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => startEdit(service)}
                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(service.id)}
                    className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {!service.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-3 py-1 bg-slate-800 text-white text-sm rounded-full">Inactive</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{service.title}</h3>
                    <p className="text-xs text-slate-500">Order: {service.sortOrder}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {service.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Air Freight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Service description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Image</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
                      {formData.imageUrl ? (
                        <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
                        placeholder="Image URL (https://...)"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200 dark:border-slate-600">
                          <Upload className="w-3 h-3" />
                          <span>Upload Image (Max 2MB)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Paste a URL or upload a local image. Uploaded images will be converted to Base64 (database storage).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Ship">Ship</option>
                    <option value="Plane">Plane</option>
                    <option value="Package">Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active (Visible on home page)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Service
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
