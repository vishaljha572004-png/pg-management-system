import jwt from 'jsonwebtoken';

export const generateTokens = (userId, role, pgId) => {
  const jwtSecret = process.env.JWT_SECRET || 'temp_dev_secret_only';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'temp_dev_refresh_only';

  const normalizedRole = role?.toString().trim();

  
  const accessToken = jwt.sign(
    { id: userId, role: normalizedRole, pg_id: pgId },
    jwtSecret,
    { expiresIn: '15m' }
  );

  
  const refreshToken = jwt.sign(
    { id: userId, pg_id: pgId },
    jwtRefreshSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
