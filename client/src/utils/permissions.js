/**
 * Role-Based Access Control (RBAC) Utility
 * Centralized permission management for the forensic writer system
 */

// Role hierarchy (higher number = higher privilege)
const ROLE_HIERARCHY = {
    'admin': 100,
    'system_admin': 100,
    'investigator': 50,
    'forensic_investigator': 50,
    'legal_advisor': 30,
    'legal_adviser': 30,
    'reporter': 20,
    'user': 10
};

// Permission definitions
const PERMISSIONS = {
    // User Management
    'view_users': ['admin', 'system_admin'],
    'manage_users': ['admin', 'system_admin'],
    'delete_users': ['admin', 'system_admin'],
    
    // Admin Panel
    'access_admin_panel': ['admin', 'system_admin'],
    
    // Cases
    'view_cases': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'create_cases': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'reporter'],
    'edit_cases': ['admin', 'system_admin', 'investigator', 'forensic_investigator'],
    'delete_cases': ['admin', 'system_admin'],
    'approve_cases': ['admin', 'system_admin', 'legal_advisor', 'legal_adviser'],
    'reject_cases': ['admin', 'system_admin', 'legal_advisor', 'legal_adviser'],
    
    // Reports
    'view_reports': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'create_reports': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'edit_reports': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'delete_reports': ['admin', 'system_admin'],
    'download_reports': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    
    // Evidence
    'view_evidence': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'upload_evidence': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'reporter'],
    'delete_evidence': ['admin', 'system_admin', 'investigator', 'forensic_investigator'],
    
    // AI Analysis
    'view_ai_analysis': ['admin', 'system_admin', 'investigator', 'forensic_investigator'],
    'run_ai_analysis': ['admin', 'system_admin', 'investigator', 'forensic_investigator'],
    
    // Messages
    'view_messages': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'send_messages': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'delete_messages': ['admin', 'system_admin'],
    
    // Notifications
    'view_notifications': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    'manage_notifications': ['admin', 'system_admin'],
    
    // History
    'view_history': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    
    // Profile
    'view_profile': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user'],
    'edit_profile': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user'],
    
    // Dashboard
    'view_dashboard': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user']
};

// Route permissions
const ROUTE_PERMISSIONS = {
    '/admin-dashboard': ['admin', 'system_admin'],
    '/users': ['admin', 'system_admin'],
    '/cases': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/cases/:id': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/reports': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/evidence': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter'],
    '/ai-analysis': ['admin', 'system_admin', 'investigator', 'forensic_investigator'],
    '/forensic-report': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/messages': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/notifications': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/history': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser'],
    '/profile': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user'],
    '/dashboard': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user'],
    '/settings': ['admin', 'system_admin', 'investigator', 'forensic_investigator', 'legal_advisor', 'legal_adviser', 'reporter', 'user']
};

/**
 * Normalize role name for consistent comparison
 */
export const normalizeRole = (role) => {
    if (!role) return 'user';
    return role.toLowerCase().trim();
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;
    
    const normalizedRole = normalizeRole(user.role);
    const allowedRoles = PERMISSIONS[permission] || [];
    
    console.log(`PERMISSION CHECK: ${permission} for role ${normalizedRole}`);
    console.log(`ALLOWED ROLES:`, allowedRoles);
    
    return allowedRoles.includes(normalizedRole);
};

/**
 * Check if user can access specific route
 */
export const canAccessRoute = (user, route) => {
    if (!user || !user.role) {
        console.log("CAN ACCESS ROUTE: No user or role - returning false");
        return false;
    }
    
    const normalizedRole = normalizeRole(user.role);
    const allowedRoles = ROUTE_PERMISSIONS[route] || [];
    
    console.log("=== ROUTE PERMISSION DEBUG ===");
    console.log("Route:", route);
    console.log("Original Role:", user.role);
    console.log("Normalized Role:", normalizedRole);
    console.log("Allowed Roles for this route:", allowedRoles);
    console.log("Route exists in permissions:", route in ROUTE_PERMISSIONS);
    console.log("Role in allowed roles:", allowedRoles.includes(normalizedRole));
    
    const hasAccess = allowedRoles.includes(normalizedRole);
    console.log("FINAL RESULT:", hasAccess);
    console.log("=============================");
    
    return hasAccess;
};

/**
 * Get user's role level
 */
export const getRoleLevel = (role) => {
    const normalizedRole = normalizeRole(role);
    return ROLE_HIERARCHY[normalizedRole] || 0;
};

/**
 * Check if user has higher or equal role level
 */
export const hasRoleLevel = (user, minimumLevel) => {
    if (!user || !user.role) return false;
    return getRoleLevel(user.role) >= minimumLevel;
};

/**
 * Get display name for role
 */
export const getRoleDisplayName = (role) => {
    const normalizedRole = normalizeRole(role);
    const displayNames = {
        'admin': 'Administrator',
        'system_admin': 'System Administrator',
        'investigator': 'Investigator',
        'forensic_investigator': 'Forensic Investigator',
        'legal_adviser': 'Legal Advisor',
        'reporter': 'Reporter',
        'user': 'User'
    };
    
    return displayNames[normalizedRole] || 'User';
};

/**
 * Check if user can perform action on specific resource
 */
export const canPerformAction = (user, action, resourceType) => {
    const permission = `${action}_${resourceType}`;
    return hasPermission(user, permission);
};

/**
 * Filter routes based on user permissions
 */
export const filterRoutesByPermission = (user, routes) => {
    if (!user || !user.role) return [];
    
    return routes.filter(route => {
        return canAccessRoute(user, route.path);
    });
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
    const normalizedRole = normalizeRole(role);
    const permissions = [];
    
    Object.entries(PERMISSIONS).forEach(([permission, allowedRoles]) => {
        if (allowedRoles.includes(normalizedRole)) {
            permissions.push(permission);
        }
    });
    
    return permissions;
};

/**
 * Check if user is admin (any admin variant)
 */
export const isAdmin = (user) => {
    if (!user || !user.role) return false;
    const normalizedRole = normalizeRole(user.role);
    return normalizedRole === 'admin' || normalizedRole === 'system_admin';
};

/**
 * Check if user is investigator (any investigator variant)
 */
export const isInvestigator = (user) => {
    if (!user || !user.role) return false;
    const normalizedRole = normalizeRole(user.role);
    return normalizedRole === 'investigator' || normalizedRole === 'forensic_investigator';
};

/**
 * Check if user is legal adviser
 */
export const isLegalAdviser = (user) => {
    if (!user || !user.role) return false;
    const normalizedRole = normalizeRole(user.role);
    return normalizedRole === 'legal_advisor' || normalizedRole === 'legal_adviser';
};

export default {
    hasPermission,
    canAccessRoute,
    getRoleLevel,
    hasRoleLevel,
    getRoleDisplayName,
    canPerformAction,
    filterRoutesByPermission,
    getRolePermissions,
    isAdmin,
    isInvestigator,
    isLegalAdviser,
    normalizeRole
};
