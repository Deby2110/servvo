import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTtl });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: `${config.refreshTtlDays}d`,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}
