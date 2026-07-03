import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
    Menu, X, Shield, User, Settings, Calendar, HelpCircle
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeSwitcher from './ThemeSwitcher';
import MiniAIAssistant from './MiniAIAssistant';
import RoleBasedNavigation from './RoleBasedNavigation';
import { useAuth } from '../context/AuthContext';
import Portal from './Portal';
import FAQModal from './FAQModal';

const EnterpriseLayout = ({ children }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
    const profileMenuRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageInfo = () => {
        const path = location.pathname;
        const pageMap = {
            '/admin/dashboard': { title: 'Admin Command', subtitle: 'System-wide Overview' },
            '/investigator/dashboard': { title: 'Investigator Terminal', subtitle: 'Active Cases & Tasks' },
            '/legal/dashboard': { title: 'Legal Oversight', subtitle: 'Review & Advisory' },
            '/investigator/cases': { title: 'Case Repository', subtitle: 'All Forensic Records' },
            '/investigator/new-case': { title: 'Initiate Investigation', subtitle: 'New Case File' },
            '/investigator/messages': { title: 'Secure Comms', subtitle: 'Encrypted Messaging' },
            '/admin/messages': { title: 'Secure Comms', subtitle: 'Encrypted Messaging' },
            '/legal/messages': { title: 'Secure Comms', subtitle: 'Encrypted Messaging' },
            '/profile': { title: 'Account Profile', subtitle: 'Credential Management' },
        };
        
        // Find best match for nested routes
        const match = Object.keys(pageMap).find(key => path.startsWith(key));
        return pageMap[match] || { title: 'Forensic System', subtitle: 'Secure Environment' };
    };

    const pageInfo = getPageInfo();

    useEffect(() => {
        const handleClickOutside = (event) => {
            // The portal dropdown is outside profileMenuRef DOM tree,
            // so only close if click is outside both the ref AND not inside the portal dropdown
            const portalDropdown = document.querySelector('[data-profile-dropdown]');
            if (
                profileMenuRef.current && 
                !profileMenuRef.current.contains(event.target) &&
                (!portalDropdown || !portalDropdown.contains(event.target))
            ) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900 text-black dark:text-gray-300 font-sans selection:bg-blue-500/30">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 
                transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Shield size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-black dark:text-white tracking-tight">FORENSIC WRITER</span>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-4">
                    <RoleBasedNavigation user={user} />
                </div>

                {/* Footer User Card */}
                <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 transition-all">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black dark:text-white truncate">{user?.username || 'Username'}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                {/* Header */}
                <header className="h-16 lg:h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-[50]">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div className="min-w-0">
                            <h2 className="text-black dark:text-white font-bold text-lg leading-tight truncate">{pageInfo.title}</h2>
                            <p className="text-[11px] text-gray-600 dark:text-gray-500 font-mono uppercase tracking-widest hidden sm:block">{pageInfo.subtitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden xl:flex flex-col items-end mr-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Calendar size={12} className="text-blue-500" />
                                {currentDate}
                            </div>
                        </div>
                        
                        <div className="h-8 w-px bg-gray-200 dark:bg-white/5" />
                        
                        <div className="flex items-center gap-2">
                            <ThemeSwitcher />
                            <NotificationBell />
                            
                            {/* FAQ Help Button */}
                            <button
                                onClick={() => setIsFAQModalOpen(true)}
                                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 group relative"
                                title="Help / FAQs"
                            >
                                <HelpCircle size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </button>
                            
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 group"
                                >
                                    <User size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                </button>

                                 {isProfileMenuOpen && (
                                    <Portal>
                                        <div data-profile-dropdown className="fixed right-6 top-16 lg:top-20 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[99999] animate-in fade-in slide-in-from-top-2 pointer-events-auto">
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5 mb-1">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Authenticated As</p>
                                                <p className="text-sm font-bold text-black dark:text-white truncate">{user?.username}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation();
                                                    setIsProfileMenuOpen(false); 
                                                    setTimeout(() => navigate('/profile'), 50);
                                                }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-sm font-medium"
                                            >
                                                <Settings size={16} /> Account Settings
                                            </button>
                                        </div>
                                    </Portal>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content with Standardized Container */}
                {/* Page Content with Standardized Container */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:p-8 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* AI Assistant - Persisted for ALL roles and pages */}
            <MiniAIAssistant />
            
            {/* FAQ Modal */}
            <FAQModal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} />
        </div>
    );
};

export default EnterpriseLayout;
