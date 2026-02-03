"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Notification = {
  id: string;
  senderId: string;
  content: string | null;
  createdAt: string;
}

export default function ChatBell({ userId, onOpenChat }: { userId: string; onOpenChat: (peerId: string) => void }) {
  const [unread, setUnread] = useState<number>(0);
  const [latest, setLatest] = useState<Notification | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/chat/stream?userId=${encodeURIComponent(userId)}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === 'message') {
          setUnread((u) => u + 1);
          setLatest({
            id: data.id,
            senderId: data.senderId,
            content: data.content || null,
            createdAt: data.createdAt,
          });
          // Play a short beep sound using Web Audio API
          try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current!;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.001; // prevent loud sound
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            setTimeout(() => {
              osc.stop();
            }, 150);
          } catch {}
        }
      } catch (e) {
        console.error('Invalid SSE data', e);
      }
    };
    es.onerror = () => {
      // Try reconnect after short delay
      es.close();
      setTimeout(() => {
        esRef.current = new EventSource(`/api/chat/stream?userId=${encodeURIComponent(userId)}`);
      }, 5000);
    };
    esRef.current = es;
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [userId]);

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative"
        aria-label="Chat Notifications"
        onClick={() => {
          setUnread(0);
          if (latest?.senderId) onOpenChat(latest.senderId);
        }}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
        )}
      </button>

      <AnimatePresence>
        {latest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">New message</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 mt-1">{latest.content || '(Attachment)'}</p>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 py-1.5 px-3 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => {
                    onOpenChat(latest.senderId);
                  }}
                >
                  Reply
                </button>
                <button
                  className="py-1.5 px-3 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setLatest(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
