import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createNotificationRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  router.use(auth);

  /* ── List notifications (paginated) ── */
  router.get('/', asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const unreadOnly = String(req.query.unread || 'false') === 'true';
    const skip = (page - 1) * limit;

    const where = {
      userId: req.auth.userId,
      ...(unreadOnly ? { readStatus: false } : {}),
    };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: req.auth.userId, readStatus: false },
    });

    res.json({
      notifications,
      unreadCount,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  }));

  /* ── Unread count only ── */
  router.get('/unread-count', asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({
      where: { userId: req.auth.userId, readStatus: false },
    });
    res.json({ unreadCount: count });
  }));

  /* ── Mark one as read ── */
  router.patch('/:id/read', asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.auth.userId },
      data: { readStatus: true },
    });
    res.json({ message: 'Marked as read' });
  }));

  /* ── Mark all as read ── */
  router.patch('/read-all', asyncHandler(async (req, res) => {
    const { count } = await prisma.notification.updateMany({
      where: { userId: req.auth.userId, readStatus: false },
      data: { readStatus: true },
    });
    res.json({ message: 'All marked as read', count });
  }));

  /* ── Delete one ── */
  router.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.auth.userId },
    });
    res.status(204).send();
  }));

  /* ── Delete all read ── */
  router.delete('/', asyncHandler(async (req, res) => {
    const { count } = await prisma.notification.deleteMany({
      where: { userId: req.auth.userId, readStatus: true },
    });
    res.json({ message: 'Cleared read notifications', count });
  }));

  return router;
}
