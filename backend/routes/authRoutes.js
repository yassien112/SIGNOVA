import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';
import env from '../config/env.js';

function signAccessToken(userId, secret, expiresIn) {
  return jwt.sign({ userId }, secret, { expiresIn: expiresIn || env.auth.accessTokenTtl });
}

function userDto(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, preferredLang: user.preferredLang };
}

async function issueRefreshToken(prisma, userId, meta = {}) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + env.auth.refreshTokenTtlMs);
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt, userAgent: meta.userAgent || null, ip: meta.ip || null },
  });
  return token;
}

export function createAuthRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  /* ── Register ── */
  router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'User with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role === 'Admin' ? 'Admin' : 'User' },
    });

    const accessToken = signAccessToken(user.id, jwtSecret);
    const refreshToken = await issueRefreshToken(prisma, user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return res.status(201).json({ user: userDto(user), accessToken, refreshToken });
  }));

  /* ── Login ── */
  router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });

    const accessToken = signAccessToken(user.id, jwtSecret);
    const refreshToken = await issueRefreshToken(prisma, user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return res.json({ user: userDto(user), accessToken, refreshToken });
  }));

  /* ── Refresh ── */
  router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const newAccessToken = signAccessToken(user.id, jwtSecret);
    const newRefreshToken = await issueRefreshToken(prisma, user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: userDto(user) });
  }));

  /* ── Logout (revoke current token) ── */
  router.post('/logout', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }
    return res.json({ message: 'Logged out successfully' });
  }));

  /* ── Logout All Devices ── */
  router.post('/logout-all', auth, asyncHandler(async (req, res) => {
    await prisma.refreshToken.updateMany({
      where: { userId: req.auth.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await prisma.user.update({ where: { id: req.auth.userId }, data: { isOnline: false } });
    return res.json({ message: 'Logged out from all devices' });
  }));

  /* ── Me ── */
  router.get('/me', auth, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: userDto(user) });
  }));

  /* ── Active Sessions ── */
  router.get('/sessions', auth, asyncHandler(async (req, res) => {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.auth.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
    });
    return res.json({ sessions });
  }));

  /* ── Revoke Specific Session ── */
  router.delete('/sessions/:id', auth, asyncHandler(async (req, res) => {
    await prisma.refreshToken.updateMany({
      where: { id: req.params.id, userId: req.auth.userId },
      data: { revokedAt: new Date() },
    });
    return res.json({ message: 'Session revoked' });
  }));

  return router;
}
