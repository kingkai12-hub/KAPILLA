 "use client";
 
 import React from "react";
 
 export default function Error({
   error,
   reset,
 }: {
   error: Error & { digest?: string };
   reset: () => void;
 }) {
   return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 text-center space-y-4">
         <h1 className="text-2xl font-bold">Something went wrong</h1>
         <p className="text-slate-600">
           An unexpected error occurred. Please try again.
         </p>
         {error?.digest && (
           <p className="text-xs text-slate-400">Ref: {error.digest}</p>
         )}
         <div className="flex gap-3 justify-center">
           <button
             onClick={() => reset()}
             className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
           >
             Retry
           </button>
           <a
             href="/api/health"
             className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition"
           >
             System Health
           </a>
         </div>
       </div>
     </div>
   );
 }
