import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Activity, Map, Truck, Clock, User, Calendar, ScanLine, PackagePlus, CheckCheck, Hourglass, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '@/lib/db';

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
  // Fetch real stats
  const totalShipments = await db.shipment.count();
  const inTransit = await db.shipment.count({ where: { currentStatus: 'IN_TRANSIT' } });
  const pendingDelivery = await db.shipment.count({ where: { currentStatus: 'PENDING' } });
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const deliveredToday = await db.shipment.count({ 
    where: { 
      currentStatus: 'DELIVERED',
      updatedAt: { gte: startOfToday }
    } 
  });

  // Fetch recent shipments
  const recentShipments = await db.shipment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      waybillNumber: true,
      destination: true,
      currentStatus: true,
      createdAt: true
    }
  });

  const stats = [
    { name: 'Total Shipments', value: totalShipments.toLocaleString(), icon: Layers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' },
    { name: 'In Transit', value: inTransit.toLocaleString(), icon: Truck, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800' },
    { name: 'Pending Delivery', value: pendingDelivery.toLocaleString(), icon: Hourglass, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' },
    { name: 'Delivered Today', value: deliveredToday.toLocaleString(), icon: CheckCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of logistics operations.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <a href="/staff/shipments/create" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Package className="w-4 h-4" />
            New Waybill
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/staff/shipments/create" className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
          <div className="p-3 bg-blue-600 text-white rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-blue-600/30">
             <PackagePlus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Create Waybill</span>
        </a>
        <a href="/staff/tracking/update" className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
          <div className="p-3 bg-purple-600 text-white rounded-full group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-purple-600/30">
             <ScanLine className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Track Cargo</span>
        </a>
        <a href="/staff/profile" className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group">
           <div className="p-3 bg-green-600 text-white rounded-full group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-green-600/30">
             <User className="w-6 h-6" />
           </div>
           <span className="text-sm font-medium text-green-900 dark:text-green-100">My Profile</span>
        </a>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group cursor-pointer">
           <div className="p-3 bg-orange-600 text-white rounded-full group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-orange-600/30">
             <Calendar className="w-6 h-6" />
           </div>
           <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Schedule</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className={cn(
            "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border transition-all hover:shadow-md group",
            item.border
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.name}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{item.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", item.bg)}>
                <item.icon className={cn("h-6 w-6 transition-transform", item.color)} />
              </div>
            </div>
            {/* Decorative gradient blob */}
            <div className={cn(
              "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-xl",
              item.bg.replace('bg-', 'bg-')
            )} />
          </div>
        ))}
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
