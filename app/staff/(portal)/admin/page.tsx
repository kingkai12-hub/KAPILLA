import React from 'react';
import { Users, DollarSign, TrendingUp, Package, Search, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch real stats
  const totalShipments = await db.shipment.count();
  const totalUsers = await db.user.count();
  
  const revenueResult = await db.shipment.aggregate({
    _sum: {
      price: true
    }
  });
  const totalRevenue = revenueResult._sum.price || 0;

  // Use "Pending Shipments" instead of Growth for now as it's a real metric
  const pendingShipments = await db.shipment.count({
    where: { currentStatus: 'PENDING' }
  });

  // Fetch recent users
  const recentUsers = await db.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Admin Analytics Dashboard</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium mt-2">Restricted Area: Administrators Only</p>
      </div>

      {/* Quick Tracking Search */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Track Shipment</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter waybill number..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    window.open(`/tracking?waybill=${encodeURIComponent(e.currentTarget.value.trim())}`, '_blank');
                  }
                }}
              />
            </div>
          </div>
          <Link
            href="/staff/tracking/update"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
          >
            Update Tracking
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden shadow-xl border-0 rounded-3xl transform hover:scale-[1.02] transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-semibold text-slate-600 dark:text-slate-400 truncate">Total Revenue</dt>
                  <dd className="text-3xl font-black text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden shadow-xl border-0 rounded-3xl transform hover:scale-[1.02] transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-semibold text-slate-600 dark:text-slate-400 truncate">Total Users</dt>
                  <dd className="text-3xl font-black text-slate-900 dark:text-white">{totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden shadow-xl border-0 rounded-3xl transform hover:scale-[1.02] transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-semibold text-slate-600 dark:text-slate-400 truncate">Pending Shipments</dt>
                  <dd className="text-3xl font-black text-slate-900 dark:text-white">{pendingShipments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden shadow-xl border-0 rounded-3xl transform hover:scale-[1.02] transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-base font-semibold text-slate-600 dark:text-slate-400 truncate">Total Shipments</dt>
                  <dd className="text-3xl font-black text-slate-900 dark:text-white">{totalShipments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-xl border-0 rounded-3xl overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recent Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <tr>
                <th className="px-8 py-4 text-left text-base font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Name</th>
                <th className="px-8 py-4 text-left text-base font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Role</th>
                <th className="px-8 py-4 text-left text-base font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-8 text-center text-base text-slate-500 dark:text-slate-400">No users found.</td>
                </tr>
              ) : (
                recentUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-900/20 dark:hover:to-slate-800/60 transition-all duration-200">
                    <td className="px-8 py-5 whitespace-nowrap text-base font-semibold text-slate-900 dark:text-white">{user.name}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-slate-600 dark:text-slate-400">{user.role}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-slate-600 dark:text-slate-400">{user.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
