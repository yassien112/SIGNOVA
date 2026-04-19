/**
 * Utility: Prepare Kaggle ArSL / ASL CSV formats for SIGNOVA import.
 *
 * Supported Kaggle Dataset formats:
 *
 * 1. Arabic Sign Language Augmented (sabribelmadoui)
 *    CSV columns: filename, label
 *    Images served from Cloudflare R2 (you upload the folder first)
 *    Usage: node scripts/kaggle-csv-prepare.mjs --format arsl-augmented --input ./data/arsl.csv --baseUrl https://your-r2-url/arsl --output ./data/arsl-ready.csv
 *
 * 2. ArSL (birafaneimane)
 *    CSV columns: image_name, label (or class)
 *    Usage: --format arsl-birafan
 *
 * 3. ASL Alphabet (rupaul007)
 *    CSV columns: file, label
 *    Usage: --format asl-alpha
 *
 * Output: a normalized CSV ready for import-from-csv.mjs
 *   Columns: word, label, imageUrl, thumbUrl, lang, category, isSticker, sampleCount
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const format  = get('--format');
const input   = get('--input');
const baseUrl = get('--baseUrl') || '';
const output  = get('--output') || './data/prepared.csv';

if (!format || !input) {
  console.error('Usage: node scripts/kaggle-csv-prepare.mjs --format <format> --input <csv> --baseUrl <url> [--output <csv>]');
  console.error('Formats: arsl-augmented | arsl-birafan | asl-alpha | custom');
  process.exit(1);
}

const { parseCsv } = await import('../services/signImportService.js');

const FORMATS = {
  'arsl-augmented': (row) => ({
    word:        row.label || row.Label,
    label:       (row.label || row.Label || '').toLowerCase(),
    imageUrl:    baseUrl ? `${baseUrl}/${row.filename || row.Filename}` : '',
    thumbUrl:    '',
    lang:        'ar',
    category:    'alphabet',
    isSticker:   'false',
    sampleCount: '1',
    source:      'arsl-augmented-kaggle',
  }),
  'arsl-birafan': (row) => ({
    word:        row.label || row.class || row.Label || row.Class,
    label:       (row.label || row.class || '').toLowerCase(),
    imageUrl:    baseUrl ? `${baseUrl}/${row.image_name || row.filename}` : '',
    thumbUrl:    '',
    lang:        'ar',
    category:    'alphabet',
    isSticker:   'false',
    sampleCount: '1',
    source:      'arsl-birafan-kaggle',
  }),
  'asl-alpha': (row) => ({
    word:        row.label || row.Label || row.class,
    label:       (row.label || row.class || '').toLowerCase(),
    imageUrl:    baseUrl ? `${baseUrl}/${row.file || row.filename || row.File}` : '',
    thumbUrl:    '',
    lang:        'en',
    category:    'alphabet',
    isSticker:   'true',
    sampleCount: '1',
    source:      'asl-alpha-kaggle',
  }),
  'custom': (row) => row,
};

const transformer = FORMATS[format];
if (!transformer) {
  console.error('Unknown format:', format);
  console.error('Supported:', Object.keys(FORMATS).join(', '));
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(process.cwd(), input), 'utf-8');
const rows = parseCsv(raw);
console.log(`Parsed ${rows.length} rows`);

const transformed = rows.map(transformer);

const headers = Object.keys(transformed[0]);
const csvLines = [
  headers.join(','),
  ...transformed.map((row) =>
    headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','),
  ),
];

const outPath = path.resolve(process.cwd(), output);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, csvLines.join('\n'), 'utf-8');
console.log(`Saved ${transformed.length} rows → ${outPath}`);
console.log('Next step: node scripts/import-from-csv.mjs --file', output, '--packSlug <slug> --lang ar --category alphabet');
