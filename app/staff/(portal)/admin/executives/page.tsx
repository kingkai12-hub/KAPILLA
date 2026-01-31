"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, User, Image as ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';

export default function ExecutiveManagement() {
  const [executives, setExecutives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExec, setEditingExec] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      const res = await fetch(`/api/executives?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      }); // Using public endpoint for list
      if (res.ok) {
        setExecutives(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this executive?')) return;
    
    try {
      const res = await fetch(`/api/admin/executives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExecutives(executives.filter(e => e.id !== id));
      } else {
        alert('Failed to delete executive');
      }
    } catch (error) {
      alert('Failed to delete executive');
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
    const isEdit = !!editingExec;
    const url = isEdit ? `/api/admin/executives/${editingExec.id}` : '/api/admin/executives';
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { ...formData, id: editingExec.id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchExecutives();
        setIsModalOpen(false);
        setEditingExec(null);
        resetForm();
        alert(isEdit ? 'Executive updated successfully' : 'Executive created successfully');
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
      name: '',
      role: '',
      bio: '',
      imageUrl: ''
    });
  };

  const openEdit = (exec: any) => {
    setEditingExec(exec);
    setFormData({
      name: exec.name,
      role: exec.role,
      bio: exec.bio,
      imageUrl: exec.imageUrl
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingExec(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Leadership</h1>
          <p className="text-slate-500">Manage CEO, MD, and other leadership profiles</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Executive
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {executives.map((exec) => (
            <div key={exec.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-slate-100">
                {exec.imageUrl ? (
                  <Image src={exec.imageUrl} alt={exec.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button 
                    onClick={() => openEdit(exec)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-blue-600 transition-colors shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(exec.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{exec.role}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{exec.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-3">{exec.bio}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingExec ? 'Edit Executive' : 'Add Executive'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Sarah Kapilla"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Title</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. CEO & Founder"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="Short biography..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
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
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
                        placeholder="Image URL (https://...)"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200">
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

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
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
                      Save Executive
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
