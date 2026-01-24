import React from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Activity, Map, Truck, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function StaffDashboard() {
  const stats = [
    { name: 'Total Shipments', value: '1,248', icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' },
    { name: 'In Transit', value: '432', icon: Truck, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800' },
    { name: 'Pending Delivery', value: '89', icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' },
    { name: 'Delivered Today', value: '156', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of logistics operations for today.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">
            New Shipment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className={cn(
            "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border transition-all hover:shadow-md",
            item.border
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.name}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{item.value}</p>
              </div>
              <div className={cn("p-3 rounded-xl", item.bg)}>
                <item.icon className={cn("h-6 w-6", item.color)} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Shipments Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Shipments</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700">View All</button>
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
                {[
                  { id: 'KPL-8829', dest: 'Mwanza', status: 'In Transit', date: '2 mins ago' },
                  { id: 'KPL-9921', dest: 'Arusha', status: 'Pending', date: '15 mins ago' },
                  { id: 'KPL-7732', dest: 'Dodoma', status: 'Delivered', date: '1 hour ago' },
                  { id: 'KPL-1102', dest: 'Zanzibar', status: 'Customs', date: '2 hours ago' },
                  { id: 'KPL-3391', dest: 'Mbeya', status: 'In Transit', date: '3 hours ago' },
                ].map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{shipment.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 dark:text-slate-300">{shipment.dest}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border",
                        shipment.status === 'Delivered' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' : 
                        shipment.status === 'In Transit' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' : 
                        'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                      )}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {shipment.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status / Notices */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Activity className="w-5 h-5 text-blue-300" />
              </div>
              <h3 className="font-bold text-lg">System Health</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">API Status</span>
                <span className="text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Operational
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Database</span>
                <span className="text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" /> Connected
                </span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Last Backup</span>
                <span className="text-slate-400">03:00 AM Today</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alerts
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-xl text-sm text-orange-800 dark:text-orange-200">
                <span className="font-bold block mb-1">Heavy Rain Warning</span>
                Deliveries to coastal regions may experience delays of 2-4 hours.
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                <span className="font-bold block mb-1">New Hub Opening</span>
                Mwanza Hub is now fully operational for express cargo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
