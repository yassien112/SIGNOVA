/**
 * Maps provider / detected language codes to the chat API contract: "ar" | "en".
 * Falls back to simple script detection when the model omits language metadata.
 */
export function resolveChatLanguage({ apiLanguage, text, requestedLanguage }) {
  const requested = String(requestedLanguage || '')
    .trim()
    .toLowerCase()
    .slice(0, 2);
  if (requested === 'ar' || requested === 'en') {
    return requested;
  }

  const raw = String(apiLanguage || '').trim().toLowerCase();
  if (raw.startsWith('ar') || raw.includes('arabic')) {
    return 'ar';
  }
  if (raw.startsWith('en') || raw.includes('english')) {
    return 'en';
  }

  // Arabic script ranges (common BMP blocks)
  const arabicScript =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      String(text || '')
    );
  return arabicScript ? 'ar' : 'en';
}
