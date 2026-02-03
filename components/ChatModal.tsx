"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string | null;
  createdAt: string;
}

export default function ChatModal({ isOpen, onClose, userId, peerId }: { isOpen: boolean; onClose: () => void; userId: string; peerId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !userId || !peerId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/chat/thread?userId=${encodeURIComponent(userId)}&peerId=${encodeURIComponent(peerId)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
        }
      } catch (e) {
        console.error('Failed to load thread', e);
      }
    };
    load();
  }, [isOpen, userId, peerId]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId: peerId, content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((m) => [...m, msg]);
        setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50);
      }
    } catch (e) {
      console.error('Failed to send', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chat</h2>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div ref={listRef} className="p-4 h-80 overflow-y-auto space-y-3">
          {messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`max-w-[75%] ${mine ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'} px-3 py-2 rounded-xl`}>
                <p className="text-sm">{m.content}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </motion.div>
    </div>
  );
}
