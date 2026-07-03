import React, { useState, useEffect } from 'react';
import { Scale, FileText, MessageSquare, AlertCircle, Eye, CheckCircle, Activity } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const LegalDashboard = () => {
    const [stats, setStats] = useState({
        pendingReviews: 0,
        reportsApproved: 0,
        activeRemarks: 0
    });
    const [pendingReports, setPendingReports] = useState([]);
    const [recentRemarks, setRecentRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchLegalData = async () => {
            try {
                // Fetch cases for legal review
                const casesResponse = await axios.get(`${API_URL}/cases`);
                
                // Fetch reports
                const reportsResponse = await axios.get(`${API_URL}/reports`);
                
                if (casesResponse.data && reportsResponse.data) {
                    const cases = casesResponse.data.cases || [];
                    const reports = reportsResponse.data.reports || [];
                    
                    // Calculate stats from real data
                    const pendingReviews = cases.filter(c => c.status === 'pending' || c.status === 'under_review').length;
                    const reportsApproved = reports.filter(r => r.status === 'approved').length;
                    const activeRemarks = 5; // Placeholder - would come from messages/comments
                    
                    // Create pending reports data
                    const pendingReportsData = cases
                        .filter(c => c.status === 'pending' || c.status === 'under_review')
                        .slice(0, 3)
                        .map(c => ({
                            id: c._id || c.id,
                            caseName: c.title || c.name || `Case ${c._id}`,
                            type: c.type || 'Investigation',
                            status: c.status || 'pending'
                        }));
                    
                    // Create sample remarks (would come from actual messages)
                    const remarksData = [
                        { recipient: 'Investigator Team', caseId: '001', text: 'Please provide additional forensic evidence for review.' },
                        { recipient: 'Case Manager', caseId: '002', text: 'Report approved. Ready for legal submission.' },
                        { recipient: 'Forensic Team', caseId: '003', text: 'Chain of custody documentation required.' }
                    ];
                    
                    setStats({
                        pendingReviews,
                        reportsApproved,
                        activeRemarks
                    });
                    setPendingReports(pendingReportsData);
                    setRecentRemarks(remarksData);
                }
            } catch (err) {
                console.error('Failed to fetch legal data', err);
                // Set default data on error
                setStats({ pendingReviews: 0, reportsApproved: 0, activeRemarks: 0 });
                setPendingReports([]);
                setRecentRemarks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLegalData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
                        <Scale className="text-purple-500" /> Legal & Compliance Review
                    </h1>
                    <p className="text-gray-400 mt-2">Case validation, report reviewing and regulatory oversight</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <Activity size={14} className="text-purple-400" />
                    <span className="text-xs text-purple-400 font-mono uppercase tracking-widest">Secure Channel Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 border-t-4 border-yellow-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-[#111827]">
                    <p className="text-gray-400 text-sm font-medium mb-1">Pending Reviews</p>
                    <h3 className="text-black dark:text-white text-3xl font-bold">{stats.pendingReviews}</h3>
                    <p className="text-[10px] text-yellow-500/60 mt-2 uppercase">Action required</p>
                </div>
                <div className="card p-6 border-t-4 border-green-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-[#111827]">
                    <p className="text-gray-400 text-sm font-medium mb-1">Reports Approved</p>
                    <h3 className="text-black dark:text-white text-3xl font-bold">{stats.reportsApproved}</h3>
                    <p className="text-[10px] text-green-500/60 mt-2 uppercase">Lifetime validation</p>
                </div>
                <div className="card p-6 border-t-4 border-blue-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-[#111827]">
                    <p className="text-gray-400 text-sm font-medium mb-1">Active Remarks</p>
                    <h3 className="text-black dark:text-white text-3xl font-bold">{stats.activeRemarks}</h3>
                    <p className="text-[10px] text-blue-500/60 mt-2 uppercase">Open communications</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Reports for Review */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <FileText size={20} className="text-yellow-400" /> Pending Report Reviews
                    </h2>
                    <div className="space-y-4">
                        {pendingReports.map((report) => (
                            <div key={report.id} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 hover:border-purple-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-black dark:text-white font-medium group-hover:text-purple-400 transition-colors">Case {report.id}</h3>
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{report.status}</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-4">{report.caseName} - {report.type}</p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                                        <Eye size={14} /> Review Intel
                                    </button>
                                    <button className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700">
                                        <MessageSquare size={14} /> Remark
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Communications */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <MessageSquare size={20} className="text-blue-400" /> Recent Remarks
                    </h2>
                    <div className="space-y-3">
                        {recentRemarks.map((remark, idx) => (
                            <div key={idx} className="p-3 border-l-2 border-blue-500 bg-blue-500/5 rounded-r-lg">
                                <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-tight">To: {remark.recipient} (Case {remark.caseId})</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{remark.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalDashboard;
