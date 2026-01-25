"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you might have a skeleton or I'll just use a div

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
      Loading Map...
    </div>
  ),
});

export default LeafletMap;
