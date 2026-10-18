'use client';

import React, { useState, useRef } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
        credentials: 'include', // Important: include cookies
      });

      if (res.ok) {
        const userData = await res.json();
        // Store user in localStorage so the portal layout can read it immediately
        localStorage.setItem('kapilla_user', JSON.stringify(userData));
        window.location.href = '/staff/dashboard';
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
    <div className="min-h-screen relative flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-navy-900">
      {/* Background Image - Full Screen */}
      <Image
        src="/background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-navy-900/85" />

      {/* Content */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-md border border-navy-100">
            <Image
              src="/logo.png"
              alt="Kapilla Group Ltd"
              width={96}
              height={96}
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="mt-8 text-center text-3xl font-bold text-white tracking-tight">
          Staff Portal
        </h1>
        <p className="mt-3 text-center text-sm font-semibold text-navy-100 uppercase tracking-wider">
          Kapilla Group Ltd. Internal Systems
        </p>
      </div>

      <div className="relative z-10 mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-soft-lg border border-navy-100 rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy-900">
                Email address
              </label>
              <div className="mt-2 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-charcoal-muted" />
                </div>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue=""
                  className="block w-full pl-12 text-base border border-navy-200 rounded-md py-3.5 text-charcoal placeholder:text-charcoal-muted focus:border-navy-500 focus:outline-none"
                  placeholder="staff@kapillagroup.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-navy-900">
                Password
              </label>
              <div className="mt-2 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-charcoal-muted" />
                </div>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue=""
                  className="block w-full pl-12 text-base border border-navy-200 rounded-md py-3.5 text-charcoal placeholder:text-charcoal-muted focus:border-navy-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-6 rounded-md text-base font-semibold text-navy-900 bg-accent hover:bg-accent-dark disabled:opacity-60 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="ml-3 h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-center text-[10px] font-mono text-navy-300 font-bold tracking-widest">
          DEVELOPED BY KAISI
        </div>
      </div>
    </div>
  );
}
