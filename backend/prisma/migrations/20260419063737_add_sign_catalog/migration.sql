-- CreateTable
CREATE TABLE "SignPack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "coverUrl" TEXT,
    "category" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sign" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "category" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "tags" TEXT[],
    "aliases" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "isSticker" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packId" TEXT,

    CONSTRAINT "Sign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignPack_slug_key" ON "SignPack"("slug");

-- CreateIndex
CREATE INDEX "SignPack_lang_category_idx" ON "SignPack"("lang", "category");

-- CreateIndex
CREATE INDEX "SignPack_isActive_sortOrder_idx" ON "SignPack"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Sign_lang_category_idx" ON "Sign"("lang", "category");

-- CreateIndex
CREATE INDEX "Sign_packId_sortOrder_idx" ON "Sign"("packId", "sortOrder");

-- CreateIndex
CREATE INDEX "Sign_isSticker_isActive_idx" ON "Sign"("isSticker", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Sign_lang_normalizedWord_key" ON "Sign"("lang", "normalizedWord");

-- AddForeignKey
ALTER TABLE "Sign" ADD CONSTRAINT "Sign_packId_fkey" FOREIGN KEY ("packId") REFERENCES "SignPack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
