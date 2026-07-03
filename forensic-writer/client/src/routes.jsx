import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Cases from './pages/EnterpriseCases';
import EnterpriseLayout from './components/EnterpriseLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';

// Auth Pages
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));

// Restricted Pages
const Profile = React.lazy(() => import('./pages/Profile'));
const CaseDetails = React.lazy(() => import('./pages/CaseDetails'));
const UploadEvidence = React.lazy(() => import('./pages/UploadEvidence'));
const NewCase = React.lazy(() => import('./pages/EnterpriseNewCase'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const LegalDashboard = React.lazy(() => import('./pages/LegalDashboard'));
const InvestigatorDashboard = React.lazy(() => import('./pages/EnterpriseDashboard'));
const Messages = React.lazy(() => import('./pages/Messages'));
const History = React.lazy(() => import('./pages/History'));
const Users = React.lazy(() => import('./pages/Users'));
const Reports = React.lazy(() => import('./pages/Reports'));
const AIInvestigator = React.lazy(() => import('./pages/AIInvestigator'));

// Layout wrapper component
const LayoutWrapper = ({ children }) => {
    return (
        <EnterpriseLayout>
            {children}
        </EnterpriseLayout>
    );
};


// Helper component for loading state
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

// Smart redirect: send logged-in users to their dashboard, others to login
const SmartRedirect = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'investigator') return <Navigate to="/investigator/dashboard" replace />;
        if (user.role === 'legal_advisor') return <Navigate to="/legal/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
};

const RoutesConfig = ({ routeKey }) => {
    
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* 🎯 Auth Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* 🎯 Admin Routes (Strict Limitation) */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Routes>
                            <Route path="/" element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<LayoutWrapper><AdminDashboard /></LayoutWrapper>} />
                            <Route path="users" element={<LayoutWrapper><Users /></LayoutWrapper>} />
                            <Route path="messages" element={<LayoutWrapper><Messages /></LayoutWrapper>} />
                            <Route path="history" element={<LayoutWrapper><History /></LayoutWrapper>} />
                            <Route path="settings" element={<LayoutWrapper><Profile /></LayoutWrapper>} />
                        </Routes>
                    </ProtectedRoute>
                } />

                {/* 🎯 Investigator Routes (Full Access) */}
                <Route path="/investigator/*" element={
                    <ProtectedRoute allowedRoles={['investigator']}>
                        <Routes>
                            <Route path="/" element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<LayoutWrapper><InvestigatorDashboard /></LayoutWrapper>} />
                            <Route path="cases" element={<LayoutWrapper><Cases /></LayoutWrapper>} />
                            <Route path="cases/:id" element={<LayoutWrapper><CaseDetails /></LayoutWrapper>} />
                            <Route path="new-case" element={<LayoutWrapper><NewCase /></LayoutWrapper>} />
                            <Route path="evidence" element={<LayoutWrapper><UploadEvidence /></LayoutWrapper>} />
                            <Route path="ai-analysis" element={<LayoutWrapper><AIInvestigator /></LayoutWrapper>} />
                            <Route path="reports" element={<LayoutWrapper><Reports /></LayoutWrapper>} />
                            <Route path="messages" element={<LayoutWrapper><Messages /></LayoutWrapper>} />
                            <Route path="history" element={<LayoutWrapper><History /></LayoutWrapper>} />
                        </Routes>
                    </ProtectedRoute>
                } />

                {/* 🎯 Legal Routes (View Only - Reports & Cases) */}
                <Route path="/legal/*" element={
                    <ProtectedRoute allowedRoles={['legal_advisor']}>
                        <Routes>
                            <Route path="/" element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<LayoutWrapper><LegalDashboard /></LayoutWrapper>} />
                            <Route path="cases" element={<LayoutWrapper><Cases /></LayoutWrapper>} />
                            <Route path="cases/:id" element={<LayoutWrapper><CaseDetails /></LayoutWrapper>} />
                            <Route path="reports" element={<LayoutWrapper><Reports /></LayoutWrapper>} />
                            <Route path="messages" element={<LayoutWrapper><Messages /></LayoutWrapper>} />
                            <Route path="history" element={<LayoutWrapper><History /></LayoutWrapper>} />
                        </Routes>
                    </ProtectedRoute>
                } />

                {/* Shared protected routes */}
                <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={['admin', 'investigator', 'legal_advisor']}>
                        <LayoutWrapper><Profile /></LayoutWrapper>
                    </ProtectedRoute>
                } />

                {/* Legacy redirects */}
                <Route path="/dashboard" element={<SmartRedirect />} />
                <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/legal-dashboard" element={<Navigate to="/legal/dashboard" replace />} />
                <Route path="/investigator-dashboard" element={<Navigate to="/investigator/dashboard" replace />} />

                {/* Fallback Route */}
                <Route path="*" element={<SmartRedirect />} />
            </Routes>
        </Suspense>
    );
};

export default RoutesConfig;
