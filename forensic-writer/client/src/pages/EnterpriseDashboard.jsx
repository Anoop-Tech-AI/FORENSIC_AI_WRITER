import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Briefcase, Cpu, Database, Activity, TrendingUp, TrendingDown, 
    PlusCircle, Search, Filter, MoreVertical, Eye, Brain, Clock,
    AlertCircle, CheckCircle, XCircle, Upload
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const EnterpriseDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCases: 0,
        totalEvidence: 0,
        completedAnalysis: 0,
        pendingTasks: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [analysisQueue, setAnalysisQueue] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token') || localStorage.getItem('forensic-token');
            const headers = { Authorization: `Bearer ${token}` };
            
            try {
                const [statsRes, casesRes] = await Promise.all([
                    axios.get(`${API_URL}/cases/stats`, { headers }),
                    axios.get(`${API_URL}/cases`, { headers })
                ]);

                if (statsRes.data?.success) {
                    setStats({
                        activeCases: statsRes.data.activeCases || 0,
                        totalEvidence: statsRes.data.totalEvidence || 0,
                        completedAnalysis: statsRes.data.completedAnalysis || 0,
                        pendingTasks: statsRes.data.pendingCases || 0
                    });
                }

                if (casesRes.data?.success) {
                    setRecentCases((casesRes.data.cases || []).slice(0, 5));
                }

                // Mock analysis queue data
                setAnalysisQueue([
                    { id: 1, caseId: 'FW-4057', fileName: 'network_logs.csv', progress: 65, status: 'processing' },
                    { id: 2, caseId: 'FW-4056', fileName: 'chat_messages.db', progress: 0, status: 'queued' },
                    { id: 3, caseId: 'FW-4055', fileName: 'device_photo.jpg', progress: 100, status: 'completed' }
                ]);

            } catch (error) {
                console.error('Dashboard fetch error:', error);
                setStats({ activeCases: 0, totalEvidence: 0, completedAnalysis: 0, pendingTasks: 0 });
                setRecentCases([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }) => {
        const colorClasses = {
            blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            green: 'from-green-500/20 to-green-600/20 border-green-500/30',
            orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
            purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
        };

        const iconColors = {
            blue: 'text-blue-400',
            green: 'text-green-400',
            orange: 'text-orange-400',
            purple: 'text-purple-400',
        };

        return (
            <div 
                className="p-6 rounded-2xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    animationDelay: `${delay}ms`
                }}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
                        <Icon className={iconColors[color]} size={24} />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${
                            trend.type === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {trend.type === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>{trend.value}%</span>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-1">{value}</h3>
                    <p className="text-gray-400 text-sm">{title}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
                        <Brain className="text-blue-500" /> Investigator Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Digital Forensic Investigation Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                        <Activity className="text-blue-400" size={18} />
                        <span className="text-blue-400 font-medium text-sm">System Live</span>
                    </div>
                    <button 
                        onClick={() => navigate('/investigator/new-case')}
                        className="p-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40 group"
                    >
                        <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-medium text-sm">New Case</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Cases" 
                    value={stats.activeCases} 
                    icon={Briefcase} 
                    color="blue" 
                    trend={{ type: 'up', value: 12 }}
                    delay={100}
                />
                <StatCard 
                    title="Total Evidence" 
                    value={stats.totalEvidence} 
                    icon={Database} 
                    color="green" 
                    trend={{ type: 'up', value: 8 }}
                    delay={200}
                />
                <StatCard 
                    title="Completed Analysis" 
                    value={stats.completedAnalysis} 
                    icon={CheckCircle} 
                    color="purple" 
                    trend={{ type: 'up', value: 5 }}
                    delay={300}
                />
                <StatCard 
                    title="Pending Tasks" 
                    value={stats.pendingTasks} 
                    icon={Clock} 
                    color="orange" 
                    trend={{ type: 'down', value: 2 }}
                    delay={400}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Cases */}
                <div className="lg:col-span-2 p-6 rounded-2xl border backdrop-blur-sm space-y-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                            <Briefcase className="text-blue-400" size={20} />
                            Recent Investigations
                        </h2>
                        <button 
                            onClick={() => navigate('/investigator/cases')}
                            className="text-sm text-blue-400 hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentCases?.length > 0 ? (
                            recentCases.map((case_) => (
                                <div 
                                    key={case_._id}
                                    className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 hover:border-blue-500/30 transition-all cursor-pointer group"
                                    onClick={() => navigate(`/investigator/cases/${case_._id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Database className="text-blue-400" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-black dark:text-white font-medium group-hover:text-blue-400 transition-colors">
                                                    {case_.caseName}
                                                </h4>
                                                <p className="text-gray-400 text-sm">ID: {case_.caseId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-black dark:text-white text-sm font-medium">{case_.evidenceCount || 0} Files</p>
                                            <p className="text-gray-500 text-xs">{new Date(case_.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Briefcase size={40} className="mx-auto mb-2 opacity-20" />
                                <p>No recent cases found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Queue */}
                <div className="p-6 rounded-2xl border backdrop-blur-sm space-y-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Cpu className="text-purple-400" size={20} />
                        Analysis Queue
                    </h2>

                    <div className="space-y-6">
                        {analysisQueue?.length > 0 ? (
                            analysisQueue.map((item) => (
                                <div key={item.id} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{item.caseId}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                            item.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                            item.status === 'queued' ? 'bg-gray-500/20 text-gray-400' :
                                            'bg-green-500/20 text-green-400'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{item.fileName}</div>
                                    <div className="relative h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                                                item.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                                                item.status === 'queued' ? 'bg-gray-600' :
                                                'bg-green-500'
                                            }`}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-600">
                                        <span>{item.progress}% Completed</span>
                                        <span>{item.status === 'processing' ? 'Est. 2m' : ''}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Cpu size={40} className="mx-auto mb-2 opacity-20" />
                                <p>Queue is empty</p>
                            </div>
                        )}
                        
                        <button className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-sm flex items-center justify-center gap-2 group">
                            <PlusCircle size={16} className="group-hover:scale-110 transition-transform" />
                            Add to Queue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
