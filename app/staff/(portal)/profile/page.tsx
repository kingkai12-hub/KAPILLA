"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workId, setWorkId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(''); // Base64 string

  useEffect(() => {
    const storedUser = localStorage.getItem('kapilla_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setName(parsedUser.name || '');
      setEmail(parsedUser.email || '');
      setWorkId(parsedUser.workId || '');
      setPhoneNumber(parsedUser.phoneNumber || '');
      setImage(parsedUser.image || '');
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to 500KB for base64
        setMessage({ type: 'error', text: 'Image too large. Max 500KB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/staff/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user.id, 
          name, 
          email, 
          password: password || undefined, // Only send if changed
          image,
          workId,
          phoneNumber
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update local storage
        localStorage.setItem('kapilla_user', JSON.stringify({ ...user, ...updatedUser }));
        setUser({ ...user, ...updatedUser });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setPassword(''); // Clear password field
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-lg">
                  {image ? (
                    <img src={image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <p className="text-sm text-slate-500">Click camera icon to upload</p>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Work ID</label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-400 rounded">ID</div>
                  <input
                    type="text"
                    value={workId}
                    onChange={(e) => setWorkId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="EMP-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 flex items-center justify-center font-bold text-xs">📞</div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="+255..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                    disabled // Email usually shouldn't be changed easily by user
                  />
                </div>
              </div>


              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
