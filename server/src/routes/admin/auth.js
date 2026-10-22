import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { config } from '../../config.js';
import { ApiError, asyncHandler } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginLimiter, registerLoginFailure, resetLoginAttempts } from '../../middleware/rateLimit.js';
import { z } from 'zod';

const router = Router();

const accessCookie = 'servvo_access';
const refreshCookie = 'servvo_refresh';

const refreshTtlMs = config.refreshTtlDays * 24 * 60 * 60 * 1000;

async function getMustChangePassword() {
  const row = await prisma.setting.findUnique({ where: { key: 'adminMustChangePassword' } });
  return Boolean(row && row.value === 'true');
}

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    maxAge: maxAgeMs,
  };
}

async function issueTokens(user, res) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  const refreshToken = signRefreshToken({ sub: user.id });
  const expiresAt = new Date(Date.now() + refreshTtlMs);

  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

  res.cookie(accessCookie, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(refreshCookie, refreshToken, cookieOptions(refreshTtlMs));
  return { accessToken };
}

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      registerLoginFailure(res.locals.loginKey || email.toLowerCase());
      throw new ApiError(401, 'Email atau kata sandi salah.');
    }
    resetLoginAttempts(res.locals.loginKey || email.toLowerCase());
    await issueTokens(user, res);
    const mustChange = await getMustChangePassword();
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        mustChangePassword: mustChange,
      },
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[refreshCookie];
    if (!token) throw new ApiError(401, 'Tidak ada sesi aktif.');

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'Sesi tidak valid. Silakan masuk kembali.');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new ApiError(401, 'Sesi sudah berakhir. Silakan masuk kembali.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, 'Pengguna tidak ditemukan.');

    // rotasi refresh token
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await issueTokens(user, res);
    res.json({ success: true });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[refreshCookie];
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(accessCookie, { path: '/' });
    res.clearCookie(refreshCookie, { path: '/' });
    res.json({ success: true, message: 'Berhasil keluar.' });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    });
    if (!user) throw new ApiError(404, 'Pengguna tidak ditemukan.');
    const mustChange = await getMustChangePassword();
    res.json({ success: true, data: { user, mustChangePassword: mustChange } });
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.'),
  newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter.'),
});

router.put(
  '/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, 'Kata sandi saat ini salah.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // cabut semua refresh token -> paksa login ulang
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // kata sandi sudah diganti -> hilangkan peringatan
    await prisma.setting.deleteMany({ where: { key: 'adminMustChangePassword' } });
    res.clearCookie(accessCookie, { path: '/' });
    res.clearCookie(refreshCookie, { path: '/' });
    res.json({ success: true, message: 'Kata sandi berhasil diubah. Silakan masuk kembali.' });
  })
);

export default router;
