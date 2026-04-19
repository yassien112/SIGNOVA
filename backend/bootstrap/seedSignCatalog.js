const BASE_PACKS = [
  {
    slug: 'arabic-alphabet',
    name: 'Arabic Alphabet',
    nameAr: 'الحروف العربية',
    lang: 'ar',
    category: 'alphabet',
    description: 'Arabic alphabet signs used for camera recognition and sticker browsing.',
    coverUrl: null,
    sortOrder: 1,
  },
  {
    slug: 'common-arabic-phrases',
    name: 'Arabic Common Phrases',
    nameAr: 'عبارات عربية شائعة',
    lang: 'ar',
    category: 'phrases',
    description: 'High-frequency Arabic words and phrases prepared for sticker-like sending.',
    coverUrl: null,
    sortOrder: 2,
  },
  {
    slug: 'asl-alphabet',
    name: 'ASL Alphabet',
    nameAr: 'أبجدية ASL',
    lang: 'en',
    category: 'alphabet',
    description: 'ASL alphabet pack suitable for sticker browsing and fallback recognition experiments.',
    coverUrl: null,
    sortOrder: 3,
  },
];

function normalizeWord(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ');
}

export async function seedSignCatalog(prisma) {
  const existingPacks = await prisma.signPack.count();
  if (existingPacks > 0) return { created: false, reason: 'packs-exist' };

  for (const pack of BASE_PACKS) {
    await prisma.signPack.create({ data: pack });
  }

  const arabicAlphabetPack = await prisma.signPack.findUnique({ where: { slug: 'arabic-alphabet' } });
  const commonArabicPack = await prisma.signPack.findUnique({ where: { slug: 'common-arabic-phrases' } });
  const aslAlphabetPack = await prisma.signPack.findUnique({ where: { slug: 'asl-alphabet' } });

  const starterSigns = [
    { word: 'مرحبا', label: 'hello', lang: 'ar', category: 'phrases', packId: commonArabicPack.id, isSticker: true, tags: ['hello', 'greeting'], aliases: ['اهلا'] },
    { word: 'شكرا', label: 'thanks', lang: 'ar', category: 'phrases', packId: commonArabicPack.id, isSticker: true, tags: ['thanks'], aliases: ['مشكور'] },
    { word: 'نعم', label: 'yes', lang: 'ar', category: 'phrases', packId: commonArabicPack.id, isSticker: true, tags: ['yes'], aliases: [] },
    { word: 'لا', label: 'no', lang: 'ar', category: 'phrases', packId: commonArabicPack.id, isSticker: true, tags: ['no'], aliases: [] },
    { word: 'A', label: 'A', lang: 'en', category: 'alphabet', packId: aslAlphabetPack.id, isSticker: true, tags: ['asl', 'alphabet'], aliases: [] },
    { word: 'ب', label: 'ba', lang: 'ar', category: 'alphabet', packId: arabicAlphabetPack.id, isSticker: false, tags: ['حرف', 'alphabet'], aliases: [] },
  ];

  for (let i = 0; i < starterSigns.length; i += 1) {
    const sign = starterSigns[i];
    await prisma.sign.create({
      data: {
        ...sign,
        normalizedWord: normalizeWord(sign.word),
        imageUrl: 'https://placehold.co/512x512/png?text=Sign',
        thumbUrl: 'https://placehold.co/128x128/png?text=Sign',
        source: 'seed',
        sampleCount: 0,
        isActive: true,
        sortOrder: i + 1,
        metadata: { seeded: true },
      },
    });
  }

  return { created: true };
}
