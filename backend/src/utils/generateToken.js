import jwt from 'jsonwebtoken';

export const generateTokens = (userId, role, pgId) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT Secrets are missing in environment variables');
  }

  // Access Token (short lived)
  const accessToken = jwt.sign(
    { id: userId, role, pg_id: pgId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token (long lived)
  const refreshToken = jwt.sign(
    { id: userId, pg_id: pgId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
