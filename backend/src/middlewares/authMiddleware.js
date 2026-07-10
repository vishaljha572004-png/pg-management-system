import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized, missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, exp, iat, pg_id }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    return res.status(403).json({ message: 'Forbidden, invalid token' });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user || !req.user.role || !normalizedRoles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: 'Forbidden, insufficient permissions' });
    }
    next();
  };
};
