/**
 * CLI script: import signs from a local CSV file.
 *
 * Usage:
 *   node scripts/import-from-csv.mjs --file ./data/arsl.csv --packSlug arabic-alphabet --lang ar --category alphabet
 *
 * Required CSV columns:
 *   word, label, imageUrl
 * Optional:
 *   thumbUrl, tags, aliases, source, sampleCount, isSticker, sortOrder
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const filePath   = get('--file');
const packSlug   = get('--packSlug') || '';
const lang       = get('--lang') || 'ar';
const category   = get('--category') || 'alphabet';
const isSticker  = get('--sticker') === 'true';
const dryRun     = args.includes('--dry-run');

if (!filePath) {
  console.error('Usage: node scripts/import-from-csv.mjs --file <path> [--packSlug <slug>] [--lang ar] [--category alphabet] [--sticker true] [--dry-run]');
  process.exit(1);
}

const { PrismaClient } = await import('@prisma/client');
const { parseCsv, csvRowToSignPayload, importSignsBatch, buildPackMap } = await import('../services/signImportService.js');

const prisma = new PrismaClient();

async function run() {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) { console.error('File not found:', absPath); process.exit(1); }

  const raw = fs.readFileSync(absPath, 'utf-8');
  const rows = parseCsv(raw);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const payloads = rows.map((row) => {
    const p = csvRowToSignPayload(row);
    if (packSlug) p.packSlug = packSlug;
    p.lang = lang;
    p.category = category;
    if (isSticker) p.isSticker = true;
    return p;
  }).filter((p) => p.word && p.imageUrl);

  console.log(`Valid payloads: ${payloads.length}`);

  if (dryRun) {
    console.log('--- DRY RUN (first 3) ---');
    payloads.slice(0, 3).forEach((p, i) => console.log(i + 1, JSON.stringify(p, null, 2)));
    return;
  }

  const packMap = await buildPackMap(prisma);
  console.log('Packs found:', Object.keys(packMap).join(', ') || '(none)');

  const result = await importSignsBatch(prisma, payloads, packMap, ({ processed, total }) => {
    process.stdout.write(`\r  Progress: ${processed}/${total}`);
  });

  console.log('\n\nImport complete:');
  console.table({
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors.length,
    total: result.total,
  });

  if (result.errors.length > 0) {
    console.error('Errors:');
    result.errors.forEach((e) => console.error(`  [${e.index}] ${e.word}: ${e.error}`));
  }
}

run().finally(() => prisma.$disconnect());
