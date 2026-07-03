/**
 * Frontend Role-Based Access Control (RBAC) Utilities
 * Provides role checking functions for UI components
 */

// Import role definitions from backend
export const ROLES = {
    ADMIN: 'system_admin',
    ADMIN_SHORT: 'admin',
    FORENSIC_INVESTIGATOR: 'forensic_investigator', 
    INVESTIGATOR_SHORT: 'investigator',
    LEGAL_ADVISOR: 'legal_advisor',
    REPORTER: 'reporter'
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user, permission) => {
    if (!user || !user.role) {
        return false;
    }
    
    // Role-based permission matrix (simplified for frontend)
    const rolePermissions = {
        [ROLES.ADMIN]: [
            'view_all_cases', 'edit_case', 'delete_case',
            'upload_evidence', 'view_evidence', 'delete_evidence',
            'access_ai', 'run_ai_analysis', 'generate_reports', 'view_reports',
            'download_reports', 'delete_reports', 'view_system_logs', 'access_admin_panel'
        ],
        [ROLES.FORENSIC_INVESTIGATOR]: [
            'view_all_cases', 'edit_case', 'upload_evidence', 'view_evidence',
            'access_ai', 'run_ai_analysis', 'generate_reports', 'view_reports', 'download_reports'
        ],
        [ROLES.LEGAL_ADVISOR]: [
            'view_all_cases', 'create_case', 'edit_case', 'upload_evidence', 'view_evidence',
            'generate_reports', 'view_reports', 'download_reports'
        ],
        [ROLES.REPORTER]: [
            'view_own_cases', 'upload_evidence', 'view_evidence'
        ]
    };
    
    // Support shorthand roles by mapping them
    const effectiveRole = user.role === ROLES.ADMIN_SHORT ? ROLES.ADMIN : 
                          (user.role === ROLES.INVESTIGATOR_SHORT ? ROLES.FORENSIC_INVESTIGATOR : user.role);

    const userPermissions = rolePermissions[effectiveRole] || [];
    return userPermissions.includes(permission);
};

/**
 * Check if user can access AI Investigation
 */
export const canAccessAI = (user) => {
    return hasPermission(user, 'access_ai');
};

/**
 * Check if user can access admin panel
 */
export const canAccessAdmin = (user) => {
    return hasPermission(user, 'access_admin_panel');
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (user) => {
    return hasPermission(user, 'create_user');
};

/**
 * Check if user can edit cases
 */
export const canEditCases = (user) => {
    return hasPermission(user, 'edit_case');
};

/**
 * Check if user can delete cases
 */
export const canDeleteCases = (user) => {
    return hasPermission(user, 'delete_case');
};

/**
 * Check if user can generate reports
 */
export const canGenerateReports = (user) => {
    return hasPermission(user, 'generate_reports');
};

/**
 * Check if user can download reports
 */
export const canDownloadReports = (user) => {
    return hasPermission(user, 'download_reports');
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
    const roleNames = {
        [ROLES.ADMIN]: 'System Administrator',
        [ROLES.ADMIN_SHORT]: 'System Administrator',
        [ROLES.FORENSIC_INVESTIGATOR]: 'Forensic Investigator',
        [ROLES.INVESTIGATOR_SHORT]: 'Forensic Investigator',
        [ROLES.LEGAL_ADVISOR]: 'Legal Advisor',
        [ROLES.REPORTER]: 'Reporter'
    };
    return roleNames[role] || 'Unknown Role';
};

/**
 * Get role hierarchy level for UI comparisons
 */
export const getRoleLevel = (role) => {
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
export const canAccessResource = (currentUser, resourceOwner, resourceType = 'case') => {
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
        return hasPermission(currentUser, 'view_all_cases');
    }
    
    // Forensic investigators can access all cases
    if (currentUser.role === ROLES.FORENSIC_INVESTIGATOR && resourceType === 'case') {
        return hasPermission(currentUser, 'view_all_cases');
    }
    
    // Reporters can only access their own cases
    if (currentUser.role === ROLES.REPORTER) {
        return false;
    }
    
    return false;
};
