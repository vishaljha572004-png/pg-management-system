import jwt from 'jsonwebtoken';

export const generateTokens = (userId, role, pgId) => {
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_fallback_key';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'super_refresh_fallback_key';

  // Access Token (short lived)
  const accessToken = jwt.sign(
    { id: userId, role, pg_id: pgId },
    jwtSecret,
    { expiresIn: '15m' }
  );

  // Refresh Token (long lived)
  const refreshToken = jwt.sign(
    { id: userId, pg_id: pgId },
    jwtRefreshSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
