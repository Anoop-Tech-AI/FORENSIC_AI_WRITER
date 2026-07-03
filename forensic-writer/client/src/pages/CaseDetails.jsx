import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Calendar, User, Shield, Activity, FileText, 
    Upload, Play, ExternalLink, HardDrive, Clock, Search
} from 'lucide-react';
import CaseRemarks from '../components/CaseRemarks';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const CaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getCasesPath = () => {
        if (user?.role === 'legal_advisor') return '/legal/cases';
        if (user?.role === 'admin') return '/admin/dashboard';
        return '/investigator/cases';
    };

    useEffect(() => {
        const fetchCaseDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/cases/${id}`);
                setCaseData(response.data.case || response.data);
            } catch (err) {
                console.error('Failed to fetch case details', err);
                setCaseData(null);
                setError(err.response?.data?.message || 'Failed to load case details');
            } finally {
                setLoading(false);
            }
        };

        fetchCaseDetails();
    }, [id]);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleBackNavigation = () => {
        // Check if user came from AI analysis
        if (location.state?.from === 'ai-analysis') {
            navigate('/ai-analysis', { 
                state: { 
                    selectedCase: caseData,
                    preserveAnalysis: true 
                } 
            });
        } else {
            // Default back to cases
            navigate(getCasesPath());
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Accessing case files...</p>
                </div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
                <div className="card p-8 text-center max-w-md">
                    <Search size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-black dark:text-white mb-2">Case Not Found</h2>
                    <p className="text-gray-400 mb-6">{error || "The investigation record could not be retrieved."}</p>
                    <button onClick={() => navigate(getCasesPath())} className="btn btn-primary w-full">
                        Back to Evidence Vault
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-8">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                    <Link to={getCasesPath()} className="hover:text-black dark:hover:text-white transition-colors">
                        Cases
                    </Link>
                    <span>/</span>
                    <span className="text-black dark:text-white">{caseData.caseName}</span>
                </nav>
                
                <button
                    onClick={handleBackNavigation}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft size={18} />
                    Back to Cases
                </button>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Shield size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs text-gray-400 font-mono tracking-wider">{caseData.caseId}</span>
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                    {caseData.status}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-black dark:text-white">{caseData.caseName}</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/upload', { state: { forensicCase: caseData } })}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Add Evidence
                        </button>
                                            </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Case Metadata */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Investigation Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User size={18} className="text-gray-500 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Lead Investigator</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">{caseData.investigatorName || 'System'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar size={18} className="text-gray-500 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Created Date</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                        {new Date(caseData.createdAt || Date.now()).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock size={18} className="text-gray-500 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Last Activity</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-200">Just now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2 flex items-center gap-2">
                            <Activity size={18} className="text-blue-400" />
                            System Summary
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">Quick overview of digital assets indexed.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-100 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-white/5">
                                <p className="text-2xl font-bold text-black dark:text-white">{caseData.evidence?.length || 0}</p>
                                <p className="text-[10px] text-gray-500 uppercase text-center">Total Files</p>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-white/5">
                                <p className="text-2xl font-bold text-black dark:text-white">0</p>
                                <p className="text-[10px] text-gray-500 uppercase text-center">Reports</p>
                            </div>
                        </div>
                    </div>

                    <CaseRemarks caseId={id} />
                </div>

                {/* Evidence Table */}
                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-black dark:text-white">Digital Evidence Repository</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Activity size={12} className="text-green-500" />
                                    Indexed
                                </span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {!caseData.evidence || caseData.evidence.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                                    <p className="text-gray-400">No evidence files indexed for this case yet.</p>
                                    <button 
                                        onClick={() => navigate('/upload', { state: { forensicCase: caseData } })}
                                        className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Click here to start uploading evidence
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Hashed</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {caseData.evidence.map((file, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                                            <HardDrive size={14} className="text-gray-400" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title={file.fileName}>
                                                            {file.fileName || file.originalName}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-400">{file.fileType || 'binary'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-500">{new Date(file.uploadedAt || Date.now()).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors" title="View Source">
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseDetails;
