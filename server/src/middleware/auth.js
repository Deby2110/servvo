import { verifyAccessToken } from '../lib/jwt.js';
import { ApiError } from '../lib/errors.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies) return req.cookies.servvo_access || req.cookies.accessToken || null;
  return null;
}

export function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(new ApiError(401, 'Anda harus masuk untuk mengakses halaman ini.'));
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    return next();
  } catch {
    return next(new ApiError(401, 'Sesi berakhir atau token tidak valid. Silakan masuk kembali.'));
  }
}

export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    } catch {
      /* abaikan */
    }
  }
  return next();
}
