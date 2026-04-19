# SIGNOVA — Dataset Setup Guide

> اتبع الخطوات بالترتيب ده بالظبط.

---

## المرحلة 1 — تجهيز قاعدة البيانات

### الخطوات

```bash
cd backend
npx prisma migrate dev --name add_sign_catalog
npx prisma generate
node scripts/seed-sign-catalog.mjs
```

### ✅ علامة النجاح
- Migration اتطبق من غير errors
- الـ seed طلع: `{ created: true }`
- `/api/health` بيرجع `signs: 6, signPacks: 3`

---

## المرحلة 2 — إنشاء حساب Backblaze B2

### الخطوات

1. روح [backblaze.com/b2/sign-up.html](https://www.backblaze.com/b2/sign-up.html)
2. أنشئ حساب مجاني (Email + Password)
3. فعّل الـ Email verification
4. من الـ dashboard اختار **B2 Cloud Storage**

### ✅ علامة النجاح
- عندك dashboard وبتشوف **Buckets** في القائمة الجانبية

---

## المرحلة 3 — إنشاء Bucket

### الخطوات

1. اضغط **Create a Bucket**
2. الإعدادات:
   - **Bucket Name**: `signova-signs`
   - **Files in Bucket**: `Public`
   - **Default Encryption**: `Disable`
   - **Object Lock**: `Disable`
3. اضغط **Create a Bucket**
4. من صفحة الـ bucket احفظ:
   - **Bucket Name**: `signova-signs`
   - **Endpoint**: مثلاً `s3.us-west-004.backblazeb2.com` (بيختلف حسب الـ cluster)
   - **Bucket ID**: موجود في صفحة الـ bucket

### ✅ علامة النجاح
- الـ bucket موجود وحالته Public

---

## المرحلة 4 — إنشاء Application Key

### الخطوات

1. من القائمة الجانبية اختار **App Keys**
2. اضغط **Add a New Application Key**
3. الإعدادات:
   - **Name**: `signova-import`
   - **Allow access to Bucket**: `signova-signs`
   - **Type of Access**: `Read and Write`
4. اضغط **Create New Key**
5. **احفظ فوراً** (مش هتشوفهم تاني):
   - `keyID`
   - `applicationKey`

### ✅ علامة النجاح
- عندك `keyID` و`applicationKey` محفوظين

---

## المرحلة 5 — ربط Cloudflare CDN (اختياري لكن مستحسن)

> لو مش عندك domain، ابدأ بالـ Backblaze URL المباشر وارجع لهذه المرحلة لاحقًا.

### الخطوات

1. روح [cloudflare.com](https://cloudflare.com) → اختار الـ domain بتاعك
2. من **DNS** → اضغط **Add record**:
   ```
   Type:    CNAME
   Name:    signs
   Target:  YOUR-CLUSTER.backblazeb2.com
   Proxy:   ✅ Proxied (البرتقالي)
   ```
   > استبدل `YOUR-CLUSTER` بالـ endpoint اللي حفظته في المرحلة 3
   > مثال: `s3.us-west-004.backblazeb2.com`

3. في Cloudflare → **Rules** → **Transform Rules** → **Modify Request Header**:
   - اضف rule:
     - **Field**: URI Path
     - **Operator**: starts with `/file/signova-signs/`
     - **Value**: remove prefix `/file/signova-signs`

4. الـ URL النهائي هيبقى:
   ```
   https://signs.yourdomain.com/arsl/ba.jpg
   ```

### لو مش عندك domain (مؤقت)

استخدم الـ URL المباشر:
```
https://f000.backblazeb2.com/file/signova-signs/arsl/ba.jpg
```
> استبدل `f000` بـ cluster رقمك الموجود في صفحة الـ bucket

### ✅ علامة النجاح
- تفتح URL صورة في المتصفح وتتحمل بشكل طبيعي

---

## المرحلة 6 — تحميل الـ Datasets من Kaggle

### Dataset 1: ArSL Augmented (للـ Camera Training + Arabic Signs)

1. روح [kaggle.com/datasets/sabribelmadoui/arabic-sign-language-augmented-dataset](https://www.kaggle.com/datasets/sabribelmadoui/arabic-sign-language-augmented-dataset)
2. اضغط **Download** (محتاج Kaggle account مجاني)
3. فك الضغط في: `backend/data/arsl-augmented/`
4. Structure المتوقع:
   ```
   backend/data/arsl-augmented/
   ├── train/
   │   ├── ain/
   │   ├── ba/
   │   └── ...
   └── test/
   ```

### Dataset 2: ASL Alphabet (للـ Sticker Browsing)

1. روح [kaggle.com/datasets/rupaul007/american-sign-language-alphabet-dataset](https://www.kaggle.com/datasets/rupaul007/american-sign-language-alphabet-dataset)
2. اضغط **Download**
3. فك الضغط في: `backend/data/asl-alpha/`

### ✅ علامة النجاح
- الـ folders موجودة ومحتوية على صور

---

## المرحلة 7 — رفع الصور على Backblaze B2

### تثبيت B2 CLI

```bash
pip install b2
# أو
pip3 install b2
```

### تسجيل الدخول

```bash
b2 authorize-account YOUR_KEY_ID YOUR_APP_KEY
```

### رفع الـ datasets

```bash
cd backend

# رفع ArSL (Training + Arabic Signs)
b2 sync ./data/arsl-augmented/train/ b2://signova-signs/arsl/

# رفع ASL Alphabet (Stickers)
b2 sync ./data/asl-alpha/ b2://signova-signs/asl/
```

> الرفع هياخد وقت حسب سرعة الإنترنت، B2 CLI بيتابع تلقائيًا لو انقطع.

### ✅ علامة النجاح
- الـ files ظاهرة في B2 dashboard تحت bucket `signova-signs`
- فتح URL صورة في المتصفح يشتغل:
  ```
  https://f000.backblazeb2.com/file/signova-signs/arsl/ba/ba_001.jpg
  ```

---

## المرحلة 8 — تجهيز CSV للـ Import

### لو الـ dataset عنده CSV جاهز

```bash
cd backend

# ArSL → Arabic Signs Pack
node scripts/kaggle-csv-prepare.mjs \
  --format arsl-augmented \
  --input ./data/arsl-augmented/labels.csv \
  --baseUrl https://f000.backblazeb2.com/file/signova-signs/arsl \
  --output ./data/arsl-ready.csv

# ASL Alphabet → English Stickers Pack
node scripts/kaggle-csv-prepare.mjs \
  --format asl-alpha \
  --input ./data/asl-alpha/labels.csv \
  --baseUrl https://f000.backblazeb2.com/file/signova-signs/asl \
  --output ./data/asl-ready.csv
```

> استبدل `f000` و `baseUrl` بالـ URL الصحيح من المرحلة 5.

### لو الـ dataset مش عنده CSV (صور بس في folders)

مفيش مشكلة، `scanFolderForSigns` هتتعامل مع ده تلقائيًا.
اعمل CSV يدوي بـ headers:
```
word,label,imageUrl
```
أو ابعتلي البنية وأعملها script.

### ✅ علامة النجاح
- الملفات `arsl-ready.csv` و `asl-ready.csv` موجودة
- افتحهم وشوف الـ `imageUrl` صحيح وبيفتح في المتصفح

---

## المرحلة 9 — تشغيل الـ Import

### Dry Run أولًا (اختبار بدون write)

```bash
node scripts/import-from-csv.mjs \
  --file ./data/arsl-ready.csv \
  --dry-run
```

### Import الـ Arabic Signs

```bash
node scripts/import-from-csv.mjs \
  --file ./data/arsl-ready.csv \
  --packSlug arabic-alphabet \
  --lang ar \
  --category alphabet
```

### Import الـ ASL Stickers

```bash
node scripts/import-from-csv.mjs \
  --file ./data/asl-ready.csv \
  --packSlug asl-alphabet \
  --lang en \
  --category alphabet \
  --sticker true
```

### ✅ علامة النجاح

الـ output المتوقع:
```
Parsed 15086 rows from CSV
Valid payloads: 15086
Packs found: arabic-alphabet, asl-alphabet, common-arabic-phrases
  Progress: 15086/15086

Import complete:
┌─────────┬───────┐
│ created │ 15086 │
│ updated │     0 │
│ skipped │     0 │
│ errors  │     0 │
│ total   │ 15086 │
└─────────┴───────┘
```

---

## المرحلة 10 — التحقق النهائي

```bash
# شغّل الـ backend
npm run dev
```

افتح هذه الـ endpoints وتحقق:

| URL | المتوقع |
|---|---|
| `GET /api/health` | `signs: 15092, signPacks: 3` |
| `GET /api/sign-language/packs` | 3 packs مع signCount |
| `GET /api/sign-language/dataset/stats` | breakdown بالـ lang والـ category |
| `GET /api/sign-language/search?q=مرحبا` | نتيجة واحدة على الأقل |
| `GET /api/sign-language?lang=ar&onlyStickers=true` | الـ stickers العربية |

### ✅ الـ Dataset Setup مكتمل 🎉

---

## ملاحظات مهمة

- **لا تـ commit** مجلد `backend/data/` على GitHub (صور كبيرة)
- أضف للـ `.gitignore`:
  ```
  backend/data/
  ```
- الـ B2 keys **لا تتحط** في الكود، خليها في `.env` فقط:
  ```
  B2_KEY_ID=your_key_id
  B2_APP_KEY=your_app_key
  B2_BUCKET=signova-signs
  B2_BASE_URL=https://f000.backblazeb2.com/file/signova-signs
  ```
