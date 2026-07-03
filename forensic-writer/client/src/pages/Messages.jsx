import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Search, Info, Shield, Scale, Terminal, Send, Plus, Users, X, MessageSquare, CheckCircle2, Mic, MicOff, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

const API_URL = `http://${window.location.hostname}:5000/api`;

const getRoleBadge = (role) => {
    const map = {
        admin: { label: 'ADMIN', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
        investigator: { label: 'INVESTIGATOR', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        legal_adviser: { label: 'LEGAL', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        legal_advisor: { label: 'LEGAL', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    };
    const r = map[role] || { label: role?.toUpperCase() || 'USER', cls: 'bg-gray-500/20 text-gray-400' };
    return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.cls}`}>{r.label}</span>;
}

const Messages = () => {
    const location = useLocation();
    const { user } = useAuth();
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    const headers = { Authorization: `Bearer ${token}` };

    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef(null);

    const { isConnected, subscribeToEvent, unsubscribeFromEvent } = useSocket();
    const { isListening, transcript, error: voiceError, isSupported, startListening, stopListening, resetError } = useSpeechRecognition();

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/users`, { headers });
            const all = res.data || [];
            // filter out current user just in case
            const filtered = all.filter(u => {
                const isCurrent = (u.id || u._id || "").toString() === (user?._id || user?.id || "").toString();
                return !isCurrent;
            });
            setUsers(filtered);
        } catch (err) {
            console.error(err);
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    }, [token, user]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Socket listeners
    useEffect(() => {
        const handleNewMessage = (msg) => {
            console.log("SOCKET: New message received", msg);
            if (activeUser && (msg.senderId === activeUser._id || msg.receiverId === activeUser._id)) {
                setMessages(prev => {
                    if (prev.find(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
        };
        subscribeToEvent('receiveMessage', handleNewMessage);
        return () => unsubscribeFromEvent('receiveMessage', handleNewMessage);
    }, [activeUser, subscribeToEvent, unsubscribeFromEvent]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (transcript && !isListening) {
            setInput(transcript);
        }
    }, [transcript, isListening]);

    const handleVoiceInput = () => {
        if (isListening) {
            stopListening();
        } else {
            resetError();
            startListening((t) => setInput(t));
        }
    };

    const handleSelectUser = async (targetUser) => {
        setActiveUser(targetUser);
        setLoadingMsgs(true);
        setMessages([]);
        try {
            const targetId = targetUser._id || targetUser.id;
            const res = await axios.get(`${API_URL}/messages/${targetId}`, { headers });
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error('Fetch messages error:', err);
            setMessages([]);
        } finally {
            setLoadingMsgs(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !activeUser || sending) return;
        setSending(true);
        const text = input.trim();
        try {
            const targetId = activeUser._id || activeUser.id;
            const res = await axios.post(`${API_URL}/messages/send`, { userId: targetId, message: text }, { headers });
            if (res.data.message) {
                setMessages(prev => [...prev, res.data.message]);
                setInput('');
            }
        } catch (err) {
            console.error('Send message error:', err);
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-transparent overflow-hidden">
            {/* LEFT PANEL */}
            <div className="w-80 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200 dark:border-gray-800/60 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800/60">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-black dark:text-white font-bold text-lg flex items-center gap-2"><Mail size={18} className="text-blue-400" /> Messages</h1>
                        <div className="flex gap-2">
                            <div className={`w-2 h-2 rounded-full my-auto ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`} title={isConnected ? "Online" : "Connecting..."}></div>
                        </div>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full bg-gray-100 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-800 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-600 outline-none focus:border-blue-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loadingUsers ? (
                        <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 space-y-2">
                            <Users size={28} className="mx-auto opacity-30" />
                            <p className="text-sm">No users available</p>
                        </div>
                    ) : (
                        filteredUsers.map(u => {
                            const isActive = activeUser && (activeUser._id === u._id || activeUser.id === u.id);
                            return (
                                <button
                                    key={u._id || u.id}
                                    onClick={() => handleSelectUser(u)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors group text-left mb-1 ${isActive ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-blue-500/10 border border-transparent'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-700 flex-shrink-0">
                                        <span className={`text-sm font-bold ${isActive ? 'text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{u.name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || '?'}</span>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-300' : 'text-black dark:text-white'}`}>{u.name || 'Unknown User'}</p>
                                        <p className="text-[11px] text-gray-500 truncate">@{u.username || 'user'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-1">{getRoleBadge(u.role)}</div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANEL - CHAT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                {!activeUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-800 flex items-center justify-center shadow-inner">
                            <Mail size={30} className="text-gray-700" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-500">Secure Channel Offline</p>
                            <p className="text-sm text-gray-700 mt-1">Select a user to initialize link.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-white dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                                    <Users size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-black dark:text-white font-bold text-sm">{activeUser.name || activeUser.username}</h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Shield size={10} className="text-green-500" /> End-to-end encrypted
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setActiveUser(null)} className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-white p-2">
                                <X size={18} />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50 dark:bg-gray-900/80">
                            {loadingMsgs ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-xs text-gray-500">Decrypting messages...</p>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-700 opacity-50">
                                    <MessageSquare size={40} className="mb-2" />
                                    <p className="text-sm font-mono tracking-widest">No conversation yet</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.senderId === (user?._id || user?.id);
                                    return (
                                        <motion.div
                                            key={msg._id || idx}
                                            initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-lg border ${
                                                isMe 
                                                ? 'bg-blue-600 border-blue-500 text-white rounded-br-none' 
                                                : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-none'
                                            }`}>
                                                {!isMe && (
                                                    <p className="text-[10px] font-bold text-blue-400 mb-1 flex items-center gap-1">
                                                        {msg.senderName || activeUser.name || activeUser.username} {msg.senderRole && getRoleBadge(msg.senderRole)}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                                <div className={`mt-1 text-[9px] opacity-60 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800/60">
                             {voiceError && (
                                <div className="mb-2 text-[10px] text-red-500 flex items-center gap-1 px-2"><AlertCircle size={12} /> {voiceError}</div>
                            )}
                            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder={isListening ? "Listening..." : "Type secure message..."}
                                        disabled={sending}
                                        className="w-full bg-gray-100 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:border-blue-500/50 outline-none transition-all pr-12"
                                    />
                                    {isSupported && (
                                        <button
                                            type="button"
                                            onClick={handleVoiceInput}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-gray-500 hover:text-blue-400'}`}
                                        >
                                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 disabled:opacity-30 transition-all active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Messages;
