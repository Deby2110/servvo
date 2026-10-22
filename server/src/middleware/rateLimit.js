import rateLimit from 'express-rate-limit';

// Rate limit umum API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
});

// Rate limit login + penguncian sementara setelah 5 kali gagal
const attempts = new Map();

export function resetLoginAttempts(key) {
  attempts.delete(key);
}

export const loginLimiter = (req, res, next) => {
  const key = req.body?.email ? String(req.body.email).toLowerCase() : req.ip;
  const now = Date.now();
  const rec = attempts.get(key);
  if (rec && rec.lockedUntil && now < rec.lockedUntil) {
    const waitSec = Math.ceil((rec.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `Terlalu banyak percobaan login. Akun dikunci sementara ${waitSec} detik.`,
    });
  }
  res.locals.loginKey = key;
  return next();
};

export function registerLoginFailure(key) {
  if (!key) return;
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockedUntil = now + 15 * 60 * 1000;
    rec.count = 0;
  }
  attempts.set(key, rec);
}
