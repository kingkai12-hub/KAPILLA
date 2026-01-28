"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Scan, Trash2, Search, ArrowLeft, Image as ImageIcon, FileText } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  role: string;
  image: string | null;
  lastActive: string | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string | null;
  attachment: string | null;
  attachmentType: string | null;
  createdAt: string;
  sender: { name: string; image: string | null };
}

export default function CommunicationPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user
    const storedUser = localStorage.getItem('kapilla_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);
      const interval = setInterval(() => fetchMessages(selectedUser.id), 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/communication/users');
      if (res.ok) {
        const data = await res.json();
        // Filter out current user
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communication/messages?userId=${currentUser.id}&otherUserId=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  const handleSendMessage = async (attachment?: string, attachmentType?: string) => {
    if ((!newMessage.trim() && !attachment) || !selectedUser || !currentUser) return;

    setSending(true);
    try {
      const res = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: newMessage,
          attachment,
          attachmentType
        }),
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedUser.id);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/communication/messages?id=${messageId}&userId=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(messages.filter(m => m.id !== messageId));
      } else {
        alert("You are not authorized to delete this message.");
      }
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress Image Logic
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG with 0.6 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        // Send immediately as attachment
        handleSendMessage(compressedBase64, 'IMAGE');
      };
    };
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
      {/* Users Sidebar */}
      <div className={`w-full md:w-80 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-4 text-center text-slate-500 text-sm">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No users found</div>
          ) : (
            filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/50 ${selectedUser?.id === user.id ? 'bg-white dark:bg-slate-800 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="relative">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      {user.name?.[0]}
                    </div>
                  )}
                  {user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 5 * 60 * 1000) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                   {selectedUser.image ? (
                    <img src={selectedUser.image} alt={selectedUser.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {selectedUser.name?.[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p>Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const canDelete = currentUser?.role === 'ADMIN' || isMe;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] group relative`}>
                        <div className={`p-3 rounded-2xl ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 rounded-bl-none'
                        }`}>
                          {msg.attachment && msg.attachmentType === 'IMAGE' && (
                            <div className="mb-2 rounded-lg overflow-hidden">
                              <img src={msg.attachment} alt="Attachment" className="max-w-full h-auto" />
                            </div>
                          )}
                          
                          {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                          
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Delete Button (Hover) */}
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isMe ? '-left-8' : '-right-8'
                            }`}
                            title="Delete Message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-end gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  capture="environment" // Enables camera on mobile
                  onChange={handleFileSelect}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Scan / Attach"
                >
                  <Scan className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-end">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none p-3 max-h-32 resize-none focus:ring-0 text-slate-900 dark:text-white text-sm"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Use the scan button to capture documents. Images are automatically compressed to save storage.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">System Communication</h3>
            <p className="max-w-md mx-auto">
              Select a user from the list to start messaging. You can send text messages and scan documents to share.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
