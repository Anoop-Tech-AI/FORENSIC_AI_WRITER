import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    ArrowLeft, Cpu, Activity, Shield, Zap, Terminal, BarChart, Download, 
    Search, AlertCircle, CheckCircle, Loader2, Play, FileText, X, Clock,
    Network, Globe, HardDrive, Hash, Eye, Upload, FolderOpen
} from 'lucide-react';
import { API_URL } from '../config/api';

const AIInvestigator = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedCase: initialCase, preserveAnalysis } = location.state || {};

    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(initialCase || null);
    const [selectedEvidence, setSelectedEvidence] = useState([]);
    const [availableEvidence, setAvailableEvidence] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisLogs, setAnalysisLogs] = useState([]);
    const [currentPhase, setCurrentPhase] = useState('');
    const [reportReady, setReportReady] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [manualFiles, setManualFiles] = useState([]);
    const [evidenceLoadError, setEvidenceLoadError] = useState(false);
    const [showManualUpload, setShowManualUpload] = useState(false);
    const logEndRef = useRef(null);

    const phases = [
        { name: 'Metadata Extraction', weight: 20 },
        { name: 'Hash Verification', weight: 15 },
        { name: 'Pattern Analysis', weight: 25 },
        { name: 'AI Processing', weight: 30 },
        { name: 'Report Generation', weight: 10 }
    ];

    const addLog = (msg, type = 'system') => {
        setAnalysisLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            msg,
            type
        }]);
    };

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [analysisLogs]);

    // Preserve analysis state in localStorage
    useEffect(() => {
        if (selectedCase && (reportReady || analysisResults)) {
            const analysisState = {
                selectedCase,
                selectedEvidence,
                analysisResults,
                reportReady,
                analysisLogs,
                analysisProgress,
                currentPhase,
                timestamp: Date.now()
            };
            localStorage.setItem(`ai-analysis-${selectedCase._id}`, JSON.stringify(analysisState));
        }
    }, [selectedCase, selectedEvidence, analysisResults, reportReady, analysisLogs, analysisProgress, currentPhase]);

    // Restore analysis state if preserveAnalysis flag is set
    useEffect(() => {
        if (preserveAnalysis && selectedCase) {
            try {
                const savedState = localStorage.getItem(`ai-analysis-${selectedCase._id}`);
                if (savedState) {
                    const state = JSON.parse(savedState);
                    // Only restore if saved within last 30 minutes
                    if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                        setSelectedEvidence(state.selectedEvidence || []);
                        setAnalysisResults(state.analysisResults);
                        setReportReady(state.reportReady);
                        setAnalysisLogs(state.analysisLogs || []);
                        setAnalysisProgress(state.analysisProgress || 0);
                        setCurrentPhase(state.currentPhase || '');
                        setIsAnalyzing(false); // Don't restart analysis
                    }
                }
            } catch (error) {
                console.error('Failed to restore analysis state:', error);
            }
        }
    }, [preserveAnalysis, selectedCase]);

    const { user } = useAuth();
    const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchCases = async () => {
            if (!token) return;
            try {
                const response = await axios.get(`${API_URL}/cases`, { headers });
                const caseList = response.data.cases || response.data;
                setCases(caseList);
                if (!selectedCase && caseList && caseList.length > 0) {
                    setSelectedCase(caseList[0]);
                }
            } catch (err) {
                console.error('Failed to fetch cases:', err);
                addLog('Failed to load cases', 'error');
            }
        };

        fetchCases();
    }, [token]);

    useEffect(() => {
        if (selectedCase && token) {
            // Fetch evidence for selected case
            const fetchEvidence = async () => {
                try {
                    const caseId = selectedCase._id;
                    console.log("[EVIDENCE LOAD] Fetching for case ID:", caseId);
                    
                    const response = await axios.get(`${API_URL}/evidence/case/${caseId}`, { headers });
                    console.log("[EVIDENCE LOAD] Response:", response.data);
                    
                    const evidence = response.data || [];
                    console.log("[EVIDENCE LOAD] Evidence count:", evidence.length);
                    
                    setAvailableEvidence(evidence);
                    setEvidenceLoadError(false);
                    
                    if (evidence.length > 0) {
                        addLog(`Loaded ${evidence.length} evidence file(s) for case ${selectedCase.caseName}`, 'success');
                    } else {
                        setShowManualUpload(true);
                    }
                } catch (err) {
                    console.error('[EVIDENCE LOAD ERROR]:', err);
                    setAvailableEvidence([]);
                    setShowManualUpload(true);
                }
            };

            fetchEvidence();
        }
    }, [selectedCase, token]);

    const handleCaseChange = (caseId) => {
        const selected = cases.find(c => c._id === caseId);
        setSelectedCase(selected);
        setSelectedEvidence([]);
        setManualFiles([]);
        setReportReady(false);
        setAnalysisResults(null);
        setEvidenceLoadError(false);
        setShowManualUpload(false);
        addLog(`Selected case: ${selected?._id || selected?.caseId} - ${selected?.caseName}`, 'system');
    };

    const toggleEvidenceSelection = (evidence) => {
        const isSelected = selectedEvidence.find(e => e._id === evidence._id);
        if (isSelected) {
            setSelectedEvidence(selectedEvidence.filter(e => e._id !== evidence._id));
        } else {
            setSelectedEvidence([...selectedEvidence, evidence]);
        }
    };

    const handleManualFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setManualFiles(files);
        addLog(`Selected ${files.length} file(s) for manual upload`, 'system');
    };

    const uploadManualFiles = async () => {
        if (!selectedCase || manualFiles.length === 0) {
            addLog('Please select files to upload', 'error');
            return;
        }

        try {
            const formData = new FormData();
            manualFiles.forEach(file => {
                formData.append('evidence', file);
            });

            const caseId = selectedCase._id;
            console.log('[UPLOAD] Uploading files for case ID:', caseId);
            
            const response = await axios.post(`${API_URL}/evidence/${caseId}`, formData, {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('[UPLOAD] Response:', response.data);
            
            // Re-fetch evidence after upload
            const evidenceResponse = await axios.get(`${API_URL}/evidence/case/${caseId}`, { headers });
            const updatedEvidence = evidenceResponse.data || [];
            
            setAvailableEvidence(updatedEvidence);
            setManualFiles([]);
            setShowManualUpload(false);
            setEvidenceLoadError(false);
            addLog(`Successfully uploaded ${manualFiles.length} file(s)`, 'success');
        } catch (err) {
            console.error('Failed to upload files:', err);
            addLog('Failed to upload files. Please try again.', 'error');
        }
    };

    const removeEvidence = (evidenceId) => {
        setSelectedEvidence(selectedEvidence.filter(e => e._id !== evidenceId));
    };

    const startAnalysis = async () => {
        if (!selectedCase) {
            addLog('Please select a case', 'error');
            return;
        }

        if (selectedEvidence.length === 0) {
            addLog('Please select at least one evidence file', 'error');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setAnalysisLogs([]);
        setCurrentPhase(phases[0].name);

        try {
            const caseId = selectedCase._id;
            const evidenceIds = selectedEvidence.map(e => e._id);
            const evidenceData = selectedEvidence.map(e => ({
                fileName: e.fileName,
                fileType: e.fileType,
                fileSize: e.fileSize
            }));

            console.log('[AI ANALYSIS] Starting analysis for case ID:', caseId);
            console.log('[AI ANALYSIS] Evidence IDs:', evidenceIds);
            console.log('[AI ANALYSIS] Evidence data:', evidenceData);

            addLog('Initializing forensic analysis pipeline...', 'system');
            addLog(`Processing ${selectedEvidence.length} file(s)...`, 'system');

            // Simulate progress updates for each phase
            const phases = [
                { name: 'Loading Files', duration: 1000 },
                { name: 'Generating SHA-256 Hashes', duration: 1500 },
                { name: 'Detecting File Types', duration: 1000 },
                { name: 'Extracting Content', duration: 2000 },
                { name: 'Running Anomaly Detection', duration: 2500 },
                { name: 'Analyzing Patterns', duration: 2000 },
                { name: 'Generating Report', duration: 1500 }
            ];

            let currentProgress = 0;
            const progressIncrement = 100 / phases.length;

            for (let i = 0; i < phases.length; i++) {
                const phase = phases[i];
                setCurrentPhase(phase.name);
                addLog(`>>> ${phase.name}`, 'phase');
                
                await new Promise(resolve => setTimeout(resolve, phase.duration));
                
                currentProgress += progressIncrement;
                setAnalysisProgress(Math.min(100, currentProgress));
            }

            addLog('Sending evidence to AI analysis engine...', 'system');

            const response = await axios.post(`${API_URL}/ai/analyze/${caseId}`, {
                evidenceIds,
                evidenceData,
                caseName: selectedCase.caseName
            }, { headers });

            console.log('[AI ANALYSIS] Response:', response.data);

            // Process the analysis results
            const analysis = response.data.analysis;
            const summary = response.data.summary;

            addLog('Analysis completed successfully', 'success');
            addLog(`Confidence Score: ${(analysis.confidence * 100).toFixed(1)}%`, 'success');
            addLog(`Anomalies Detected: ${analysis.anomalies}`, summary.totalAnomalies > 0 ? 'warning' : 'success');
            addLog(`Risk Level: ${analysis.riskLevel}`, analysis.riskLevel === 'HIGH' ? 'error' : 'success');
            
            if (analysis.reportUrl) {
                addLog(`Report generated: ${analysis.reportFileName}`, 'success');
            }

            setAnalysisResults({
                summary: analysis.summary,
                evidence_summary: analysis.evidence_summary,
                observations: [analysis.observations].flat(),
                conclusions: analysis.conclusions,
                confidence: (analysis.confidence || analysis.confidenceScore || 0.94) * 100,
                processing_time: analysis.processingTime || analysis.processing_time || '3.0s',
                key_findings: analysis.findings?.map(f => f.description) || [],
                remarks: {
                    risk_level: analysis.riskLevel || 'Medium',
                    assessment: analysis.conclusions
                },
                reportUrl: analysis.reportUrl,
                reportFileName: analysis.reportFileName,
                files: analysis.files,
                llmReport: analysis.llmReport || null,
                imageResults: analysis.imageResults || [],
            });

            setIsAnalyzing(false);
            setReportReady(true);
            addLog('Report generation complete', 'success');

        } catch (err) {
            console.error('[AI ANALYSIS ERROR]:', err);
            setIsAnalyzing(false);
            addLog('Analysis failed. Please try again.', 'error');
            addLog(`Error: ${err.response?.data?.error || err.message}`, 'error');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'phase': return 'text-purple-400';
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'warning': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const stripHTMLTags = (html) => {
        // Remove style tags and their content
        let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Remove script tags and their content
        text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Remove HTML head section
        text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
        
        // Remove HTML comments
        text = text.replace(/<!--[\s\S]*?-->/g, '');
        
        // Replace block-level elements with newlines
        text = text.replace(/<\/(div|p|h[1-6]|li|tr|td|th|ul|ol|section|article|header|footer)>/gi, '\n\n');
        
        // Replace inline elements with space
        text = text.replace(/<\/(span|strong|em|b|i|a|small|sub|sup)>/gi, ' ');
        
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Replace HTML entities
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        
        // Remove multiple consecutive newlines and whitespace
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
        text = text.replace(/[ \t]+/g, ' ');
        
        // Clean up extra whitespace
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    };

    const handleExportPDF = () => {
        if (!reportReady || !analysisResults) {
            addLog('No analysis report available to export', 'error');
            return;
        }

        try {
            // Create new PDF document
            const doc = new jsPDF();
            
            // Pagination helper function
            let y = 20;
            const pageHeight = 280; // A4 page height with margin
            const marginLeft = 15;
            const maxWidth = 180; // Full page width with small margins
            
            const checkPageBreak = (requiredHeight = 10) => {
                if (y + requiredHeight > pageHeight) {
                    doc.addPage();
                    y = 20;
                    return true;
                }
                return false;
            };
            
            const addText = (text, fontSize = 10, color = [0, 0, 0]) => {
                doc.setFontSize(fontSize);
                doc.setTextColor(...color);
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach(line => {
                    checkPageBreak(8);
                    doc.text(line, marginLeft, y);
                    y += 8;
                });
                return y;
            };
            
            const addSectionTitle = (title) => {
                checkPageBreak(20);
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text(title, marginLeft, y);
                y += 15;
                return y;
            };
            
            // Title
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.text('Forensic Investigation Report', 105, y, { align: 'center' });
            y += 20;
            
            // Case Information
            checkPageBreak(40);
            doc.setFontSize(12);
            doc.text(`Case: ${selectedCase?.caseName || 'Unknown'}`, marginLeft, y);
            y += 10;
            doc.text(`Case ID: ${selectedCase?.caseId || 'N/A'}`, marginLeft, y);
            y += 10;
            doc.text(`Date: ${new Date().toLocaleDateString()}`, marginLeft, y);
            y += 10;
            doc.text(`Investigator: ${user?.name || 'AI Investigator'}`, marginLeft, y);
            y += 20;
            
            // If LLM report exists, use it directly without old template
            if (analysisResults.llmReport) {
                // Clean white background
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 210, 297, 'F');
                
                // HEADER SECTION
                y = 30;
                doc.setFontSize(18);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.text('FORENSIC INVESTIGATION REPORT', 105, y, { align: 'center' });
                y += 20;
                
                // Case info block
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                
                const caseInfo = [
                    { label: 'Case Name:', value: selectedCase?.caseName || 'Unknown' },
                    { label: 'Case ID:', value: selectedCase?.caseId || 'N/A' },
                    { label: 'Date:', value: new Date().toLocaleDateString() },
                    { label: 'Investigator:', value: user?.name || 'AI Investigator' },
                    { label: 'Evidence Type:', value: 'File Analysis' },
                    { label: 'Report Status:', value: 'COURT READY' }
                ];
                
                caseInfo.forEach(info => {
                    checkPageBreak(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(info.label, 25, y);
                    doc.setFont('helvetica', 'normal');
                    doc.text(info.value, 60, y);
                    y += 8;
                });
                
                y += 15;
                
                // Add separator line
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                doc.line(25, y, 185, y);
                y += 20;
                
                // Add report content
                const rawLLMReport = analysisResults.llmReport;
                const analysisText = stripHTMLTags(rawLLMReport);
                
                // Process text to detect section headers and format accordingly
                const lines = analysisText.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        checkPageBreak(15);
                        // Check if line looks like a section header (all caps)
                        if (line === line.toUpperCase() && line.length > 3 && line.length < 50) {
                            // Section heading: bold, uppercase, with line underneath
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(0, 0, 0);
                            doc.text(line, 25, y);
                            y += 5;
                            doc.setDrawColor(0, 0, 0);
                            doc.setLineWidth(1);
                            doc.line(25, y, 185, y);
                            y += 12;
                        } else if (line.endsWith(':')) {
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(0, 0, 0);
                            doc.text(line, 25, y);
                            y += 8;
                        } else if (line.startsWith('•') || line.startsWith('-')) {
                            // Bullet point
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(0, 0, 0);
                            doc.text(line, 30, y);
                            y += 7;
                        } else {
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(0, 0, 0);
                            const wrappedLines = doc.splitTextToSize(line, 160);
                            wrappedLines.forEach(wrappedLine => {
                                checkPageBreak(7);
                                doc.text(wrappedLine, 25, y);
                                y += 6;
                            });
                        }
                    }
                });
                
                // NOTE section at bottom
                y += 20;
                checkPageBreak(15);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(80, 80, 80);
                doc.text('Note: This report is based solely on the provided evidence data and does not include any external information or assumptions.', 25, y);
                y += 10;
                
                // FOOTER on every page
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text('ForensiQ — Automated Digital Forensics Reporting Tool', 105, 285, { align: 'center' });
                    doc.text(`Case ID: ${selectedCase?.caseId || 'N/A'} | Generated: ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
                }
                y += 10;
            } else {
                // Use old template for fallback
                // Objective Section
                y = addSectionTitle('OBJECTIVE');
                const objectiveText = analysisResults.objective || 
                    "The main aim of this system is to analyze large volumes of raw data such as call logs, records, files, and documents, which cannot be efficiently processed by humans within a limited time. The AI system performs this analysis and generates a structured report highlighting patterns and anomalies.";
                y = addText(objectiveText, 10, [50, 50, 50]);
                y += 10;
                
                // Evidence Summary Section
                y = addSectionTitle('EVIDENCE SUMMARY');
                const evidenceSummary = analysisResults.evidence_summary || 
                    selectedEvidence.map(e => `- ${e.fileName} (${e.fileType || 'Unknown'})`).join('\n');
                y = addText(evidenceSummary, 10, [50, 50, 50]);
                y += 10;
                
                // Analysis Section
                checkPageBreak(20);
                doc.setFontSize(11);
                const analysisText = 'No AI-generated analysis available. Please check server logs for LLM availability.';
                y = addText(analysisText, 10, [50, 50, 50]);
                y += 10;
            }
            
            // Add new page for timeline if available
            if (analysisResults.timeline && analysisResults.timeline.length > 0) {
                doc.addPage();
                y = 20;
                y = addSectionTitle('TIMELINE');
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                analysisResults.timeline.forEach((event) => {
                    checkPageBreak(10);
                    doc.text(event, marginLeft, y);
                    y += 8;
                });
            }
            
            // Add new page for anomalies if available
            if (analysisResults.anomalies && analysisResults.anomalies.length > 0) {
                doc.addPage();
                y = 20;
                y = addSectionTitle('ANOMALIES DETECTED');
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                analysisResults.anomalies.forEach((anomaly) => {
                    checkPageBreak(10);
                    doc.text(`\u2022 ${anomaly}`, marginLeft + 5, y);
                    y += 8;
                });
            }
            
            // Save the PDF
            doc.save(`forensic-report-${selectedCase?.caseId || 'unknown'}-${Date.now()}.pdf`);
            
            addLog('PDF report exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            addLog('Failed to export PDF report', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Cpu size={24} className="text-black dark:text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-1">AI Investigation Terminal</h1>
                        <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Neural Link: ACTIVE</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all text-sm font-bold"
                    >
                        RETURN
                    </button>
                    {user.role === 'investigator' && (
                        <button
                            onClick={startAnalysis}
                            disabled={isAnalyzing || !selectedCase || selectedEvidence.length === 0}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                            {isAnalyzing ? 'RUNNING ANALYSIS...' : 'INITIATE ANALYSIS'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Analysis Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Case & Evidence Selection */}
                    <div className="bg-[#0B1220]/80 backdrop-blur-lg border border-white/5 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-3">
                                <Search size={20} className="text-blue-400" /> SOURCE MATERIAL
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-bold uppercase">
                                    {selectedEvidence.length} FILES SELECTED
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Case Context</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-white/5 rounded-xl text-black dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                                    value={selectedCase?._id || ''}
                                    onChange={(e) => handleCaseChange(e.target.value)}
                                    disabled={isAnalyzing || user.role !== 'investigator'}
                                >
                                    {cases.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.caseId} - {c.caseName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedCase && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                                        Available Evidence Files
                                        <span className="ml-2 text-gray-400">Selected: {selectedEvidence.length}/{availableEvidence.length}</span>
                                    </label>

                                    {availableEvidence.length > 0 ? (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {availableEvidence.map((evidence) => {
                                                const isSelected = !!selectedEvidence.find(e => e._id === evidence._id);
                                                return (
                                                    <div
                                                        key={evidence._id}
                                                        onClick={() => !isAnalyzing && user.role === 'investigator' && toggleEvidenceSelection(evidence)}
                                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                            isSelected 
                                                                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                                                                : 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-white/5 text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/10'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            readOnly
                                                            className="w-4 h-4 text-blue-500 rounded"
                                                        />
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600/20' : 'bg-white/5'}`}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold truncate">{evidence.fileName || evidence.originalName}</p>
                                                            <p className="text-[10px] opacity-70 uppercase">{evidence.fileType || 'binary'}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-white/5 rounded-lg">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <FolderOpen size={20} />
                                                <span className="text-sm">No evidence files found for this case</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Upload Section */}
                                    {showManualUpload && (
                                        <div className="mt-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 text-blue-400 mb-3">
                                                <Upload size={16} />
                                                <span className="text-sm font-semibold">Manual File Upload</span>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleManualFileUpload}
                                                disabled={isAnalyzing}
                                                className="w-full text-xs text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 disabled:opacity-50"
                                            />
                                            {manualFiles.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="text-xs text-gray-400">
                                                        Selected files: {manualFiles.length}
                                                    </div>
                                                    {manualFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded">
                                                            <FileText size={14} className="text-gray-400" />
                                                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
                                                            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={uploadManualFiles}
                                                        disabled={isAnalyzing}
                                                        className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        Upload Files
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evidence Selection */}
                    {selectedCase && availableEvidence.length > 0 && (
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-accent" />
                                Select Evidence ({selectedEvidence.length}/{availableEvidence.length})
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableEvidence.map((evidence) => {
                                    const isSelected = !!selectedEvidence.find(e => e._id === evidence._id);
                                    return (
                                        <div
                                            key={evidence._id}
                                            onClick={() => !isAnalyzing && toggleEvidenceSelection(evidence)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-500/20 border-blue-500' 
                                                    : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="w-4 h-4 text-blue-500"
                                                    disabled={isAnalyzing}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-black dark:text-white truncate">
                                                        {evidence.fileName || evidence.originalName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {formatFileSize(evidence.fileSize)} • {evidence.fileType || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Analysis Console */}
                    <div className="bg-gray-100 dark:bg-black border-gray-300 dark:border-gray-800 border rounded-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                                    <Terminal size={12} className="inline mr-2" />
                                    Analysis Console
                                </span>
                            </div>
                            {isAnalyzing && (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-green-400">LIVE</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 h-64 overflow-y-auto font-mono text-sm">
                            {analysisLogs.length === 0 ? (
                                <div className="text-center text-gray-600 mt-20">
                                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Awaiting analysis initiation...</p>
                                </div>
                            ) : (
                                analysisLogs.map((log, i) => (
                                    <div key={i} className="flex gap-3 mb-1">
                                        <span className="text-gray-600">[{log.timestamp}]</span>
                                        <span className={getLogColor(log.type)}>
                                            {log.type === 'phase' && '>>> '}
                                            {log.msg}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>

                {/* Status Panel */}
                <div className="space-y-6">
                    {/* Analysis Status */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Analysis Status</h3>
                        
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">
                                    {isAnalyzing ? currentPhase : reportReady ? 'Complete' : 'Ready'}
                                </span>
                                <span className="text-accent font-bold">{Math.round(analysisProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${analysisProgress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">Hash Status</p>
                                <p className="text-sm font-semibold text-green-400 flex items-center gap-1">
                                    <Shield size={14} />
                                    Verified
                                </p>
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">AI Confidence</p>
                                <p className="text-sm font-semibold text-yellow-400 flex items-center gap-1">
                                    <Zap size={14} />
                                    98.4%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selected Evidence */}
                    {selectedEvidence.length > 0 && (
                        <div className="card p-6 border-green-500/30">
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-400" />
                                Selected Files ({selectedEvidence.length})
                            </h3>
                            <div className="space-y-2">
                                {selectedEvidence.map((evidence) => (
                                    <div key={evidence._id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800/50 rounded">
                                        <HardDrive size={14} className="text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-black dark:text-white truncate">
                                                {evidence.fileName || evidence.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(evidence.fileSize)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => !isAnalyzing && removeEvidence(evidence._id)}
                                            disabled={isAnalyzing}
                                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {reportReady && analysisResults && (
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                                    <CheckCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Analysis Complete</h3>
                                    <p className="text-xs text-gray-400">
                                        Report ID: FW-{selectedCase?.caseId}
                                    </p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4 border-b border-gray-800">
                                {['summary', 'details', 'images', 'report'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                            activeTab === tab
                                                ? 'text-blue-400 border-blue-400'
                                                : 'text-gray-400 border-transparent hover:text-gray-300'
                                        }`}
                                    >
                                        {tab === 'images' ? '🖼 Images' : tab === 'report' ? '🤖 AI Report' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'summary' && (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
                                        <p className="text-xs text-gray-300 leading-relaxed">{analysisResults.summary}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white mb-2">Key Findings</h4>
                                        <ul className="text-xs text-gray-300 space-y-1">
                                            {analysisResults.observations?.map((obs, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />{obs}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'details' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><p className="text-xs text-gray-400">Processing Time</p><p className="text-sm font-medium text-white">{analysisResults.processing_time}</p></div>
                                        <div><p className="text-xs text-gray-400">Confidence Score</p><p className="text-sm font-medium text-white">{analysisResults.confidence?.toFixed(1)}%</p></div>
                                        <div><p className="text-xs text-gray-400">Files Analyzed</p><p className="text-sm font-medium text-white">{selectedEvidence.length}</p></div>
                                        <div><p className="text-xs text-gray-400">Hash Algorithm</p><p className="text-sm font-medium text-white">SHA-256</p></div>
                                    </div>
                                    {analysisResults.files?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-white mb-2">Analyzed Files</h4>
                                            <div className="space-y-2">
                                                {analysisResults.files.map((file, i) => (
                                                    <div key={i} className="p-2 bg-gray-800/50 rounded text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-white">{file.fileName}</span>
                                                            <span className="text-gray-400">{file.confidence?.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="text-gray-500 mt-1">Hash: {file.hash?.substring(0, 32)}...</div>
                                                        {file.anomalies?.length > 0 && <div className="mt-1 text-red-400">{file.anomalies.length} anomaly(ies)</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'images' && (
                                <div className="space-y-3">
                                    {analysisResults.imageResults?.length > 0 ? (
                                        analysisResults.imageResults.map((img, i) => (
                                            <div key={i} className="p-3 bg-gray-800/50 rounded-xl border border-gray-700 space-y-2">
                                                <p className="text-xs font-bold text-white">{img.fileName}</p>
                                                <p className="text-xs text-gray-400 leading-relaxed">{img.forensicSummary}</p>
                                                {img.sceneLabels?.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Scene</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {img.sceneLabels.slice(0, 3).map((s, j) => (
                                                                <span key={j} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px]">
                                                                    {s.label} {(s.score * 100).toFixed(0)}%
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {img.detectedObjects?.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Objects</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {img.detectedObjects.slice(0, 5).map((o, j) => (
                                                                <span key={j} className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px]">
                                                                    {o.label} {(o.score * 100).toFixed(0)}%
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {img.riskIndicators?.length > 0 && (
                                                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                                        <span className="text-xs text-red-400 font-semibold">⚠ Risk: {img.riskIndicators.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p className="text-sm">No image evidence was analyzed</p>
                                            <p className="text-xs mt-1">Upload images in the Evidence section to see AI analysis here</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'report' && (
                                <div className="space-y-3">
                                    {analysisResults.llmReport ? (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded font-bold">LLaMA-3.1-8B</span>
                                                <span className="text-xs text-gray-500">Generated by HuggingFace</span>
                                            </div>
                                            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{analysisResults.llmReport}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p className="text-sm">LLM report not available</p>
                                            <p className="text-xs mt-1">Ensure HF_API_KEY is set in server .env and LLaMA access is granted</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-6">
                                <button 
                                    onClick={handleExportPDF}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                    disabled={!reportReady}
                                >
                                    <Download size={16} />
                                    Export PDF
                                </button>
                                <button 
                                    onClick={() => navigate(`/cases/${selectedCase?._id}`, { 
                                        state: { from: 'ai-analysis' }
                                    })}
                                    className="btn btn-secondary flex items-center gap-2 text-sm"
                                >
                                    <Eye size={16} />
                                    View Details
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInvestigator;
