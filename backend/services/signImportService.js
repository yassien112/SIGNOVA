import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

const SUPPORTED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function normalizeWord(value = '') {
  return String(value).trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');
}

function sanitize(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function parseTagsOrAliases(value = '') {
  if (Array.isArray(value)) return value.map((x) => normalizeWord(x)).filter(Boolean);
  return String(value).split(/[,|;]/).map((x) => normalizeWord(x)).filter(Boolean);
}

/**
 * Parse a CSV string into an array of plain objects.
 * Supports quoted fields and comma delimiters.
 */
export function parseCsv(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let inQuote = false;
    let current = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(current); current = ''; }
      else { current += ch; }
    }
    cols.push(current);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim(); });
    rows.push(obj);
  }
  return rows;
}

/**
 * Transform a flat CSV row (from Kaggle or custom format) into a Sign upsert payload.
 * CSV expected columns (flexible — extra columns ignored):
 *   word / label / imageUrl / thumbUrl / lang / category / packId / packSlug
 *   tags / aliases / source / sampleCount / isSticker / isActive / sortOrder
 */
export function csvRowToSignPayload(row) {
  const word = sanitize(row.word || row.Word || row.name || row.Name || '');
  const label = sanitize(row.label || row.Label || row.class || row.Class || word);
  const imageUrl = sanitize(row.imageUrl || row.image_url || row.image || row.Image || '');
  const thumbUrl = sanitize(row.thumbUrl || row.thumb_url || row.thumb || row.Thumb || imageUrl);
  const lang = sanitize(row.lang || row.language || 'ar');
  const category = sanitize(row.category || row.Category || 'alphabet');
  const tags = parseTagsOrAliases(row.tags || row.Tags || '');
  const aliases = parseTagsOrAliases(row.aliases || row.Aliases || '');
  const source = sanitize(row.source || row.Source || 'csv-import');
  const sampleCount = Number(row.sampleCount || row.sample_count || 0) || 0;
  const isSticker = ['true', '1', 'yes'].includes(String(row.isSticker || row.is_sticker || 'false').toLowerCase());
  const isActive = !['false', '0', 'no'].includes(String(row.isActive || row.is_active || 'true').toLowerCase());
  const sortOrder = Number(row.sortOrder || row.sort_order || 0) || 0;
  const packSlug = sanitize(row.packSlug || row.pack_slug || '');
  const packId = sanitize(row.packId || row.pack_id || '');

  return { word, label, imageUrl, thumbUrl, lang, category, tags, aliases, source, sampleCount, isSticker, isActive, sortOrder, packSlug, packId };
}

/**
 * Scan a local folder and build sign payloads from its structure.
 * Expects either:
 *   - Flat folder: /pack-slug/word.jpg
 *   - Nested:      /lang/category/word.jpg
 */
export function scanFolderForSigns(rootDir, defaultLang = 'ar', defaultCategory = 'alphabet') {
  const entries = [];
  const walk = (dir, packSlug, lang, category) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(fullPath, item.name, lang, item.name);
      } else {
        const ext = path.extname(item.name).toLowerCase();
        if (SUPPORTED_IMAGE_EXTS.has(ext)) {
          const word = path.basename(item.name, ext);
          entries.push({
            word,
            label: word.toLowerCase(),
            localPath: fullPath,
            lang,
            category,
            packSlug: packSlug || defaultCategory,
            tags: [],
            aliases: [],
            source: 'folder-import',
            sampleCount: 0,
            isSticker: true,
            isActive: true,
            sortOrder: 0,
          });
        }
      }
    }
  };
  walk(rootDir, '', defaultLang, defaultCategory);
  return entries;
}

/**
 * Core import function — upserts signs into DB.
 * payloads: array of csvRowToSignPayload results
 * packMap: { slug -> packId } cache built before calling this
 * prisma: PrismaClient instance
 * Returns: { created, updated, skipped, errors }
 */
export async function importSignsBatch(prisma, payloads, packMap = {}, onProgress = null) {
  let created = 0, updated = 0, skipped = 0, errors = [];

  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i];
    try {
      const word = payload.word;
      if (!word) { skipped++; continue; }
      if (!payload.imageUrl) { skipped++; continue; }

      const normalizedWord = normalizeWord(word);
      const lang = payload.lang || 'ar';

      let packId = payload.packId || null;
      if (!packId && payload.packSlug) {
        packId = packMap[payload.packSlug] || null;
      }

      const existing = await prisma.sign.findFirst({
        where: { lang, normalizedWord },
        select: { id: true },
      });

      const data = {
        word,
        normalizedWord,
        label: payload.label || word.toLowerCase(),
        imageUrl: payload.imageUrl,
        thumbUrl: payload.thumbUrl || payload.imageUrl,
        category: payload.category || 'alphabet',
        lang,
        tags: payload.tags || [],
        aliases: payload.aliases || [],
        source: payload.source || 'import',
        sampleCount: Number(payload.sampleCount) || 0,
        isSticker: Boolean(payload.isSticker),
        isActive: payload.isActive !== false,
        sortOrder: Number(payload.sortOrder) || i + 1,
        metadata: payload.metadata || null,
        packId: packId || null,
      };

      if (existing) {
        await prisma.sign.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.sign.create({ data });
        created++;
      }

      if (onProgress && i % 50 === 0) {
        onProgress({ processed: i + 1, total: payloads.length, created, updated, skipped });
      }
    } catch (err) {
      errors.push({ index: i, word: payload.word, error: err.message });
    }
  }

  return { created, updated, skipped, errors, total: payloads.length };
}

/**
 * Build a packSlug->packId map from DB for fast lookup during import.
 */
export async function buildPackMap(prisma) {
  const packs = await prisma.signPack.findMany({ select: { id: true, slug: true } });
  return Object.fromEntries(packs.map((p) => [p.slug, p.id]));
}
