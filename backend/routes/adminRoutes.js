import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';
import { parseCsv, csvRowToSignPayload, importSignsBatch, buildPackMap } from '../services/signImportService.js';

const IMPORT_STATUS = new Map();

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'Admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

export function createAdminRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  router.use(auth, requireAdmin);

  /* ── Stats ── */
  router.get('/stats', asyncHandler(async (req, res) => {
    const [users, chats, messages, signs, signPacks, notifications] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.sign.count(),
      prisma.signPack.count(),
      prisma.notification.count(),
    ]);

    const [onlineUsers, activeSignsCount, stickerCount] = await Promise.all([
      prisma.user.count({ where: { isOnline: true } }),
      prisma.sign.count({ where: { isActive: true } }),
      prisma.sign.count({ where: { isSticker: true } }),
    ]);

    const signsByLang = await prisma.sign.groupBy({
      by: ['lang', 'category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    res.json({
      totals: { users, chats, messages, signs, signPacks, notifications, onlineUsers, activeSignsCount, stickerCount },
      signsByLang: signsByLang.map((r) => ({ lang: r.lang, category: r.category, count: r._count.id })),
    });
  }));

  /* ── Users list ── */
  router.get('/users', asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim();

    const where = {
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}),
      ...(role ? { role } : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, isOnline: true, avatar: true, createdAt: true },
      }),
    ]);

    res.json({ users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  }));

  /* ── Update user (role/ban) ── */
  router.patch('/users/:id', asyncHandler(async (req, res) => {
    const { role } = req.body ?? {};
    const allowedRoles = ['User', 'Admin'];
    if (role && !allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(role ? { role } : {}) },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  }));

  /* ── Pack CRUD ── */
  router.post('/packs', asyncHandler(async (req, res) => {
    const { name, nameAr, slug, lang, category, description, coverUrl, sortOrder } = req.body ?? {};
    if (!name || !slug || !lang || !category) {
      return res.status(400).json({ message: 'name, slug, lang, category are required' });
    }
    const pack = await prisma.signPack.create({
      data: { name, nameAr: nameAr || null, slug, lang, category, description: description || null, coverUrl: coverUrl || null, sortOrder: Number(sortOrder) || 0, isActive: true },
    });
    res.status(201).json({ pack });
  }));

  router.patch('/packs/:id', asyncHandler(async (req, res) => {
    const allowed = ['name', 'nameAr', 'lang', 'category', 'description', 'coverUrl', 'sortOrder', 'isActive'];
    const data = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const pack = await prisma.signPack.update({ where: { id: req.params.id }, data });
    res.json({ pack });
  }));

  router.delete('/packs/:id', asyncHandler(async (req, res) => {
    await prisma.signPack.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }));

  /* ── Sign CRUD (admin full control) ── */
  router.patch('/signs/:id', asyncHandler(async (req, res) => {
    const allowed = ['word', 'label', 'imageUrl', 'thumbUrl', 'category', 'lang', 'tags', 'aliases', 'source', 'sampleCount', 'isSticker', 'isActive', 'sortOrder', 'metadata', 'packId'];
    const data = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    if (data.word) data.normalizedWord = data.word.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');
    const sign = await prisma.sign.update({ where: { id: req.params.id }, data });
    res.json({ sign });
  }));

  router.delete('/signs/:id', asyncHandler(async (req, res) => {
    await prisma.sign.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  }));

  /* ── CSV Import ── */
  router.post('/signs/import/csv', asyncHandler(async (req, res) => {
    const { csv, packSlug, lang, category, isSticker } = req.body ?? {};
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ message: 'csv string body is required' });
    }

    const jobId = `import-${Date.now()}`;
    IMPORT_STATUS.set(jobId, { status: 'running', processed: 0, total: 0, created: 0, updated: 0, skipped: 0, errors: [] });

    // Run in background
    setImmediate(async () => {
      try {
        const rows = parseCsv(csv);
        const payloads = rows.map((row) => {
          const p = csvRowToSignPayload(row);
          if (packSlug) p.packSlug = packSlug;
          if (lang) p.lang = lang;
          if (category) p.category = category;
          if (isSticker !== undefined) p.isSticker = Boolean(isSticker);
          return p;
        });

        IMPORT_STATUS.get(jobId).total = payloads.length;
        const packMap = await buildPackMap(prisma);
        const result = await importSignsBatch(prisma, payloads, packMap, (progress) => {
          Object.assign(IMPORT_STATUS.get(jobId), progress);
        });
        Object.assign(IMPORT_STATUS.get(jobId), { status: 'done', ...result });
      } catch (err) {
        Object.assign(IMPORT_STATUS.get(jobId), { status: 'error', error: err.message });
      }
    });

    res.status(202).json({ jobId, message: 'Import started in background' });
  }));

  /* ── Bulk JSON Import (signs array) ── */
  router.post('/signs/import/json', asyncHandler(async (req, res) => {
    const { signs, packSlug, lang, category, isSticker } = req.body ?? {};
    if (!Array.isArray(signs) || signs.length === 0) {
      return res.status(400).json({ message: 'signs array is required' });
    }

    const jobId = `import-${Date.now()}`;
    IMPORT_STATUS.set(jobId, { status: 'running', processed: 0, total: signs.length, created: 0, updated: 0, skipped: 0, errors: [] });

    setImmediate(async () => {
      try {
        const payloads = signs.map((row) => {
          const p = csvRowToSignPayload(row);
          if (packSlug) p.packSlug = packSlug;
          if (lang) p.lang = lang;
          if (category) p.category = category;
          if (isSticker !== undefined) p.isSticker = Boolean(isSticker);
          return p;
        });
        const packMap = await buildPackMap(prisma);
        const result = await importSignsBatch(prisma, payloads, packMap, (progress) => {
          Object.assign(IMPORT_STATUS.get(jobId), progress);
        });
        Object.assign(IMPORT_STATUS.get(jobId), { status: 'done', ...result });
      } catch (err) {
        Object.assign(IMPORT_STATUS.get(jobId), { status: 'error', error: err.message });
      }
    });

    res.status(202).json({ jobId, message: 'Import started in background' });
  }));

  /* ── Import status polling ── */
  router.get('/signs/import/status/:jobId', (req, res) => {
    const status = IMPORT_STATUS.get(req.params.jobId);
    if (!status) return res.status(404).json({ message: 'Job not found' });
    res.json(status);
  });

  return router;
}
