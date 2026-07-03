import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Shield, Clock, Hash, BadgeCheck, Camera, X, Upload, Loader2, MoreVertical, Edit2, Save, Award, Activity, Fingerprint, Eye, FileText, Zap, Target, LogOut } from 'lucide-react';
import axios from 'axios';
import ProfileHeader from '../components/ProfileHeader';
import ProfileDetails from '../components/ProfileDetails';
import ProfileStats from '../components/ProfileStats';
import { API_URL } from '../config/api';

// Cute SVG Avatar presets
const PRESET_AVATARS = [
    { key: 'boy1', label: 'Boy 1', bg: '#3b82f6', hair: '#4a2c0a', skin: '#f5cba7', shirt: '#2563eb' },
    { key: 'boy2', label: 'Boy 2', bg: '#10b981', hair: '#1a1a1a', skin: '#d4a574', shirt: '#059669' },
    { key: 'boy3', label: 'Boy 3', bg: '#f59e0b', hair: '#8B4513', skin: '#ffe0bd', shirt: '#d97706' },
    { key: 'boy4', label: 'Boy 4', bg: '#6366f1', hair: '#2c1810', skin: '#c68642', shirt: '#4f46e5' },
    { key: 'girl1', label: 'Girl 1', bg: '#ec4899', hair: '#1a1a1a', skin: '#f5cba7', shirt: '#db2777' },
    { key: 'girl2', label: 'Girl 2', bg: '#8b5cf6', hair: '#8B4513', skin: '#ffe0bd', shirt: '#7c3aed' },
    { key: 'girl3', label: 'Girl 3', bg: '#f43f5e', hair: '#d4763a', skin: '#d4a574', shirt: '#e11d48' },
    { key: 'girl4', label: 'Girl 4', bg: '#14b8a6', hair: '#2c1810', skin: '#c68642', shirt: '#0d9488' },
];

// SVG Avatar component for boys
const BoyAvatar = ({ hair, skin, shirt, size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Head */}
        <circle cx="50" cy="42" r="24" fill={skin} />
        {/* Hair */}
        <ellipse cx="50" cy="30" rx="24" ry="16" fill={hair} />
        <rect x="26" y="28" width="48" height="6" rx="3" fill={hair} />
        {/* Eyes */}
        <circle cx="40" cy="42" r="3" fill="#1a1a1a" />
        <circle cx="60" cy="42" r="3" fill="#1a1a1a" />
        <circle cx="41" cy="41" r="1" fill="white" />
        <circle cx="61" cy="41" r="1" fill="white" />
        {/* Smile */}
        <path d="M42 50 Q50 56 58 50" stroke="#c0392b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <circle cx="34" cy="48" r="3" fill="#f8a5a5" opacity="0.5" />
        <circle cx="66" cy="48" r="3" fill="#f8a5a5" opacity="0.5" />
        {/* Body/Shirt */}
        <path d="M30 66 Q30 62 38 62 L62 62 Q70 62 70 66 L74 90 L26 90 Z" fill={shirt} />
        {/* Collar */}
        <path d="M42 62 L50 70 L58 62" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);

// SVG Avatar component for girls
const GirlAvatar = ({ hair, skin, shirt, size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Long Hair behind */}
        <ellipse cx="50" cy="50" rx="30" ry="36" fill={hair} />
        {/* Head */}
        <circle cx="50" cy="42" r="22" fill={skin} />
        {/* Hair bangs */}
        <path d="M28 38 Q30 22 50 20 Q70 22 72 38" fill={hair} />
        <path d="M32 35 Q40 28 50 30 Q38 32 35 38" fill={hair} />
        <path d="M68 35 Q60 28 50 30 Q62 32 65 38" fill={hair} />
        {/* Eyes */}
        <ellipse cx="40" cy="42" rx="3" ry="3.5" fill="#1a1a1a" />
        <ellipse cx="60" cy="42" rx="3" ry="3.5" fill="#1a1a1a" />
        <circle cx="41" cy="41" r="1.2" fill="white" />
        <circle cx="61" cy="41" r="1.2" fill="white" />
        {/* Eyelashes */}
        <path d="M36 39 L34 37" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" />
        <path d="M64 39 L66 37" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" />
        {/* Smile */}
        <path d="M43 50 Q50 55 57 50" stroke="#e74c3c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Blush */}
        <circle cx="34" cy="48" r="3.5" fill="#f8a5a5" opacity="0.5" />
        <circle cx="66" cy="48" r="3.5" fill="#f8a5a5" opacity="0.5" />
        {/* Body/Shirt */}
        <path d="M32 66 Q32 62 40 62 L60 62 Q68 62 68 66 L72 90 L28 90 Z" fill={shirt} />
        {/* Neckline */}
        <path d="M44 62 Q50 68 56 62" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);

