/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions and access control for Forensic Writer
 */

// Role definitions — must match MongoDB User model enum exactly
const ROLES = {
    ADMIN: 'admin',
    ADMIN_SHORT: 'admin',         // unified: both map to 'admin'
    FORENSIC_INVESTIGATOR: 'investigator', 
    INVESTIGATOR_SHORT: 'investigator',   // unified: both map to 'investigator'
    LEGAL_ADVISOR: 'legal_advisor',
    REPORTER: 'reporter'
};

// Permission matrix
const PERMISSIONS = {
    // User Management
    CREATE_USER: 'create_user',
    DELETE_USER: 'delete_user',
    ASSIGN_ROLES: 'assign_roles',
    
    // Case Management
    CREATE_CASE: 'create_case',
    VIEW_ALL_CASES: 'view_all_cases',
    VIEW_OWN_CASES: 'view_own_cases',
    EDIT_CASE: 'edit_case',
    DELETE_CASE: 'delete_case',
    
    // Evidence Management
    UPLOAD_EVIDENCE: 'upload_evidence',
    VIEW_EVIDENCE: 'view_evidence',
    DELETE_EVIDENCE: 'delete_evidence',
    
    // AI Investigation
    ACCESS_AI: 'access_ai',
    RUN_AI_ANALYSIS: 'run_ai_analysis',
    
    // Report Management
    GENERATE_REPORTS: 'generate_reports',
    VIEW_REPORTS: 'view_reports',
    DOWNLOAD_REPORTS: 'download_reports',
    DELETE_REPORTS: 'delete_reports',
    
    // System Access
    VIEW_SYSTEM_LOGS: 'view_system_logs',
    ACCESS_ADMIN_PANEL: 'access_admin_panel',
    ADD_LEGAL_COMMENTS: 'add_legal_comments'
};

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        // User Management
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.ASSIGN_ROLES,
        
        // Case Management
        PERMISSIONS.CREATE_CASE,
        PERMISSIONS.VIEW_ALL_CASES,
        PERMISSIONS.EDIT_CASE,
        PERMISSIONS.DELETE_CASE,
        
        // Evidence Management
        PERMISSIONS.UPLOAD_EVIDENCE,
        PERMISSIONS.VIEW_EVIDENCE,
        PERMISSIONS.DELETE_EVIDENCE,
        
        // AI Investigation - System Admin cannot access AI forensic analysis
        
        // Report Management - Admin can view/download/delete reports but not generate them
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.DOWNLOAD_REPORTS,
        PERMISSIONS.DELETE_REPORTS,
        
        // System Access
        PERMISSIONS.VIEW_SYSTEM_LOGS,
        PERMISSIONS.ACCESS_ADMIN_PANEL,
        PERMISSIONS.ADD_LEGAL_COMMENTS
    ],
    
    [ROLES.ADMIN_SHORT]: [
        PERMISSIONS.CREATE_USER, PERMISSIONS.DELETE_USER, PERMISSIONS.ASSIGN_ROLES,
        PERMISSIONS.CREATE_CASE, PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.EDIT_CASE, PERMISSIONS.DELETE_CASE,
        PERMISSIONS.UPLOAD_EVIDENCE, PERMISSIONS.VIEW_EVIDENCE, PERMISSIONS.DELETE_EVIDENCE,
        PERMISSIONS.VIEW_REPORTS, PERMISSIONS.DOWNLOAD_REPORTS, PERMISSIONS.DELETE_REPORTS,
        PERMISSIONS.VIEW_SYSTEM_LOGS, PERMISSIONS.ACCESS_ADMIN_PANEL, PERMISSIONS.ADD_LEGAL_COMMENTS
    ],
    
    [ROLES.FORENSIC_INVESTIGATOR]: [
        // Case Management
        PERMISSIONS.CREATE_CASE,
        PERMISSIONS.VIEW_ALL_CASES,
        PERMISSIONS.EDIT_CASE,
        
        // Evidence Management
        PERMISSIONS.UPLOAD_EVIDENCE,
        PERMISSIONS.VIEW_EVIDENCE,
        
        // AI Investigation
        PERMISSIONS.ACCESS_AI,
        PERMISSIONS.RUN_AI_ANALYSIS,
        
        // Report Management
        PERMISSIONS.GENERATE_REPORTS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.DOWNLOAD_REPORTS
    ],

    [ROLES.INVESTIGATOR_SHORT]: [
        PERMISSIONS.CREATE_CASE, PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.EDIT_CASE,
        PERMISSIONS.UPLOAD_EVIDENCE, PERMISSIONS.VIEW_EVIDENCE,
        PERMISSIONS.ACCESS_AI, PERMISSIONS.RUN_AI_ANALYSIS,
        PERMISSIONS.GENERATE_REPORTS, PERMISSIONS.VIEW_REPORTS, PERMISSIONS.DOWNLOAD_REPORTS
    ],
    
    [ROLES.LEGAL_ADVISOR]: [
        PERMISSIONS.VIEW_ALL_CASES,
        PERMISSIONS.VIEW_EVIDENCE,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.DOWNLOAD_REPORTS,
        PERMISSIONS.ADD_LEGAL_COMMENTS
    ],
    
    [ROLES.REPORTER]: [
        // Case Management (Limited)
        PERMISSIONS.CREATE_CASE,
        PERMISSIONS.VIEW_OWN_CASES,
        
        // Evidence Management (Limited)
        PERMISSIONS.UPLOAD_EVIDENCE,
        PERMISSIONS.VIEW_EVIDENCE
    ]
};

