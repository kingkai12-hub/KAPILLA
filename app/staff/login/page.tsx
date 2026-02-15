"use client";

import React, { useState, useRef, useTransition } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const user = await res.json();
        console.log('Login successful, user:', user.email);
        // Store user session in localStorage for simple client-side auth
        localStorage.setItem('kapilla_user', JSON.stringify(user));
        
        // Use startTransition for smoother navigation
        startTransition(() => {
          window.location.href = '/staff/dashboard';
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Network error during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-600/35 via-white to-blue-800/35 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
            <Image src="/logo.png" alt="Kapilla Logo" width={96} height={96} className="w-28 h-28 object-contain" priority />
          </div>
        </div>
        <h2 className="mt-8 text-center text-4xl font-extrabold text-slate-900">
          Staff Portal
        </h2>
        <p className="mt-3 text-center text-lg text-slate-600 font-medium">
          Kapilla Group Ltd. Internal Systems
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl border-0 rounded-3xl sm:px-12">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-slate-800">
                Email address
              </label>
              <div className="mt-2 relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue=""
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 text-base border-slate-300 rounded-xl py-4 border text-slate-900 shadow-sm"
                  placeholder="staff@kapillagroup.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-slate-800">
                Password
              </label>
              <div className="mt-2 relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue=""
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 text-base border-slate-300 rounded-xl py-4 border text-slate-900 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || isPending}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="ml-3 h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-center text-xs font-mono text-blue-900/60 font-bold tracking-widest">
          DEVELOPED BY KAISI
        </div>
      </div>
    </div>
  );
}