const AvatarPreview = ({ preset, size = 80 }) => {
    if (preset.key.startsWith('boy')) {
        return <BoyAvatar hair={preset.hair} skin={preset.skin} shirt={preset.shirt} size={size} />;
    }
    return <GirlAvatar hair={preset.hair} skin={preset.skin} shirt={preset.shirt} size={size} />;
};

import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const { user, login, logout } = useAuth();
    
    const fileInputRef = useRef(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.name || user?.username || '',
        username: user?.username || '',
        email: user?.email || ''
    });

    const currentAvatar = user?.avatar || '';
    const currentPreset = PRESET_AVATARS.find(p => p.key === currentAvatar);

    const handlePresetSelect = async (preset) => {
        setSaving(true);
        try {
            const res = await axios.put(`${API_URL}/users/avatar/preset`, { avatarKey: preset.key });
            const updatedUser = { ...user, avatar: res.data.avatar };
            login(updatedUser);
            setShowAvatarPicker(false);
        } catch (err) {
            console.error('Failed to save avatar', err);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (ev) => setUploadPreview(ev.target.result);
        reader.readAsDataURL(file);

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await axios.post(`${API_URL}/users/avatar/upload`, formData);
            const updatedUser = { ...user, avatar: res.data.avatar };
            login(updatedUser);
            setShowAvatarPicker(false);
            setUploadPreview(null);
        } catch (err) {
            console.error('Failed to upload avatar', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`${API_URL}/users/profile`, editForm);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update profile', err);
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const renderCurrentAvatar = (size = 72) => {
        if (currentPreset) {
            return (
                <div style={{
                    width: size, height: size, borderRadius: '50%', overflow: 'hidden',
                    background: currentPreset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0
                }}>
                    <AvatarPreview preset={currentPreset} size={size - 6} />
                </div>
            );
        }
        if (currentAvatar && currentAvatar.startsWith('/uploads/')) {
            return (
                <img src={`${API_URL.replace('/api', '')}${currentAvatar}`} alt="Avatar"
                    style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
            );
        }
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid rgba(255,255,255,0.4)', fontSize: size * 0.4, fontWeight: 800, color: 'white', flexShrink: 0
            }}>
                {(user?.name || user?.username || 'I').charAt(0).toUpperCase()}
            </div>
        );
    };

    // Helper function to format role display
    const formatRoleDisplay = (role) => {
        const roleMap = {
            'admin': 'System Administrator',
            'investigator': 'Forensic Investigator',
            'legal_advisor': 'Legal Advisor'
        };
        return roleMap[role] || role || 'Unknown';
    };

    // Helper function to format verification status
    const formatVerificationStatus = (isVerified) => {
        return isVerified ? 'Verified' : 'Not Verified';
    };

    const profileFields = [
        { label: 'Full Name', value: user?.name || user?.username || 'User', icon: <User size={18} />, key: 'name', editable: true },
        { label: 'Username', value: user?.username || '—', icon: <Hash size={18} />, key: 'username', editable: true },
        { label: 'Email', value: user?.email || '—', icon: <Mail size={18} />, key: 'email', editable: true },
        { label: 'Role', value: formatRoleDisplay(user?.role), icon: <Shield size={18} />, editable: false },
        { label: 'Verification', value: formatVerificationStatus(user?.isVerified), icon: <BadgeCheck size={18} />, editable: false },
        { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active', icon: <Clock size={18} />, editable: false },
    ];

    return (
        <div className="w-full h-full">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header with Back and Logout Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800/70 hover:border-gray-400 dark:hover:border-gray-600/50 transition-all duration-300 hover:scale-105"
                    >
                        <ChevronLeft size={18} />
                        <span className="font-medium">Back</span>
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 backdrop-blur-sm border border-red-600/50 text-red-400 rounded-xl hover:bg-red-600/30 hover:border-red-600/70 transition-all duration-300 hover:scale-105"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>

                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Header */}
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileHeader
                            user={user}
                            onAvatarClick={() => setShowAvatarPicker(true)}
                            onEditClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                            renderCurrentAvatar={renderCurrentAvatar}
                            isEditing={isEditing}
                            saving={saving}
                        />
                    </div>

                    {/* Right Column - Details and Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Details */}
                        <ProfileDetails
                            user={user}
                            profileFields={profileFields}
                            isEditing={isEditing}
                            editForm={editForm}
                            onEditFormChange={(key, value) => setEditForm({ ...editForm, [key]: value })}
                            onSave={handleSaveProfile}
                            onCancel={() => { 
                                setIsEditing(false); 
                                setEditForm({ 
                                    name: user?.name || '', 
                                    username: user?.username || '', 
                                    email: user?.email || '' 
                                }); 
                            }}
                            saving={saving}
                            onAvatarClick={() => setShowAvatarPicker(true)}
                        />

                        {/* Stats Grid */}
                        <div>
                            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Activity size={16} className="text-black dark:text-white" />
                                </div>
                                Performance Analytics
                            </h2>
                            <ProfileStats user={user} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                     onClick={(e) => { if (e.target === e.currentTarget) setShowAvatarPicker(false); }}>
                    <div className="bg-white dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-black/50">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Change Avatar</h3>
                                <p className="text-gray-600 dark:text-gray-400">Choose a preset avatar or upload your own</p>
                            </div>
                            <button
                                onClick={() => setShowAvatarPicker(false)}
                                className="w-10 h-10 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Loading State */}
                        {saving && (
                            <div className="text-center py-8">
                                <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-400">Saving avatar...</p>
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Upload size={20} className="text-gray-600 dark:text-gray-400" />
                                <h4 className="text-lg font-semibold text-black dark:text-white">Upload Custom Avatar</h4>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={saving}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={18} className="inline mr-2" />
                                    Choose File
                                </button>
                                <p className="text-sm text-gray-500 mt-3">JPG, PNG or GIF (max 5MB)</p>
                                
                                {uploadPreview && (
                                    <div className="mt-4">
                                        <img src={uploadPreview} alt="Preview" className="w-24 h-24 rounded-full mx-auto border-4 border-gray-300 dark:border-gray-700" />
                                        <p className="text-xs text-gray-400 mt-2">Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-8">
                            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
                            <span className="text-gray-600 dark:text-gray-500 text-sm font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
                        </div>

                        {/* Preset Avatars */}
                        <div className="space-y-6">
                            {/* Boys Section */}
                            <div>
                                <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-2xl">Boy Avatars</span>
                                </h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {PRESET_AVATARS.filter(p => p.key.startsWith('boy')).map(preset => (
                                        <div
                                            key={preset.key}
                                            onClick={() => !saving && handlePresetSelect(preset)}
                                            className={`relative group cursor-pointer rounded-2xl overflow-hidden p-2 transition-all duration-300 hover:scale-105 ${
                                                currentAvatar === preset.key 
                                                    ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/20' 
                                                    : 'hover:ring-2 hover:ring-gray-600'
                                            }`}
                                            style={{ backgroundColor: preset.bg }}
                                        >
                                            <AvatarPreview preset={preset} size={80} />
                                            {currentAvatar === preset.key && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Girls Section */}
                            <div>
                                <h4 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
                                    <span className="text-2xl">Girl Avatars</span>
                                </h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {PRESET_AVATARS.filter(p => p.key.startsWith('girl')).map(preset => (
                                        <div
                                            key={preset.key}
                                            onClick={() => !saving && handlePresetSelect(preset)}
                                            className={`relative group cursor-pointer rounded-2xl overflow-hidden p-2 transition-all duration-300 hover:scale-105 ${
                                                currentAvatar === preset.key 
                                                    ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/20' 
                                                    : 'hover:ring-2 hover:ring-gray-600'
                                            }`}
                                            style={{ backgroundColor: preset.bg }}
                                        >
                                            <AvatarPreview preset={preset} size={80} />
                                            {currentAvatar === preset.key && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
