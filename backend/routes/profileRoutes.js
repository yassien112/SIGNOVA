import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';
import { uploadToStorage } from '../services/storageService.js';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

export function createProfileRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  /* ── GET /api/profile/me ── */
  router.get('/me', auth, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, bio: true, preferredLang: true,
        isOnline: true, createdAt: true, updatedAt: true,
        _count: { select: { messages: true, chats: true, notifications: true } },
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  }));

  /* ── GET /api/profile/:userId ── public profile */
  router.get('/:userId', asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, name: true, avatar: true, bio: true,
        preferredLang: true, isOnline: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  }));

  /* ── PATCH /api/profile/me ── update profile */
  router.patch('/me', auth, asyncHandler(async (req, res) => {
    const { name, bio, preferredLang } = req.body ?? {};
    const data = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof bio === 'string') data.bio = bio.trim() || null;
    if (typeof preferredLang === 'string' && preferredLang.trim()) {
      data.preferredLang = preferredLang.trim().toLowerCase();
    }

    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, bio: true, preferredLang: true,
        isOnline: true, createdAt: true, updatedAt: true,
      },
    });
    res.json({ user });
  }));

  /* ── POST /api/profile/me/avatar ── upload avatar */
  router.post('/me/avatar', auth, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image file. Send as multipart field "avatar".' });

    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const key = `avatars/${req.auth.userId}.${ext}`;

    const url = await uploadToStorage({
      buffer:      req.file.buffer,
      key,
      contentType: req.file.mimetype,
    });

    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data:  { avatar: url },
      select: { id: true, name: true, avatar: true },
    });

    res.json({ user, avatarUrl: url });
  }));

  /* ── DELETE /api/profile/me/avatar ── remove avatar */
  router.delete('/me/avatar', auth, asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data:  { avatar: null },
      select: { id: true, name: true, avatar: true },
    });
    res.json({ user });
  }));

  return router;
}
