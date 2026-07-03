import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, Wand2, Terminal, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config/api';

const MiniAIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello. I am your AI Assistant. I can answer questions about the system or execute navigation commands.', isSystem: false }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const scrollRef = useRef(null);

    // Command to route mapping (relative paths, will be prefixed with role base path)
    const commandRoutes = {
        "dashboard": "dashboard",
        "cases": "cases",
        "new case": "new-case",
        "evidence": "evidence",
        "ai": "ai-analysis",
        "ai analysis": "ai-analysis",
        "reports": "reports",
        "messages": "messages",
        "history": "history",
        "profile": "/profile",
        "settings": "settings"
    };

    // Function to detect route from user message
    const detectRoute = (message) => {
        const msg = message.toLowerCase();

        for (const key in commandRoutes) {
            if (msg.includes(key)) {
                const relativePath = commandRoutes[key];
                const basePath = getBasePath();
                if (relativePath.startsWith('/')) {
                    return relativePath;
                }
                return `${basePath}/${relativePath}`;
            }
        }

        return null;
    };

    const getBasePath = () => {
        if (!user || !user.role) return '/investigator';
        const role = user.role.toLowerCase();
        if (role === 'investigator' || role === 'forensic_investigator') return '/investigator';
        if (role === 'legal_advisor' || role === 'legal_adviser') return '/legal';
        if (role === 'admin' || role === 'system_admin') return '/admin';
        return '/investigator';
    };

    const canNavigateTo = (targetPath) => {
        if (!user || !user.role) return false;
        return true;
    };

    // Speech recognition hook
    const { isListening, transcript, error, isSupported, startListening, stopListening, resetError } = useSpeechRecognition();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // --- Handle speech recognition transcript ---
    useEffect(() => {
        if (transcript && !isListening) {
            setInput(transcript);
        }
    }, [transcript, isListening]);

    // --- Voice input handlers ---
    const handleVoiceInput = () => {
        if (isListening) {
            stopListening();
        } else {
            resetError();
            startListening((transcript) => {
                setInput(transcript);
            });
        }
    };

    // --- Cleanup speech recognition on unmount ---
    useEffect(() => {
        return () => {
            if (isListening) {
                stopListening();
            }
        };
    }, [isListening, stopListening]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput('');
        setIsTyping(true);

        const detectedRoute = detectRoute(userInput);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            const response = await axios.post(`${API_URL}/ai/chat`, {
                query: userMsg.text,
                message: userMsg.text
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;

            // If backend returns NAVIGATE action, use it
            if (data.action === 'NAVIGATE') {
                if (canNavigateTo(data.target)) {
                    setMessages(prev => [...prev, { role: 'ai', text: data.text || `Executing command: Navigate to ${data.target}`, isSystem: true }]);
                    setTimeout(() => {
                        navigate(data.target);
                        setIsOpen(false);
                    }, 800);
                } else {
                    setMessages(prev => [...prev, { 
                        role: 'ai', 
                        text: `Access Denied: You do not have permission to access ${data.target}. This action requires elevated privileges.`, 
                        isSystem: true 
                    }]);
                }
            } else if (data.action === 'RESTRICTED') {
                setMessages(prev => [...prev, { role: 'ai', text: data.text || "You are not authorized to perform this action.", isSystem: true }]);
            } else {
                // If backend doesn't return NAVIGATE, check frontend detection
                if (detectedRoute) {
                    if (canNavigateTo(detectedRoute)) {
                        setMessages(prev => [...prev, { role: 'ai', text: data.text || `Taking you to ${detectedRoute}`, isSystem: true }]);
                        setTimeout(() => {
                            navigate(detectedRoute);
                            setIsOpen(false);
                        }, 500);
                    } else {
                        setMessages(prev => [...prev, { 
                            role: 'ai', 
                            text: `Access Denied: You do not have permission to access ${detectedRoute}.`, 
                            isSystem: true 
                        }]);
                    }
                } else {
                    // Just show the AI response
                    setMessages(prev => [...prev, { role: 'ai', text: data.text, isSystem: false }]);
                }
            }
        } catch (error) {
            if (detectedRoute && canNavigateTo(detectedRoute)) {
                setMessages(prev => [...prev, { role: 'ai', text: `Taking you to ${detectedRoute}`, isSystem: true }]);
                setTimeout(() => { navigate(detectedRoute); setIsOpen(false); }, 500);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "Neural link offline. Error connecting to backend.", isSystem: true }]);
            }
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-80 h-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white cursor-move border-b border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <Bot size={18} /> AI Assistant
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={16} /></button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs custom-scrollbar">
                            {messages.map((m, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx} 
                                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                                        m.role === 'user' 
                                            ? 'bg-blue-600 border border-blue-500/50 text-white rounded-tr-sm shadow-md' 
                                            : m.isSystem 
                                                ? 'bg-gray-800/80 text-emerald-400 border border-emerald-500/20 rounded-tl-sm font-semibold flex items-center gap-1' 
                                                : 'bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm shadow-sm'
                                    }`}>
                                        {m.isSystem && <Terminal size={12} className="inline-block flex-shrink-0" />}
                                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-500 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            {/* Voice Input Error Display */}
                            {error && (
                                <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-xs text-red-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                        {error}
                                    </p>
                                </div>
                            )}
                            
                            {/* Listening Indicator */}
                            {isListening && (
                                <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                                        Listening... Speak now
                                    </p>
                                </div>
                            )}
                            
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                                className="flex gap-2"
                            >
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask or command..."
                                    disabled={isTyping}
                                    className="flex-1 bg-gray-100 dark:bg-[#111827] border border-gray-300 dark:border-gray-800 rounded-xl px-3 py-2 text-black dark:text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-600 disabled:opacity-50"
                                />
                                
                                {/* Microphone Button */}
                                {isSupported && (
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        disabled={isTyping}
                                        title={isListening ? "Stop recording" : "Click to speak"}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            isListening 
                                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 border border-red-400/30 animate-pulse' 
                                                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-700'
                                        } disabled:opacity-40 disabled:hover:bg-gray-800`}
                                    >
                                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                    </button>
                                )}
                                
                                <button 
                                    type="submit" 
                                    disabled={isTyping || !input.trim()}
                                    className="w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/20 border border-blue-400/30"
                                >
                                    <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto mt-4 border border-white/10 ${
                    isOpen 
                        ? 'bg-red-500 hover:bg-red-400 rotate-90 shadow-red-500/20' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40 hover:shadow-blue-500/60'
                }`}
            >
                {isOpen ? <X size={24} className="text-white" /> : <Wand2 size={24} className="text-white drop-shadow-md" />}
            </motion.button>
        </div>
    );
};

export default MiniAIAssistant;
