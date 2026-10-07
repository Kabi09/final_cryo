import { ROLE_PERMISSIONS } from '../config/constants.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `Access denied. Role ${req.user.role} does not have required clearance: [${allowedRoles.join(', ')}]` 
    });
  };
};

export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const userRolePermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const userCustomPermissions = req.user.permissions || [];
    const allPermissions = new Set([...userRolePermissions, ...userCustomPermissions]);

    const hasAll = requiredPermissions.every(p => allPermissions.has(p));
    if (!hasAll) {
      return res.status(403).json({ 
        message: `Forbidden: Missing required permission(s): [${requiredPermissions.join(', ')}]` 
      });
    }

    next();
  };
};
