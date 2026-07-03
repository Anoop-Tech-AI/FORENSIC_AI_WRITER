import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Activity, Clock, ChevronRight, Eye, BarChart3, FileCheck, AlertCircle, Calendar } from 'lucide-react';
import { useMessages } from '../context/MessageContext';
import axios from 'axios';
import { API_URL } from '../config/api';

const ReporterDashboard = () => {
    const { createNotification } = useMessages();
    const [stats, setStats] = useState({
        totalReports: 0,
        generatedToday: 0,
        pendingReports: 0,
        completedReports: 0,
        downloadedReports: 0
    });
    const [recentReports, setRecentReports] = useState([]);
    const [reportQueue, setReportQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReporterStats();
        fetchRecentReports();
        fetchReportQueue();
    }, []);

    const fetchReporterStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch reporter stats:', error);
            // Mock data for now
            setStats({
                totalReports: 24,
                generatedToday: 3,
                pendingReports: 2,
                completedReports: 18,
                downloadedReports: 15
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentReports = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports`);
            setRecentReports(response.data.reports || []);
        } catch (error) {
            console.error('Failed to fetch recent reports:', error);
            // Mock data for now
            setRecentReports([
                { id: 1, caseId: 'FW-4056', caseName: 'Real_crimes', title: 'Digital Forensic Analysis Report', status: 'completed', generatedAt: '2024-03-10T10:30:00Z', downloadedCount: 5 },
                { id: 2, caseId: 'FW-4057', caseName: 'Digital_Fraud_Case', title: 'Network Traffic Analysis', status: 'generating', generatedAt: '2024-03-10T09:15:00Z', downloadedCount: 0 },
                { id: 3, caseId: 'FW-4058', caseName: 'Cyber_Attack_Investigation', title: 'Malware Analysis Report', status: 'completed', generatedAt: '2024-03-09T16:45:00Z', downloadedCount: 12 }
            ]);
        }
    };

    const fetchReportQueue = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/queue`);
            setReportQueue(response.data);
        } catch (error) {
            console.error('Failed to fetch report queue:', error);
            // Mock data for now
            setReportQueue([
                { id: 1, caseId: 'FW-4057', reportType: 'Full Analysis', status: 'processing', progress: 75, estimatedTime: '5 minutes' },
                { id: 2, caseId: 'FW-4059', reportType: 'Summary Report', status: 'queued', progress: 0, estimatedTime: '2 minutes' },
                { id: 3, caseId: 'FW-4060', reportType: 'Evidence Summary', status: 'completed', progress: 100, estimatedTime: 'Completed' }
            ]);
        }
    };

    const handleGenerateReport = (caseId, reportType) => {
        // Navigate to report generation page
        window.location.href = `/reports/generate?case=${caseId}&type=${reportType}`;
    };

    const handleDownloadReport = async (reportId) => {
        try {
            const response = await axios.get(`${API_URL}/reports/${reportId}/download`, {
                responseType: 'blob'
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `forensic-report-${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Show success notification
            await createNotification({
                userId: user._id,
                title: 'Report Downloaded',
                message: `Forensic report ${reportId} has been downloaded successfully`,
                type: 'report'
            });
        } catch (error) {
            console.error('Failed to download report:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'generating': return 'text-blue-600 bg-blue-100';
            case 'processing': return 'text-orange-600 bg-orange-100';
            case 'queued': return 'text-yellow-600 bg-yellow-100';
            case 'pending': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading reporter dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Reporter Header */}
            <div className="dashboard-header">
                <div className="reporter-header-content">
                    <div className="reporter-title">
                        <FileText className="w-8 h-8 text-green-500 mr-3" />
                        <div>
                            <h1>Reporter Dashboard</h1>
                            <p className="text-gray-600">Forensic report generation and management</p>
                        </div>
                    </div>
                    <div className="reporter-actions">
                        <Link to="/reports/generate" className="btn btn-primary">
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalReports}</h3>
                        <p>Total Reports</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.generatedToday}</h3>
                        <p>Generated Today</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Clock className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.pendingReports}</h3>
                        <p>Pending Reports</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Download className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.downloadedReports}</h3>
                        <p>Downloads</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Recent Reports */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Recent Reports</h2>
                        <Link to="/reports" className="view-all-link">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="recent-reports-list">
                        {recentReports.map((report) => (
                            <div key={report.id} className="report-item">
                                <div className="report-status">
                                    <span className={`status-badge ${getStatusColor(report.status)}`}>
                                        {report.status}
                                    </span>
                                </div>
                                <div className="report-info">
                                    <p className="report-title">{report.title}</p>
                                    <p className="report-case">Case: {report.caseName} ({report.caseId})</p>
                                    <p className="report-meta">
                                        Generated: {formatTimestamp(report.generatedAt)} • {report.downloadedCount} downloads
                                    </p>
                                </div>
                                <div className="report-actions">
                                    {report.status === 'completed' && (
                                        <button
                                            onClick={() => handleDownloadReport(report.id)}
                                            className="btn btn-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                    <Link to={`/reports/${report.id}`} className="btn btn-sm btn-secondary">
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Generation Queue */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Report Generation Queue</h2>
                        <Link to="/reports/queue" className="view-all-link">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="report-queue">
                        {reportQueue.map((item) => (
                            <div key={item.id} className="queue-item">
                                <div className="queue-status">
                                    <span className={`status-badge ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="queue-info">
                                    <p className="queue-type">{item.reportType}</p>
                                    <p className="queue-case">Case: {item.caseId}</p>
                                    {item.status === 'processing' && (
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${item.progress}%` }}
                                            ></div>
                                            <span className="progress-text">{item.progress}%</span>
                                        </div>
                                    )}
                                    <p className="queue-time">ETA: {item.estimatedTime}</p>
                                </div>
                                <div className="queue-actions">
                                    {item.status === 'completed' && (
                                        <button
                                            onClick={() => handleDownloadReport(item.id)}
                                            className="btn btn-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <Link to="/reports/generate" className="action-card">
                        <FileText className="w-6 h-6 text-blue-500" />
                        <span>Generate Report</span>
                    </Link>
                    <Link to="/reports" className="action-card">
                        <Eye className="w-6 h-6 text-green-500" />
                        <span>View Reports</span>
                    </Link>
                    <Link to="/reports/templates" className="action-card">
                        <FileCheck className="w-6 h-6 text-orange-500" />
                        <span>Report Templates</span>
                    </Link>
                    <Link to="/reports/schedule" className="action-card">
                        <Calendar className="w-6 h-6 text-purple-500" />
                        <span>Scheduled Reports</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ReporterDashboard;