/**
 * Check if user has specific permission
 */
const hasPermission = (user, permission) => {
    if (!user || !user.role) {
        return false;
    }
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
const hasAnyPermission = (user, permissions) => {
    if (!user || !user.role) {
        return false;
    }
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all specified permissions
 */
const hasAllPermissions = (user, permissions) => {
    if (!user || !user.role) {
        return false;
    }
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Get role hierarchy level for comparison
 */
const getRoleLevel = (role) => {
    const roleLevels = {
        [ROLES.REPORTER]: 1,
        [ROLES.LEGAL_ADVISOR]: 2,
        [ROLES.FORENSIC_INVESTIGATOR]: 3,
        [ROLES.ADMIN]: 4
    };
    return roleLevels[role] || 0;
};

/**
 * Check if user can access resource owned by another user
 */
const canAccessResource = (currentUser, resourceOwner, resourceType = 'case') => {
    // Admin can access everything
    if (currentUser.role === ROLES.ADMIN) {
        return true;
    }
    
    // Users can access their own resources
    if (currentUser._id === resourceOwner._id) {
        return true;
    }
    
    // Legal advisors can view all cases but not modify
    if (currentUser.role === ROLES.LEGAL_ADVISOR && resourceType === 'case') {
        return hasPermission(currentUser, PERMISSIONS.VIEW_ALL_CASES);
    }
    
    // Forensic investigators can access all cases
    if (currentUser.role === ROLES.FORENSIC_INVESTIGATOR && resourceType === 'case') {
        return hasPermission(currentUser, PERMISSIONS.VIEW_ALL_CASES);
    }
    
    // Reporters can only access their own cases
    if (currentUser.role === ROLES.REPORTER) {
        return false;
    }
    
    return false;
};

/**
 * Get allowed routes for role
 */
const getAllowedRoutes = (role) => {
    const routeMap = {
        [ROLES.ADMIN]: [
            '/dashboard', '/admin', '/users', '/cases', '/reports', '/evidence', 
            '/ai-analysis', '/forensic-report', '/messages', '/history', 
            '/report-vault', '/notifications'
        ],
        [ROLES.FORENSIC_INVESTIGATOR]: [
            '/dashboard', '/cases', '/reports', '/evidence', '/ai-analysis', 
            '/forensic-report', '/messages', '/history'
        ],
        [ROLES.LEGAL_ADVISOR]: [
            '/dashboard', '/cases', '/reports', '/evidence', '/forensic-report', '/messages', '/history'
        ],
        [ROLES.REPORTER]: [
            '/dashboard', '/new-case', '/evidence', '/cases'
        ]
    };
    
    return routeMap[role] || [];
};

/**
 * Middleware to check AI access specifically
 */
const requireAIAccess = (req, res, next) => {
    if (!hasPermission(req.user, PERMISSIONS.ACCESS_AI)) {
        return res.status(403).json({
            message: 'Access Denied: You do not have permission to use AI Investigation.',
            requiredRole: 'FORENSIC_INVESTIGATOR',
            currentRole: req.user?.role || 'None'
        });
    }
    next();
};

/**
 * Middleware to check admin access
 */
const requireAdmin = (req, res, next) => {
    const allowedRoles = [ROLES.ADMIN, ROLES.ADMIN_SHORT];
    if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({
            message: 'Access Denied: Admin access required.',
            currentRole: req.user?.role || 'None'
        });
    }
    next();
};

/**
 * Middleware to check legal advisor permissions
 */
const requireLegalAdvisor = (req, res, next) => {
    const allowedRoles = [ROLES.LEGAL_ADVISOR, ROLES.ADMIN, ROLES.ADMIN_SHORT];
    if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({
            message: 'Access Denied: Legal Advisor access required.',
            currentRole: req.user?.role || 'None'
        });
    }
    next();
};

/**
 * Middleware to check forensic investigator permissions
 */
const requireForensicInvestigator = (req, res, next) => {
    const allowedRoles = [ROLES.FORENSIC_INVESTIGATOR, ROLES.INVESTIGATOR_SHORT];
    if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({
            message: 'Access Denied: Forensic Investigator access required.',
            currentRole: req.user?.role || 'None'
        });
    }
    next();
};

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRoleLevel,
    canAccessResource,
    getAllowedRoutes,
    requireAIAccess,
    requireAdmin,
    requireLegalAdvisor,
    requireForensicInvestigator
};
