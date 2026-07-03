import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Folder, Activity, CheckCircle, Clock, Bell, Settings, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCases: 0,
        activeInvestigations: 0,
        evidenceCount: 0,
        usersCount: 0,
        pendingApproval: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState([]);
    const [users, setUsers] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Approval State
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, userRes, caseRes] = await Promise.all([
                axios.get(`${API_URL}/cases/stats`, { headers }),
                axios.get(`${API_URL}/auth/users`, { headers }),
                axios.get(`${API_URL}/cases`, { headers })
            ]);

            setStats({
                totalCases: statsRes.data.totalCases || 0,
                activeInvestigations: statsRes.data.activeCases || 0,
                evidenceCount: statsRes.data.evidenceCount || 0,
                usersCount: userRes.data.users?.length || 0,
                pendingApproval: statsRes.data.pendingCases || 0
            });

            setUsers(userRes.data.users || []);
            setCases(caseRes.data.cases || []);
        } catch (err) {
            console.error('Admin Fetch Error:', err);
            setStats({ totalCases: 0, activeInvestigations: 0, evidenceCount: 0, usersCount: 0, pendingApproval: 0 });
            setUsers([]);
            setCases([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleApprove = async (caseObj) => {
        if (!window.confirm(`Approve case ${caseObj.caseId}?`)) return;
        setActionLoading(true);
        try {
            await axios.post(`${API_URL}/cases/${caseObj._id}/approve`, {}, { headers });
            await fetchAdminData();
        } catch (error) {
            alert('Approval failed: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectClick = (caseObj) => {
        setSelectedCase(caseObj);
        setRemarks('');
        setShowRemarksModal(true);
    };

    const submitRejection = async () => {
        if (!remarks.trim()) return alert('Please provide remarks for rejection.');
        setActionLoading(true);
        try {
            await axios.post(`${API_URL}/cases/${selectedCase._id}/reject`, { remarks }, { headers });
            setShowRemarksModal(false);
            await fetchAdminData();
        } catch (error) {
            alert('Rejection failed: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const pendingCases = cases.filter(c => c.status === 'pending');

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-xl">
            <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-black dark:text-white text-3xl font-bold font-mono">{value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${color} bg-opacity-10 border ${color.replace('bg-', 'border-')}/30`}>
                <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-500 font-mono text-sm animate-pulse">Initializing Secure Panel...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <h1 className="text-4xl font-bold text-black dark:text-white flex items-center gap-4">
                        <Shield className="text-red-500" size={38} /> Command Central
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Admin Privileges Active: System Overview & Validation
                    </p>
                </motion.div>
                <button className="px-6 py-3 bg-red-600/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-600/20 transition-all flex items-center gap-2 font-bold shadow-lg shadow-red-500/5">
                    <Bell size={20} /> BROADCAST ALERT
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Network Cases" value={stats.totalCases} icon={Folder} color="bg-blue-500" />
                <StatCard title="Active Leads" value={stats.activeInvestigations} icon={Activity} color="bg-orange-500" />
                <StatCard title="Verified Users" value={stats.usersCount} icon={Users} color="bg-green-500" />
                <StatCard title="Pending Review" value={stats.pendingApproval} icon={Clock} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Approvals Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-3">
                            <CheckCircle size={22} className="text-red-400" /> Case Validation Hub
                        </h2>
                        <span className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full font-bold border border-red-500/30">
                            {pendingCases.length} PENDING
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500 text-xs uppercase font-bold tracking-widest border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4">Case ID / Name</th>
                                    <th className="px-6 py-4">Investigator</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                                {pendingCases.length > 0 ? pendingCases.map((c) => (
                                    <tr key={c._id} className="hover:bg-red-500/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-black dark:text-white mb-1 font-mono">{c.caseId}</div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">{c.caseName}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[10px] text-black dark:text-white">
                                                    {c.investigatorName?.[0]}
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 text-sm">{c.investigatorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleApprove(c)}
                                                    className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-all font-bold text-xs"
                                                >
                                                    APPROVE
                                                </button>
                                                <button 
                                                    disabled={actionLoading}
                                                    onClick={() => handleRejectClick(c)}
                                                    className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-all font-bold text-xs"
                                                >
                                                    REJECT
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-400 dark:text-gray-600 italic">
                                            <Folder size={24} className="mx-auto mb-2 opacity-20" />
                                            All case validation queues are currently empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users List */}
                <div className="bg-white dark:bg-gray-900/80 backdrop-blur-lg border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-black dark:text-white mb-6 flex items-center gap-3">
                        <Users size={22} className="text-blue-400" /> Active Agents
                    </h2>
                    <div className="space-y-4">
                        {users.slice(0, 8).map((u) => (
                            <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 group hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                        {u.name?.[0] || u.username?.[0]}
                                    </div>
                                    <div>
                                        <div className="text-black dark:text-white text-sm font-bold">{u.name || u.username}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">{u.role}</div>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    <Settings size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-500 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-black dark:hover:text-white transition-all uppercase tracking-widest">
                        Access User Repository
                    </button>
                </div>
            </div>

            {/* Rejection Remarks Modal */}
            <AnimatePresence>
                {showRemarksModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRemarksModal(false)}
                            className="absolute inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl p-6 relative z-10 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-black dark:text-white mb-2 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" /> Validation Feedback
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                                Provide detailed remarks for why case <span className="text-black dark:text-white font-mono">{selectedCase?.caseId}</span> is being rejected. This will be sent to the investigator.
                            </p>
                            
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full h-32 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-black dark:text-white text-sm focus:border-red-500/50 outline-none resize-none mb-6"
                            />

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowRemarksModal(false)}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={submitRejection}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    SUBMIT REJECTION
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
