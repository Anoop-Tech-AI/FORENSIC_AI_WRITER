import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Shield, FileText, User, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const EnterpriseNewCase = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        caseName: '',
        caseId: `FW-${Math.floor(1000 + Math.random() * 9000)}`,
        investigatorName: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            const res = await axios.post(`${API_URL}/cases`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const createdCase = res.data.case || res.data;
            console.log('Case created successfully:', createdCase);
            
            // Navigate to evidence page with case data
            navigate('/investigator/evidence', { 
                state: { forensicCase: createdCase },
                replace: true
            });
        } catch (err) {
            console.error('Case Registration Error:', err);
            setError(err.response?.data?.message || 'Failed to register case');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeInUp">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">New Investigation</h1>
                    <p className="text-gray-400">Create a new forensic case file</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                            <Shield className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-black dark:text-white font-bold text-lg mb-2">Investigative Integrity</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                This case establishes the official investigation record within the Forensic Writer system. All entered information creates the foundation for evidence handling, AI analysis, and final reporting.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                            <FileText className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-black dark:text-white font-bold text-lg mb-2">Scope & Accountability</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                This case file defines the investigation parameters, assigns ownership, and documents preliminary findings. These details enable evidence association and track investigative actions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="p-8 rounded-2xl border backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* First Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="caseName" className="flex items-center gap-2 text-black dark:text-white font-medium">
                                <FileText size={16} className="text-blue-400" />
                                Case Name
                            </label>
                            <input
                                type="text"
                                id="caseName"
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all"
                                placeholder="e.g., Corporate Espionage 01"
                                value={formData.caseName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="caseId" className="flex items-center gap-2 text-black dark:text-white font-medium">
                                <Shield size={16} className="text-purple-400" />
                                Case ID
                            </label>
                            <input
                                type="text"
                                id="caseId"
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all"
                                value={formData.caseId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="investigatorName" className="flex items-center gap-2 text-black dark:text-white font-medium">
                                <User size={16} className="text-green-400" />
                                Investigator Name
                            </label>
                            <input
                                type="text"
                                id="investigatorName"
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all"
                                placeholder="Agent Smith"
                                value={formData.investigatorName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="date" className="flex items-center gap-2 text-black dark:text-white font-medium">
                                <Calendar size={16} className="text-orange-400" />
                                Date of Investigation
                            </label>
                            <input
                                type="date"
                                id="date"
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="notes" className="flex items-center gap-2 text-black dark:text-white font-medium">
                            <FileText size={16} className="text-blue-400" />
                            Preliminary Notes
                        </label>
                        <p className="text-gray-400 text-sm">
                            Record initial observations, objectives, and known facts relevant to the investigation. These notes assist in guiding evidence analysis and AI-generated insights.
                        </p>
                        <textarea
                            id="notes"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all resize-vertical"
                            style={{ minHeight: '120px' }}
                            placeholder="Initial findings and scope of analysis..."
                            value={formData.notes}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <Save size={20} />
                                    Continue to Evidence
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnterpriseNewCase;
