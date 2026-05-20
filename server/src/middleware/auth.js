import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/tokens.js';

function extractToken(req) {
  if (req.cookies?.[AUTH_COOKIE_NAME]) return req.cookies[AUTH_COOKIE_NAME];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function authMiddleware(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Missing auth token');

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account inactive');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function roleMiddleware(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
