import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, Filter, Calendar, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Mocking history fetch for now, can be connected to real logs later
                const response = await axios.get(`${API_URL}/cases`);
                
                const cases = response.data.cases || response.data;
                const mockLogs = cases.map((c, i) => ({
                    id: i,
                    type: 'case_access',
                    title: `Accessed Case: ${c.caseName}`,
                    timestamp: c.updatedAt || new Date().toISOString(),
                    user: 'Current User',
                    details: `System ID: ${c._id}`
                }));
                
                setHistory(mockLogs);
            } catch (err) {
                console.error('Failed to fetch history:', err);
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
                        <Clock className="text-blue-400" /> Activity History
                    </h1>
                    <p className="text-gray-400 mt-2">View logs of all forensic activity and case access</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-800 rounded-xl text-black dark:text-white text-sm focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <button className="p-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400">
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Retrieving activity logs...</div>
            ) : (
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                >
                    {history.map((log) => (
                        <motion.div 
                            key={log.id} 
                            variants={item}
                            className="bg-gray-100 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-800/50 p-4 rounded-2xl hover:border-blue-500/30 hover:bg-gray-200 dark:hover:bg-gray-800/60 transition-all group cursor-pointer flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <FileText size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-black dark:text-white font-medium group-hover:text-blue-400 transition-colors">{log.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 font-mono uppercase">
                                            <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {log.details}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" size={20} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default History;
