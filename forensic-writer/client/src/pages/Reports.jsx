import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    ArrowLeft, FileText, Download, Search, Filter, Shield, AlertTriangle, 
    Calendar, Hash, User, Trash2, MoreVertical, FolderOpen, Eye, Activity,
    CheckCircle, Clock, TrendingUp
} from 'lucide-react';
import { API_URL } from '../config/api';

const Reports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openMenu, setOpenMenu] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    const buttonRefs = useRef({});

    useEffect(() => {
        fetchReports();
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            const response = await axios.get(`${API_URL}/reports`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(response.data.reports || response.data || []);
        } catch (err) {
            console.error('Failed to fetch reports', err);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setOpenMenu(null);
            setConfirmDelete(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            await axios.delete(`${API_URL}/reports/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(reports.filter(r => r._id !== id));
            setOpenMenu(null);
        } catch (err) {
            console.error('Failed to delete report', err);
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.caseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.reportId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const downloadPDF = async (report) => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Download from server
            const response = await axios.get(`${API_URL}/reports/${report._id}/download`, {
                headers,
                responseType: 'blob'
            });

            // Create download link
            const downloadUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Forensic-Report-${report.caseName}-${report.reportId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'completed': 'bg-green-500/20 text-green-400 border-green-500/30',
            'processing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'failed': 'bg-red-500/20 text-red-400 border-red-500/30',
            'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
        
        return styles[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Reports</h1>
                        <p className="text-sm text-gray-400">Forensic analysis reports and investigation summaries</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-black dark:text-white">{reports.length}</p>
                            <p className="text-xs text-gray-400">Total Reports</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">
                                {reports.filter(r => r.status === 'completed').length}
                            </p>
                            <p className="text-xs text-gray-400">Completed</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-card border border-gray-300 dark:border-gray-800 rounded-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-card border border-gray-300 dark:border-gray-800 rounded-lg text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="processing">Processing</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                        <button className="btn btn-secondary flex items-center gap-2">
                            <Filter size={18} />
                            Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            {(!filteredReports || filteredReports.length === 0) ? (
                <div className="card p-12 text-center">
                    <FolderOpen size={48} className="text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2">No Reports Found</h3>
                    <p className="text-gray-400 mb-4">
                        {searchTerm || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Complete an investigation to generate reports'
                        }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button 
                            onClick={() => navigate('/investigator/ai-analysis')}
                            className="btn btn-primary"
                        >
                            Start Investigation
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <div key={report?._id} className="card hover:shadow-md transition-all duration-200">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <FileText size={24} className="text-blue-400" />
                                    </div>
                                    <div className="relative">
                                        <button
                                            ref={(el) => buttonRefs.current[report?._id] = el}
                                            onClick={() => {
                                                const button = buttonRefs.current[report?._id];
                                                if (button) {
                                                    const rect = button.getBoundingClientRect();
                                                    setMenuPosition({
                                                        top: rect.bottom + 8,
                                                        left: rect.right - 200
                                                    });
                                                }
                                                setOpenMenu(openMenu === report?._id ? null : report?._id);
                                            }}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-gray-400 font-mono">{report?.reportId}</span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(report?.status)}`}>
                                            {report?.status || 'Completed'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-black dark:text-white mb-2 line-clamp-2">
                                        {report?.caseName || 'Unnamed Case'}
                                    </h3>
                                    
                                    <div className="space-y-1 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            {formatDate(report?.date)}
                                        </div>
                                        {report?.caseId && (
                                            <div className="flex items-center gap-2">
                                                <Hash size={14} />
                                                {report?.caseId}
                                            </div>
                                        )}
                                        {report?.anomalies !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={14} />
                                                {report?.anomalies} anomalies detected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadPDF(report)}
                                        className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => navigate('/investigator/ai-analysis', { 
                                            state: { 
                                                selectedCase: { 
                                                    _id: report?.caseRef, 
                                                    caseName: report?.caseName, 
                                                    caseId: report?.caseId 
                                                } 
                                            } 
                                        })}
                                        className="btn btn-secondary p-2"
                                        title="View Analysis"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
        
        {/* Dropdown Portal */}
        {openMenu && createPortal(
            <div 
                ref={menuRef}
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                    width: '200px',
                    backgroundColor: 'red',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    padding: '8px'
                }}
            >
                {confirmDelete === openMenu ? (
                    <div style={{ padding: '12px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                            Delete this report?
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => handleDelete(openMenu)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmDelete(null);
                                    setOpenMenu(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(openMenu)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <Trash2 size={16} />
                        Delete Report
                    </button>
                )}
            </div>,
            document.body
        )}
        </>
    );
};

export default Reports;
