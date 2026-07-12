import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized, missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Internal server configuration error' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && typeof decoded.role === 'string') {
      decoded.role = decoded.role.trim();
    }
    req.user = decoded; // { id, role, exp, iat, pg_id }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    return res.status(401).json({ message: 'Unauthorized, invalid token' });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('authorizeRoles debug:', { user: req.user, role: req.user?.role, allowed: allowedRoles });
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      console.log('authorizeRoles FAIL!');
      return res.status(403).json({ message: 'Forbidden, insufficient permissions' });
    }
    next();
  };
};
