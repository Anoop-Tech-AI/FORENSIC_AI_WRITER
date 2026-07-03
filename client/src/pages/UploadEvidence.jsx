import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, CloudUpload, FileText, Image as ImageIcon, Database,
    Phone, MessageSquare, CheckCircle, Loader2, X, Upload, File,
    AlertTriangle
} from 'lucide-react';
import { API_URL } from '../config/api';
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

const UploadEvidence = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const { forensicCase } = location.state || {};

    // Evidence files state
    const [currentFiles, setCurrentFiles] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [loadingCases, setLoadingCases] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (!forensicCase) {
            const fetchCases = async () => {
                try {
                    setLoadingCases(true);
                    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const response = await axios.get(`${API_URL}/cases`, { headers });
                    setCases(response.data.cases || response.data || []);
                } catch (err) {
                    setError('Failed to load available cases.');
                } finally {
                    setLoadingCases(false);
                }
            };
            fetchCases();
        }
    }, [forensicCase]);

    const fileTypes = [
        { name: 'Documents', icon: FileText, ext: 'PDF, DOCX', color: 'blue' },
        { name: 'Images', icon: ImageIcon, ext: 'JPG, PNG', color: 'green' },
        { name: 'System Logs', icon: Database, ext: 'EVTX, LOG', color: 'purple' },
        { name: 'Call Records', icon: Phone, ext: 'CSV, XLSX', color: 'yellow' },
        { name: 'Chat Files', icon: MessageSquare, ext: 'DB, SQLITE', color: 'red' }
    ];

    const isImageFile = (fileName) => IMAGE_EXTS.includes(fileName.split('.').pop().toLowerCase());

    // ── Evidence upload handlers ──────────────────────────────────────────────
    const handleFileSelect = (e) => setCurrentFiles(Array.from(e.target.files));

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        setCurrentFiles(Array.from(e.dataTransfer.files));
    };

    const handleUpload = async () => {
        const targetCaseId = forensicCase?._id || selectedCaseId;
        if (!targetCaseId) { setError('No case selected.'); return; }
        if (currentFiles.length === 0) { setError('Please select at least one file.'); return; }

        setUploading(true); setError('');
        const formData = new FormData();
        currentFiles.forEach(f => formData.append('evidence', f));

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            await axios.post(`${API_URL}/evidence/${targetCaseId}`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
            });
            setIsUploaded(true);
            setTimeout(() => navigate('/investigator'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index) => setCurrentFiles(prev => prev.filter((_, i) => i !== index));

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (IMAGE_EXTS.includes(ext)) return ImageIcon;
        if (['pdf', 'doc', 'docx'].includes(ext)) return FileText;
        if (['csv', 'xlsx', 'xls'].includes(ext)) return Database;
        return File;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-8">
            {/* Header */}
            <div>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4">
                    <ArrowLeft size={18} /> Back
                </button>
                <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Upload Evidence</h1>
                {forensicCase ? (
                    <p className="text-sm text-gray-400">Case: <span className="text-black dark:text-white font-medium">{forensicCase.caseName}</span></p>
                ) : (
                    <div className="mt-2">
                        {loadingCases ? <span className="text-sm text-gray-400">Loading cases...</span> : (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-400">Select a Case for Upload</label>
                                <select
                                    className="w-full md:w-80 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-black dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    value={selectedCaseId}
                                    onChange={(e) => { setSelectedCaseId(e.target.value); setError(''); }}
                                >
                                    <option value="">-- Choose Case --</option>
                                    {cases.map(c => <option key={c._id} value={c._id}>{c.caseId} - {c.caseName}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* ── Section 1: Evidence Files ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
                        <h2 className="text-lg font-bold text-black dark:text-white mb-6 flex items-center gap-2">
                            <CloudUpload size={20} className="text-blue-400" /> Evidence Files
                        </h2>

                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} />

                        <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        >
                            {isUploaded ? (
                                <div className="space-y-3">
                                    <CheckCircle size={56} className="text-green-500 mx-auto" />
                                    <p className="text-lg font-semibold text-black dark:text-white">Upload Complete</p>
                                    <p className="text-gray-400 text-sm">Evidence stored and hashed</p>
                                </div>
                            ) : uploading ? (
                                <div className="space-y-4">
                                    <Loader2 size={56} className="text-blue-500 mx-auto animate-spin" />
                                    <p className="text-lg font-semibold text-black dark:text-white">Uploading... {uploadProgress}%</p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <CloudUpload size={56} className="text-gray-400 mx-auto" />
                                    <p className="text-lg font-semibold text-black dark:text-white">
                                        {currentFiles.length > 0 ? `${currentFiles.length} file(s) selected` : 'Drop evidence files here'}
                                    </p>
                                    <p className="text-gray-400 text-sm">{currentFiles.length > 0 ? 'Click to change' : 'or click to browse'}</p>
                                </div>
                            )}
                        </div>

                        {currentFiles.length > 0 && !uploading && !isUploaded && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-black dark:text-white">Selected Files</h3>
                                    <button onClick={handleUpload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
                                        <Upload size={16} /> Upload Evidence
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentFiles.map((file, index) => {
                                        const Icon = getFileIcon(file.name);
                                        return (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                                <Icon size={18} className="text-gray-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-black dark:text-white truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                                <button onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <h3 className="font-semibold text-black dark:text-white mb-4">Supported Formats</h3>
                        <div className="space-y-3">
                            {fileTypes.map((type, i) => {
                                const Icon = type.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg bg-${type.color}-500/20 flex items-center justify-center`}>
                                            <Icon size={16} className={`text-${type.color}-400`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-black dark:text-white">{type.name}</p>
                                            <p className="text-xs text-gray-400">{type.ext}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <h3 className="font-semibold text-black dark:text-white mb-4">Upload Guidelines</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {['Files are automatically SHA-256 hashed', 'Max 100MB per file', 'Encrypted during transmission', 'Metadata preserved for analysis'].map((g, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />{g}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadEvidence;
