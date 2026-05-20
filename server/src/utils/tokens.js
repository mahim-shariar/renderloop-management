import jwt from 'jsonwebtoken';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function signAuthToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export const AUTH_COOKIE_NAME = 'rl_session';

export function authCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: ONE_WEEK_MS,
    path: '/',
  };
}
