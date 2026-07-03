import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MessageCircle, Clock, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const CaseRemarks = ({ caseId }) => {
    const [user] = useState({ username: 'User', email: 'user@example.com', role: 'investigator' });
    const [remarks, setRemarks] = useState([]);
    const [newRemark, setNewRemark] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchRemarks();
    }, [caseId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [remarks]);

    const fetchRemarks = async () => {
        try {
            const token = localStorage.getItem('forensic-token');
            const response = await axios.get(`${API_URL}/comments/${caseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRemarks(response.data);
        } catch (error) {
            console.error('Error fetching remarks:', error);
            // Mock if fails
            setRemarks([
                { senderName: 'Jane Smith', senderRole: 'legal_adviser', message: 'Please clarify the source of the encrypted volume.', createdAt: new Date(Date.now() - 3600000).toISOString() },
                { senderName: 'Investigator', senderRole: 'investigator', message: 'It was found in the hidden partition of Disk 0.', createdAt: new Date().toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newRemark.trim()) return;

        try {
            const token = localStorage.getItem('forensic-token');
            const response = await axios.post(`${API_URL}/comments/${caseId}`, {
                message: newRemark
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRemarks([...remarks, response.data]);
            setNewRemark('');
        } catch (error) {
            console.error('Error sending remark:', error);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-black dark:text-white font-bold text-sm uppercase tracking-wider">
                    <MessageCircle size={16} className="text-blue-400" /> Case Intel & Remarks
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-500 flex items-center gap-1">
                    <ShieldAlert size={10} className="text-orange-400" /> SECURE CHANNEL
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {remarks.map((remark, idx) => {
                    const isMe = remark.senderRole === user?.role;
                    return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                                {!isMe && <span className="text-[10px] font-bold text-blue-400 uppercase">{remark.senderRole.replace('_', ' ')}</span>}
                                <span className="text-[9px] text-gray-500">{new Date(remark.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`max-w-[90%] p-3 rounded-xl border ${
                                isMe 
                                    ? 'bg-blue-600/10 border-blue-500/30 text-gray-700 dark:text-gray-100 rounded-tr-none' 
                                    : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-tl-none'
                            }`}>
                                <p className="text-xs leading-relaxed">{remark.message}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <input 
                    type="text" 
                    value={newRemark}
                    onChange={e => setNewRemark(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Add forensic remark..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-xs text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button 
                    onClick={handleSend}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg active:scale-95"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default CaseRemarks;
