// Role-based authorization middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user session' });
    }
    
    const userRole = req.user.role;
    
    // Normalize role checking for production roles
    if (!allowedRoles.includes(userRole)) {
      console.warn(`[AUTH] Unauthorized role access attempt: User ${req.user._id} (role: ${userRole}) tried to access resource requiring [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        message: `Forbidden: Role '${userRole}' does not have permission to access this resource` 
      });
    }
    
    next();
  };
};

module.exports = {
  checkRole
};
