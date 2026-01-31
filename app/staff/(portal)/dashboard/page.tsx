import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Activity, Map, Truck, Clock, User, Calendar, ScanLine, PackagePlus, CheckCheck, Hourglass, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export default async function StaffDashboard() {
  let totalShipments = 0;
  let inTransit = 0;
  let pendingDelivery = 0;
  let deliveredToday = 0;
  let recentShipments: { waybillNumber: string; destination: string; currentStatus: string; createdAt: Date }[] = [];

  try {
    totalShipments = await db.shipment.count();
    inTransit = await db.shipment.count({ where: { currentStatus: 'IN_TRANSIT' } });
    pendingDelivery = await db.shipment.count({ where: { currentStatus: 'PENDING' } });
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    deliveredToday = await db.shipment.count({ 
      where: { 
        currentStatus: 'DELIVERED',
        updatedAt: { gte: startOfToday }
      } 
    });

    recentShipments = await db.shipment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        waybillNumber: true,
        destination: true,
        currentStatus: true,
        createdAt: true
      }
    });
  } catch (e) {
    recentShipments = [];
  }

  const stats = [
    { name: 'Total Shipments', value: totalShipments.toLocaleString(), icon: Layers, color: 'text-blue-600 dark:text-blue-100', bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40', border: 'border-blue-200 dark:border-blue-700' },
    { name: 'In Transit', value: inTransit.toLocaleString(), icon: Truck, color: 'text-amber-600 dark:text-amber-100', bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40', border: 'border-amber-200 dark:border-amber-700' },
    { name: 'Pending Delivery', value: pendingDelivery.toLocaleString(), icon: Hourglass, color: 'text-orange-600 dark:text-orange-100', bg: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40', border: 'border-orange-200 dark:border-orange-700' },
    { name: 'Delivered Today', value: deliveredToday.toLocaleString(), icon: CheckCheck, color: 'text-emerald-600 dark:text-emerald-100', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40', border: 'border-emerald-200 dark:border-emerald-700' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight drop-shadow-sm">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Overview of logistics operations & performance.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <a href="/staff/shipments/create" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 transition-all duration-300 flex items-center gap-2">
            <Package className="w-5 h-5" />
            New Waybill
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.name} className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 dark:bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{stat.name}</p>
                <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/staff/shipments/create" className="group relative p-1 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1">
          <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <div className="p-3.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-10">
                <PackagePlus className="w-7 h-7" />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">Create Waybill</span>
          </div>
        </a>
        
        <a href="/staff/tracking/update" className="group relative p-1 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-400 hover:from-purple-500 hover:to-fuchsia-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1">
          <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <div className="p-3.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-full group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 z-10">
                <ScanLine className="w-7 h-7" />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">Track Cargo</span>
          </div>
        </a>

        <a href="/staff/profile" className="group relative p-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-1">
          <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <div className="p-3.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-10">
               <User className="w-7 h-7" />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">My Profile</span>
          </div>
        </a>

        <div className="group relative p-1 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-1 cursor-pointer">
          <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <div className="p-3.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 rounded-full group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 z-10">
               <Calendar className="w-7 h-7" />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200 z-10">Schedule</span>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Recent Shipments Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Shipments</h3>
            <a href="/staff/shipments" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waybill</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {recentShipments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  recentShipments.map((shipment) => (
                    <tr key={shipment.waybillNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{shipment.waybillNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700 dark:text-slate-300">{shipment.destination}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border",
                          shipment.currentStatus === 'DELIVERED' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' : 
                          shipment.currentStatus === 'IN_TRANSIT' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' : 
                          'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        )}>
                          {shipment.currentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
