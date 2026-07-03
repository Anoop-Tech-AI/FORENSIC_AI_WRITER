import React from 'react';
import { TrendingUp, Users, FileText, Clock, Award, Target } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ProfileStats = ({ user }) => {
    const { theme } = useTheme();

    const stats = [
        {
            title: 'Cases Solved',
            value: '247',
            change: '+12%',
            icon: <FileText size={20} />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        {
            title: 'Success Rate',
            value: '98.5%',
            change: '+2.3%',
            icon: <Target size={20} />,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        {
            title: 'Evidence Processed',
            value: '1,247',
            change: '+8%',
            icon: <Users size={20} />,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        },
        {
            title: 'Avg. Resolution Time',
            value: '2.4 days',
            change: '-15%',
            icon: <Clock size={20} />,
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20'
        },
        {
            title: 'Team Collaboration',
            value: '89%',
            change: '+5%',
            icon: <Award size={20} />,
            color: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-500/10',
            borderColor: 'border-pink-500/20'
        },
        {
            title: 'Performance Score',
            value: '94.2',
            change: '+3.1%',
            icon: <TrendingUp size={20} />,
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-500/10',
            borderColor: 'border-indigo-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`group relative overflow-hidden backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                        theme === 'gradient' ? 'bg-gray-900/50 border-gray-800 hover:border-gray-700' :
                        'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    {/* Content */}
                    <div className="relative">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.bgColor} ${stat.borderColor} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <div className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.icon}
                                </div>
                            </div>
                            
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                                stat.change.startsWith('+') 
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                                <TrendingUp size={12} />
                                <span className="text-xs font-semibold">{stat.change}</span>
                            </div>
                        </div>

                        {/* Value */}
                        <div className="mb-2">
                            <div className={`text-3xl font-bold group-hover:scale-105 transition-transform duration-300 ${
                                theme === 'gradient' ? 'text-white' :
                                'text-black dark:text-white'
                            }`}>
                                {stat.value}
                            </div>
                        </div>

                        {/* Title */}
                        <div className={`text-sm font-medium ${
                            theme === 'gradient' ? 'text-gray-400' :
                            'text-gray-600 dark:text-gray-400'
                        }`}>
                            {stat.title}
                        </div>

                        {/* Progress bar (for some stats) */}
                        {(stat.title === 'Success Rate' || stat.title === 'Team Collaboration' || stat.title === 'Performance Score') && (
                            <div className="mt-4">
                                <div className={`w-full rounded-full h-2 ${
                                    theme === 'gradient' ? 'bg-gray-800' :
                                    'bg-gray-200 dark:bg-gray-700'
                                }`}>
                                    <div 
                                        className={`h-2 rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000 ease-out`}
                                        style={{ 
                                            width: stat.title === 'Success Rate' ? '98.5%' : 
                                                   stat.title === 'Team Collaboration' ? '89%' : '94.2%' 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProfileStats;
