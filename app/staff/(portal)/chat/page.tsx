 "use client";
 
 import React, { useEffect, useState } from 'react';
 import ChatModal from '@/components/ChatModal';
 import { UserCircle, MessageSquare } from 'lucide-react';
 
 type Peer = {
   id: string;
   name: string | null;
   email: string;
   role: string;
   lastActive: string | null;
 };
 
 export default function ChatPage() {
   const [me, setMe] = useState<{ id: string } | null>(null);
   const [peers, setPeers] = useState<Peer[]>([]);
   const [chatOpen, setChatOpen] = useState(false);
   const [peerId, setPeerId] = useState<string>('');
 
   useEffect(() => {
     try {
       const stored = localStorage.getItem('kapilla_user');
       if (stored) setMe(JSON.parse(stored));
     } catch {}
   }, []);
 
   useEffect(() => {
     const load = async () => {
       try {
         const res = await fetch('/api/admin/users', { cache: 'no-store' });
         if (res.ok) {
           const list: Peer[] = await res.json();
           setPeers(list);
         }
       } catch (e) {
         console.error('Failed to load users', e);
       }
     };
     load();
   }, []);
 
   const visiblePeers = peers.filter((u) => u.id !== me?.id);
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chat</h1>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {visiblePeers.map((u) => {
           const isOnline = u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 2 * 60 * 1000);
           return (
             <div key={u.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                   <UserCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <div className="font-bold text-slate-900 dark:text-white">{u.name || u.email}</div>
                   <div className="text-xs text-slate-500 dark:text-slate-400">{u.role}</div>
                   <div className={`text-[10px] mt-1 font-bold ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                     {isOnline ? 'Online' : 'Offline'}
                   </div>
                 </div>
               </div>
               <button
                 onClick={() => { setPeerId(u.id); setChatOpen(true); }}
                 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
               >
                 <MessageSquare className="w-4 h-4" />
                 Chat
               </button>
             </div>
           );
         })}
       </div>
 
       {chatOpen && me?.id && peerId && (
         <ChatModal
           isOpen={chatOpen}
           onClose={() => setChatOpen(false)}
           userId={me.id}
           peerId={peerId}
         />
       )}
     </div>
   );
 }
