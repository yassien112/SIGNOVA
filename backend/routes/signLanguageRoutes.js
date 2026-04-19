import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

function normalizeWord(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ');
}

function toSignDto(sign) {
  return {
    id: sign.id,
    word: sign.word,
    label: sign.label,
    imageUrl: sign.imageUrl,
    thumbUrl: sign.thumbUrl,
    category: sign.category,
    lang: sign.lang,
    tags: sign.tags,
    aliases: sign.aliases,
    source: sign.source,
    sampleCount: sign.sampleCount,
    isSticker: sign.isSticker,
    isActive: sign.isActive,
    sortOrder: sign.sortOrder,
    metadata: sign.metadata,
    pack: sign.pack ? {
      id: sign.pack.id,
      name: sign.pack.name,
      nameAr: sign.pack.nameAr,
      slug: sign.pack.slug,
      lang: sign.pack.lang,
      category: sign.pack.category,
    } : null,
    createdAt: sign.createdAt,
    updatedAt: sign.updatedAt,
  };
}

function toPackDto(pack) {
  return {
    id: pack.id,
    name: pack.name,
    nameAr: pack.nameAr,
    slug: pack.slug,
    coverUrl: pack.coverUrl,
    category: pack.category,
    lang: pack.lang,
    description: pack.description,
    isActive: pack.isActive,
    sortOrder: pack.sortOrder,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    signCount: pack._count?.signs ?? pack.signs?.length ?? 0,
  };
}

export function createSignLanguageRouter({ prisma, jwtSecret, signLanguageService }) {
  const router = express.Router();
  const auth = jwtSecret ? createAuthMiddleware(jwtSecret) : null;

  router.get('/config', (req, res) => {
    res.json(signLanguageService.getConfig());
  });

  router.post('/session', (req, res) => {
    const snapshot = signLanguageService.createSession(req.body ?? {});
    res.status(201).json(snapshot);
  });

  router.post('/session/:sessionId/predictions', asyncHandler(async (req, res) => {
    const predictions = req.body?.predictions ?? req.body?.prediction ?? req.body;
    const snapshot = signLanguageService.processPredictions(req.params.sessionId, predictions);
    res.json(snapshot);
  }));

  router.post('/session/:sessionId/reset', (req, res) => {
    const snapshot = signLanguageService.resetSession(req.params.sessionId);
    res.json(snapshot);
  });

  router.delete('/session/:sessionId', (req, res) => {
    signLanguageService.closeSession(req.params.sessionId);
    res.status(204).send();
  });

  router.get('/packs', asyncHandler(async (req, res) => {
    const lang = req.query.lang ? String(req.query.lang) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const packs = await prisma.signPack.findMany({
      where: {
        ...(lang ? { lang } : {}),
        ...(category ? { category } : {}),
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { signs: true } } },
    });
    res.json({ packs: packs.map(toPackDto) });
  }));

  router.get('/packs/:packId', asyncHandler(async (req, res) => {
    const pack = await prisma.signPack.findUnique({
      where: { id: req.params.packId },
      include: {
        signs: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { pack: true },
        },
        _count: { select: { signs: true } },
      },
    });
    if (!pack) return res.status(404).json({ message: 'Sign pack not found' });
    res.json({ pack: toPackDto(pack), signs: pack.signs.map(toSignDto) });
  }));

  router.get('/search', asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    const lang = req.query.lang ? String(req.query.lang) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const onlyStickers = String(req.query.onlyStickers ?? 'false') === 'true';

    if (!q) return res.json({ signs: [] });
    const normalized = normalizeWord(q);

    const signs = await prisma.sign.findMany({
      where: {
        isActive: true,
        ...(lang ? { lang } : {}),
        ...(category ? { category } : {}),
        ...(onlyStickers ? { isSticker: true } : {}),
        OR: [
          { normalizedWord: { contains: normalized } },
          { word: { contains: q, mode: 'insensitive' } },
          { label: { contains: q, mode: 'insensitive' } },
          { tags: { has: normalized } },
          { aliases: { has: normalized } },
        ],
      },
      take: 30,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { pack: true },
    });

    res.json({ signs: signs.map(toSignDto) });
  }));

  router.get('/', asyncHandler(async (req, res) => {
    const lang = req.query.lang ? String(req.query.lang) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const packId = req.query.packId ? String(req.query.packId) : undefined;
    const onlyStickers = String(req.query.onlyStickers ?? 'false') === 'true';

    const signs = await prisma.sign.findMany({
      where: {
        isActive: true,
        ...(lang ? { lang } : {}),
        ...(category ? { category } : {}),
        ...(packId ? { packId } : {}),
        ...(onlyStickers ? { isSticker: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { pack: true },
    });

    res.json({ signs: signs.map(toSignDto) });
  }));

  router.get('/dataset/stats', asyncHandler(async (req, res) => {
    const [totalSigns, totalPacks, stickerCount, activeCount, grouped] = await Promise.all([
      prisma.sign.count(),
      prisma.signPack.count(),
      prisma.sign.count({ where: { isSticker: true } }),
      prisma.sign.count({ where: { isActive: true } }),
      prisma.sign.groupBy({
        by: ['lang', 'category'],
        _count: { id: true },
        _sum: { sampleCount: true },
      }),
    ]);

    res.json({
      totals: { totalSigns, totalPacks, stickerCount, activeCount },
      breakdown: grouped.map((item) => ({
        lang: item.lang,
        category: item.category,
        signCount: item._count.id,
        totalSamples: item._sum.sampleCount ?? 0,
      })),
    });
  }));

  if (auth) {
    router.post('/', auth, asyncHandler(async (req, res) => {
      const userRole = req.auth?.role || 'User';
      if (userRole !== 'Admin') return res.status(403).json({ message: 'Admin only' });

      const word = String(req.body?.word ?? '').trim();
      const label = String(req.body?.label ?? '').trim();
      const imageUrl = String(req.body?.imageUrl ?? '').trim();
      const lang = String(req.body?.lang ?? 'ar').trim();
      const normalizedWord = normalizeWord(word);

      if (!word || !label || !imageUrl) {
        return res.status(400).json({ message: 'word, label and imageUrl are required' });
      }

      const sign = await prisma.sign.create({
        data: {
          word,
          normalizedWord,
          label,
          imageUrl,
          thumbUrl: req.body?.thumbUrl || null,
          category: String(req.body?.category ?? 'general'),
          lang,
          tags: Array.isArray(req.body?.tags) ? req.body.tags.map((x) => normalizeWord(x)) : [],
          aliases: Array.isArray(req.body?.aliases) ? req.body.aliases.map((x) => normalizeWord(x)) : [],
          source: String(req.body?.source ?? 'manual'),
          sampleCount: Number(req.body?.sampleCount ?? 0),
          isSticker: Boolean(req.body?.isSticker),
          isActive: req.body?.isActive !== false,
          sortOrder: Number(req.body?.sortOrder ?? 0),
          metadata: req.body?.metadata ?? null,
          packId: req.body?.packId || null,
        },
        include: { pack: true },
      });

      res.status(201).json({ sign: toSignDto(sign) });
    }));
  }

  return router;
}
