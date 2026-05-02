"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, ImageIcon, Upload, ExternalLink, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function AdvertisementManagement() {
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      const res = await fetch(`/api/admin/advertisements?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        setAdvertisements(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;
    
    try {
      const res = await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdvertisements(advertisements.filter(a => a.id !== id));
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to delete advertisement: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert('Failed to delete advertisement due to network error');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      
      try {
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, imageUrl: compressedBase64 });
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try another file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const isEdit = !!editingAd;
    const url = isEdit ? `/api/admin/advertisements/${editingAd.id}` : '/api/admin/advertisements';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchAdvertisements();
        setIsModalOpen(false);
        setEditingAd(null);
        resetForm();
        alert(isEdit ? 'Advertisement updated successfully' : 'Advertisement created successfully');
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
      linkUrl: '',
      sortOrder: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });
  };

  const startEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      sortOrder: ad.sortOrder,
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingAd(null);
    resetForm();
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Advertisements</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage company advertisements displayed on the home page.</p>
        </div>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Advertisement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : advertisements.map((ad) => (
          <div key={ad.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="relative h-48 bg-slate-100 dark:bg-slate-700">
              {ad.imageUrl ? (
                <Image 
                  src={ad.imageUrl} 
                  alt={ad.title} 
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
                  onClick={() => startEdit(ad)}
                  className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!ad.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="px-3 py-1 bg-slate-800 text-white text-sm rounded-full flex items-center gap-2">
                    <EyeOff className="w-3 h-3" />
                    Inactive
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">{ad.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                  Order: {ad.sortOrder}
                </span>
                {ad.startDate && (
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    From: {formatDate(ad.startDate)}
                  </span>
                )}
                {ad.endDate && (
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    To: {formatDate(ad.endDate)}
                  </span>
                )}
              </div>
              {ad.linkUrl && (
                <a 
                  href={ad.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit Link
                </a>
              )}
            </div>
          </div>
        ))}
        {!loading && advertisements.length === 0 && (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No advertisements yet. Create your first one!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Summer Special Offer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Brief description of the advertisement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Advertisement Image</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
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
                          <span>Upload Image (Max 5MB)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link URL</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Advertisement
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
