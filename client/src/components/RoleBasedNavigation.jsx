import React from 'react';
import {
    Home, Folder, Upload, Search, FileText, Settings, MessageSquare,
    User, Shield, Activity, Mail, Brain, Eye, Download, Users, BarChart3,
    FileSearch, History, LogOut, Lock, FileArchive, FileEdit
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Role constants - Phase 10
const ROLES = {
    ADMIN: 'admin',
    INVESTIGATOR: 'investigator',
    LEGAL_ADVISOR: 'legal_advisor'
};

import { useAuth } from '../context/AuthContext';

/**
 * RoleBasedNavigation - Completely separate navigation for each role
 * Admin, Investigator, and Legal Advisor have completely different sidebars
 */
const RoleBasedNavigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    
    // Get navigation items based strictly on user role
    const getNavItems = () => {
        if (!user || !user.role) {
            return { roleType: 'unknown', items: [] };
        }

        const role = user.role;

        // ============================================================
        // ADMIN - MANAGEMENT & MONITORING
        // ============================================================
        if (role === ROLES.ADMIN) {
            return {
                roleType: 'admin',
                items: [
                    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
                    { path: '/admin/users', icon: Users, label: 'Users' },
                    { path: '/admin/messages', icon: Mail, label: 'Messages' },
                    { path: '/admin/history', icon: History, label: 'History' },
                    { path: '/admin/settings', icon: Settings, label: 'Settings' },
                    { path: '/profile', icon: User, label: 'My Profile' }
                ]
            };
        }

        // ============================================================
        // INVESTIGATOR - ALL FEATURES
        // ============================================================
        if (role === ROLES.INVESTIGATOR) {
            return {
                roleType: 'investigator',
                items: [
                    { path: '/investigator/dashboard', icon: Home, label: 'Dashboard' },
                    { path: '/investigator/cases', icon: Folder, label: 'Cases' },
                    { path: '/investigator/new-case', icon: FileText, label: 'New Investigation' },
                    { path: '/investigator/evidence', icon: Upload, label: 'Evidence Vault' },
                    { path: '/investigator/ai-analysis', icon: Brain, label: 'AI Investigation' },
                    { path: '/investigator/reports', icon: BarChart3, label: 'Reports' },
                    { path: '/investigator/messages', icon: Mail, label: 'Messages' },
                    { path: '/investigator/history', icon: History, label: 'History' },
                    { path: '/profile', icon: User, label: 'My Profile' }
                ]
            };
        }

        // ============================================================
        // LEGAL ADVISOR - REVIEW & ADVISORY
        // ============================================================
        if (role === ROLES.LEGAL_ADVISOR) {
            return {
                roleType: 'legal',
                items: [
                    { path: '/legal/dashboard', icon: Shield, label: 'Legal Dashboard' },
                    { path: '/legal/cases', icon: Folder, label: 'Case Review' },
                    { path: '/legal/reports', icon: FileSearch, label: 'Reports Review' },
                    { path: '/legal/messages', icon: Mail, label: 'Messages' },
                    { path: '/legal/history', icon: History, label: 'History' },
                    { path: '/profile', icon: User, label: 'My Profile' }
                ]
            };
        }

        // Default fallback
        return {
            roleType: 'unknown',
            items: [
                { path: '/profile', icon: User, label: 'My Profile' }
            ]
        };
    };

    const { roleType, items } = getNavItems();
    
    // Get role display name
    const getRoleDisplay = () => {
        switch(roleType) {
            case 'admin': return { label: 'System Administrator', color: 'text-red-400' };
            case 'investigator': return { label: 'Forensic Investigator', color: 'text-blue-400' };
            case 'legal': return { label: 'Legal Advisor', color: 'text-purple-400' };
            default: return { label: 'Authenticated User', color: 'text-gray-400' };
        }
    };
    
    const roleDisplay = getRoleDisplay();

    return (
        <div className="flex flex-col h-full">
            {/* Role Badge */}
            <div className="px-4 py-2 mb-4">
                <div className={`text-xs font-bold uppercase tracking-wider ${roleDisplay.color} border-l-2 border-current pl-2`}>
                    {roleDisplay.label}
                </div>
            </div>
            
            {/* Navigation Items */}
            <nav className="flex flex-col space-y-1 flex-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                                ${active 
                                    ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-400' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-black dark:hover:text-white'
                                }
                            `}
                        >
                            <Icon size={18} className={active ? 'text-blue-400' : 'text-gray-600 dark:text-gray-400'} />
                            <span className="font-medium">
                                {item.label}
                            </span>
                            {active && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>
            
            {/* Logout Section */}
            <div className="mt-auto px-4 py-4 border-t border-gray-200 dark:border-gray-800">
                {roleType === 'legal' && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500 mb-4 px-2">
                        <Lock size={12} />
                        <span>View-only access</span>
                    </div>
                )}
                
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut size={18} />
                    <span className="font-medium">Logout System</span>
                </button>
            </div>
        </div>
    );
};

export default RoleBasedNavigation;
