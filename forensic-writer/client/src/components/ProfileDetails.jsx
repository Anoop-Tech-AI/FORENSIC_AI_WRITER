import React from 'react';
import { User, Mail, Shield, Clock, Hash, BadgeCheck, Calendar, Fingerprint, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ProfileDetails = ({ 
    user, 
    profileFields, 
    isEditing, 
    editForm, 
    onEditFormChange, 
    onSave, 
    onCancel, 
    saving,
    onAvatarClick 
}) => {
    const { theme } = useTheme();

    const getSectionIcon = (section) => {
        switch (section) {
            case 'personal': return <User size={18} />;
            case 'account': return <Shield size={18} />;
            case 'role': return <BadgeCheck size={18} />;
            case 'activity': return <Clock size={18} />;
            default: return <User size={18} />;
        }
    };

    const getSectionTitle = (section) => {
        switch (section) {
            case 'personal': return 'Personal Information';
            case 'account': return 'Account Details';
            default: return 'Information';
        }
    };

    // Group fields by section - simplified
    const groupedFields = {
        personal: profileFields.filter(f => ['name', 'username', 'email'].includes(f.key)),
        account: profileFields.filter(f => ['role', 'verification', 'createdAt'].includes(f.key))
    };

    return (
        <div className={`backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${
            theme === 'gradient' ? 'bg-gray-900/50 border-gray-800' :
            'bg-gray-100/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        }`}>
            {/* Header */}
            <div className={`p-6 border-b transition-colors duration-300 ${
                theme === 'gradient' ? 'border-gray-800 bg-gray-800/30' :
                'border-gray-200 dark:border-gray-700 bg-gray-200/30 dark:bg-gray-800/30'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            theme === 'gradient' ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                            'bg-gradient-to-br from-blue-600 to-purple-600'
                        }`}>
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${
                                theme === 'gradient' ? 'text-white' :
                                'text-black dark:text-white'
                            }`}>Account Details</h2>
                            <p className={`text-sm ${
                                theme === 'gradient' ? 'text-gray-400' :
                                'text-gray-600 dark:text-gray-400'
                            }`}>Manage your profile information</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onAvatarClick}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm ${
                                theme === 'gradient' ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300' :
                                'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <User size={16} />
                            Change Avatar
                        </button>
                        
                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onCancel}
                                    className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm ${
                                        theme === 'gradient' ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300' :
                                        'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={saving}
                                    className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm ${
                                        theme === 'gradient' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' :
                                        'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
                {Object.entries(groupedFields).map(([section, fields]) => (
                    <div key={section} className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-800/50">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                {getSectionIcon(section)}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-black dark:text-white">{getSectionTitle(section)}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-500">
                                    {section === 'personal' && 'Your basic personal information'}
                                    {section === 'account' && 'Account details and settings'}
                                </p>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-3">
                            {fields.map((field, idx) => (
                                <div
                                    key={idx}
                                    className="group flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800/50 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700/50 transition-all duration-300"
                                >
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <div className="text-blue-400">
                                            {field.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">
                                                {field.label}
                                            </label>
                                            {!field.editable && (
                                                <div className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                                    Read-only
                                                </div>
                                            )}
                                        </div>
                                        
                                        {isEditing && field.editable ? (
                                            <input
                                                type={field.key === 'email' ? 'email' : 'text'}
                                                value={editForm[field.key]}
                                                onChange={(e) => onEditFormChange(field.key, e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                                                    theme === 'gradient' ? 'bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20' :
                                                    'bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20'
                                                }`}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        ) : (
                                            <div className="font-medium text-black dark:text-white">
                                                {field.value}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status indicator */}
                                    {field.key === 'verification' && (
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className={`p-4 rounded-xl ${
                        theme === 'gradient' ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20' :
                        'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20'
                    }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Fingerprint size={20} className={
                                theme === 'gradient' ? 'text-blue-400' :
                                'text-blue-400'
                            } />
                            <h4 className={`font-semibold ${
                                theme === 'gradient' ? 'text-white' :
                                'text-black dark:text-white'
                            }`}>Security Status</h4>
                        </div>
                        <p className={`text-sm ${
                            theme === 'gradient' ? 'text-gray-400' :
                            'text-gray-600 dark:text-gray-400'
                        }`}>Your account is protected with multi-factor authentication</p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className={`text-xs text-green-400`}>Secure</span>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl ${
                        theme === 'gradient' ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20' :
                        'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20'
                    }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe size={20} className={
                                theme === 'gradient' ? 'text-blue-400' :
                                'text-blue-400'
                            } />
                            <h4 className={`font-semibold ${
                                theme === 'gradient' ? 'text-white' :
                                'text-black dark:text-white'
                            }`}>Last Login</h4>
                        </div>
                        <p className={`text-sm ${
                            theme === 'gradient' ? 'text-gray-400' :
                            'text-gray-600 dark:text-gray-400'
                        }`}>
                            {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Currently active'}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className={`text-xs text-green-400`}>Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetails;
