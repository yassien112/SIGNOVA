# SIGNOVA — Dataset Import Guide

This guide explains how to import signs from Kaggle datasets into SIGNOVA's sign catalog.

---

## Quick Setup (3 Steps)

### Step 1 — Run Migration

```bash
cd backend
npx prisma migrate dev --name add_sign_catalog
npx prisma generate
node scripts/seed-sign-catalog.mjs
```

---

### Step 2 — Download Dataset from Kaggle

#### For AI Camera Training + Arabic Stickers:
**ArSL Augmented** (recommended for training)
- URL: https://www.kaggle.com/datasets/sabribelmadoui/arabic-sign-language-augmented-dataset
- Contains: 15,086 images, 30 Arabic letters
- Download and extract to: `backend/data/arsl-augmented/`

**ArSL Birafan** (alternative with pretrained model)
- URL: https://www.kaggle.com/datasets/birafaneimane/arabic-sign-language-alphabet-arsl-dataset
- Contains: 6,000 images, 30 classes

#### For Sticker Browsing (ASL):
**ASL Alphabet**
- URL: https://www.kaggle.com/datasets/rupaul007/american-sign-language-alphabet-dataset
- Contains: 5,200 images A–Z with landmarks

---

### Step 3 — Prepare CSV and Import

#### Option A: ArSL dataset (Arabic Camera + Stickers)

```bash
# 1. Prepare the Kaggle CSV into SIGNOVA format
node scripts/kaggle-csv-prepare.mjs \
  --format arsl-augmented \
  --input ./data/arsl-augmented/labels.csv \
  --baseUrl https://YOUR-R2-BUCKET.r2.dev/arsl-augmented \
  --output ./data/arsl-ready.csv

# 2. Run the import
node scripts/import-from-csv.mjs \
  --file ./data/arsl-ready.csv \
  --packSlug arabic-alphabet \
  --lang ar \
  --category alphabet
```

#### Option B: ASL Alphabet (English Stickers)

```bash
node scripts/kaggle-csv-prepare.mjs \
  --format asl-alpha \
  --input ./data/asl-alpha/labels.csv \
  --baseUrl https://YOUR-R2-BUCKET.r2.dev/asl-alpha \
  --output ./data/asl-ready.csv

node scripts/import-from-csv.mjs \
  --file ./data/asl-ready.csv \
  --packSlug asl-alphabet \
  --lang en \
  --category alphabet \
  --sticker true
```

#### Option C: Admin API (no CLI)

```bash
# POST CSV string directly
curl -X POST https://your-api/api/admin/signs/import/csv \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"csv": "word,label,imageUrl\nhello,hello,https://...", "packSlug": "common-arabic-phrases", "lang": "ar"}'

# Check job status
curl https://your-api/api/admin/signs/import/status/import-1234567890 \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

---

## CSV Format Reference

| Column | Required | Example |
|---|---|---|
| word | ✅ | مرحبا |
| label | ✅ | hello |
| imageUrl | ✅ | https://r2.../sign.jpg |
| thumbUrl | ❌ | https://r2.../sign-thumb.jpg |
| lang | ❌ | ar |
| category | ❌ | alphabet |
| packSlug | ❌ | arabic-alphabet |
| isSticker | ❌ | true |
| sampleCount | ❌ | 150 |
| tags | ❌ | greeting,hello |
| aliases | ❌ | أهلا |

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | /api/sign-language | All active signs |
| GET | /api/sign-language/search?q=مرحبا | Search |
| GET | /api/sign-language/packs | All packs |
| GET | /api/sign-language/packs/:id | Signs in pack |
| GET | /api/sign-language/dataset/stats | Stats by lang/category |
| POST | /api/admin/signs/import/csv | Bulk CSV import |
| POST | /api/admin/signs/import/json | Bulk JSON import |
| GET | /api/admin/signs/import/status/:jobId | Job status |
| GET | /api/admin/stats | Full platform stats |
| GET | /api/admin/users | Users list |
| PATCH | /api/admin/users/:id | Update role |
| POST | /api/admin/packs | Create pack |
| PATCH | /api/admin/packs/:id | Update pack |
| DELETE | /api/admin/packs/:id | Delete pack |
| PATCH | /api/admin/signs/:id | Update sign |
| DELETE | /api/admin/signs/:id | Soft delete sign |
