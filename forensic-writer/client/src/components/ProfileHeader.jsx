import React from 'react';
import { Camera, Edit2, BadgeCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ProfileHeader = ({ 
    user, 
    onAvatarClick, 
    onEditClick, 
    renderCurrentAvatar,
    isEditing,
    saving 
}) => {
    const { theme } = useTheme();

    return (
        <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border shadow-2xl transition-colors duration-300 ${
            theme === 'gradient' ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 border-white/10' :
            'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700'
        }`}>
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

            <div className="relative p-8">
                <div className="flex flex-col items-center gap-6">
                    {/* Avatar Section */}
                    <div className="relative group">
                        {/* Avatar with glowing ring */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-75 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                        <div className="relative cursor-pointer" onClick={onAvatarClick}>
                            {renderCurrentAvatar(120)}
                            {/* Status indicator */}
                            <div className="absolute bottom-3 right-3 w-7 h-7 bg-green-500 border-4 border-gray-200 dark:border-gray-900 rounded-full flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        {/* Camera overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer" onClick={onAvatarClick}>
                            <Camera size={28} className="text-white" />
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="text-center">
                        <h1 className={`text-3xl font-bold mb-2 ${
                            theme === 'gradient' ? 'text-white' : 'text-black dark:text-white'
                        }`}>
                            {user?.name || user?.username || 'User'}
                        </h1>
                        <p className={`text-lg mb-4 ${
                            theme === 'gradient' ? 'text-white/80' : 'text-gray-700 dark:text-white/80'
                        }`}>
                            {user?.role === 'system_admin' ? 'System Administrator' : 
                             user?.role === 'legal_advisor' ? 'Legal Advisor' : 
                             user?.role === 'forensic_investigator' ? 'Forensic Investigator' : 
                             user?.role || 'Unknown Role'}
                        </p>
                        
                        {/* Single Verified Badge */}
                        <div className="flex justify-center mb-6">
                            <div className={`flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-full ${
                                theme === 'gradient' ? 'bg-white/20 border-white/30' : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/20'
                            }`}>
                                <BadgeCheck size={16} className="text-black dark:text-white" />
                                <span className="text-sm font-medium text-black dark:text-white">Verified</span>
                            </div>
                        </div>

                        {/* Edit Profile Button */}
                        <button
                            onClick={onEditClick}
                            disabled={isEditing}
                            className={`px-8 py-3 backdrop-blur-sm border font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                theme === 'gradient' ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white' :
                                'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border-gray-200 dark:border-white/20 text-black dark:text-white'
                            }`}
                        >
                            <Edit2 size={18} />
                            {isEditing ? 'Editing...' : 'Edit Profile'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
