import React from 'react';
import { Briefcase, Cpu, Database, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color, trend, delay = 0 }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  const iconColors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl animate-fadeInUp`}
      style={{
        animationDelay: `${delay}ms`,
      }}
      className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 ${
        colorClasses[color] ? colorClasses[color].split(' ')[1] : 'border-gray-200 dark:border-gray-700/50'
      }`}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 30px ${color === 'blue' ? '#3b82f6' : color === 'purple' ? '#8b5cf6' : color === 'orange' ? '#f97316' : '#10b981'}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Glassmorphism overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-50`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2 tracking-wide">{title}</p>
            <h3 className="text-black dark:text-white text-3xl font-bold mb-3">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-2">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(trend)}% from last week
                </span>
              </div>
            )}
          </div>
          
          <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`w-6 h-6 ${iconColors[color]}`} />
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 transition-opacity duration-300 group-hover:opacity-20`} />
    </div>
  );
};

export default StatsCard;
