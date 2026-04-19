const PHRASE_ENTRIES = Object.freeze([
  {
    key: 'go-to-school',
    label: 'GO TO SCHOOL',
    assetPath: '/signs/go-to-school.svg',
    aliases: ['go to school', 'go school', 'to school', 'go to the school', 'اذهب الى المدرسة', 'اذهب للمدرسة', 'روح المدرسة', 'روح على المدرسة']
  },
  {
    key: 'thank-you',
    label: 'THANK YOU',
    assetPath: '/signs/thank-you.svg',
    aliases: ['thank you', 'thanks', 'thankyou', 'شكرا', 'شكرا لك']
  },
  {
    key: 'how-are-you',
    label: 'HOW ARE YOU',
    assetPath: '/signs/how-are-you.svg',
    aliases: ['how are you', 'how are you doing', 'how are you today', 'كيف حالك', 'كيفك', 'ازيك', 'عامل ايه']
  },
  {
    key: 'good-morning',
    label: 'GOOD MORNING',
    assetPath: '/signs/good.svg',
    aliases: ['good morning', 'صباح الخير']
  },
  {
    key: 'good-night',
    label: 'GOOD NIGHT',
    assetPath: '/signs/good.svg',
    aliases: ['good night', 'تصبح على خير', 'مساء الخير']
  },
  {
    key: 'i-love-you',
    label: 'I LOVE YOU',
    assetPath: '/signs/love.svg',
    aliases: ['i love you', 'احبك', 'أنا أحبك']
  },
  {
    key: 'where-is-bathroom',
    label: 'WHERE IS BATHROOM',
    assetPath: '/signs/help.svg',
    aliases: ['where is bathroom', 'bathroom please', 'فين الحمام', 'اين الحمام']
  }
]);

const WORD_ENTRIES = Object.freeze([
  { key: 'hello',    label: 'HELLO',    assetPath: '/signs/hello.svg',    aliases: ['hello', 'hi', 'hey', 'مرحبا', 'اهلا'] },
  { key: 'yes',      label: 'YES',      assetPath: '/signs/yes.svg',      aliases: ['yes', 'yeah', 'yep', 'نعم', 'ايوه'] },
  { key: 'no',       label: 'NO',       assetPath: '/signs/no.svg',       aliases: ['no', 'nope', 'لا'] },
  { key: 'help',     label: 'HELP',     assetPath: '/signs/help.svg',     aliases: ['help', 'assist', 'مساعدة', 'ساعدني'] },
  { key: 'eat',      label: 'EAT',      assetPath: '/signs/eat.svg',      aliases: ['eat', 'food', 'اكل', 'طعام'] },
  { key: 'drink',    label: 'DRINK',    assetPath: '/signs/drink.svg',    aliases: ['drink', 'water', 'اشرب', 'شرب', 'ماء'] },
  { key: 'go',       label: 'GO',       assetPath: '/signs/go.svg',       aliases: ['go', 'leave', 'اذهب', 'روح'] },
  { key: 'stop',     label: 'STOP',     assetPath: '/signs/stop.svg',     aliases: ['stop', 'wait', 'قف', 'توقف'] },
  { key: 'come',     label: 'COME',     assetPath: '/signs/come.svg',     aliases: ['come', 'arrive', 'here', 'تعال', 'تعالى'] },
  { key: 'school',   label: 'SCHOOL',   assetPath: '/signs/school.svg',   aliases: ['school', 'class', 'مدرسة', 'مدرسه'] },
  { key: 'good',     label: 'GOOD',     assetPath: '/signs/good.svg',     aliases: ['good', 'great', 'nice', 'كويس', 'جيد'] },
  { key: 'bad',      label: 'BAD',      assetPath: '/signs/bad.svg',      aliases: ['bad', 'سيئ', 'وحش'] },
  { key: 'love',     label: 'LOVE',     assetPath: '/signs/love.svg',     aliases: ['love', 'حب', 'احب'] },
  { key: 'sorry',    label: 'SORRY',    assetPath: '/signs/sorry.svg',    aliases: ['sorry', 'اسف', 'آسف'] },
  { key: 'bathroom', label: 'BATHROOM', assetPath: '/signs/help.svg',     aliases: ['bathroom', 'toilet', 'حمام'] },
  { key: 'name',     label: 'NAME',     assetPath: '/signs/hello.svg',    aliases: ['name', 'اسم'] },
  { key: 'work',     label: 'WORK',     assetPath: '/signs/go.svg',       aliases: ['work', 'job', 'عمل', 'شغل'] },
  { key: 'home',     label: 'HOME',     assetPath: '/signs/come.svg',     aliases: ['home', 'house', 'بيت', 'منزل'] }
  // NOTE: 'please' is intentionally NOT here — it lives in IGNORED_WORDS
]);

// Words that carry no sign meaning and should be silently dropped
const IGNORED_WORDS = new Set([
  'a', 'an', 'the', 'to', 'and', 'are', 'is', 'am', 'be',
  'i', 'you', 'me', 'my', 'your', 'our',
  'please', 'now', 'today', 'just', 'very', 'so', 'then',
  'في', 'على', 'الى', 'إلى', 'و', 'هل', 'من فضلك', 'لو سمحت'
]);

function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildLookup(entries) {
  const lookup = new Map();
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      lookup.set(normalizeText(alias), entry);
    }
  }
  return lookup;
}

function buildWordLookup(wordEntries, phraseEntries) {
  const lookup = buildLookup(wordEntries);
  for (const entry of phraseEntries) {
    for (const alias of entry.aliases) {
      const normalized = normalizeText(alias);
      if (normalized.split(' ').length === 1) {
        lookup.set(normalized, entry);
      }
    }
  }
  return lookup;
}

function toResponse(normalizedText, matchedEntries, missingWords) {
  return {
    text: normalizedText,
    simplifiedText: matchedEntries.map((e) => e.label.toLowerCase()).join(' '),
    signs: matchedEntries.map((e) => e.assetPath),
    matchedWords: matchedEntries.map((e) => e.label),
    missingWords,
    segments: matchedEntries.map((e) => ({ key: e.key, label: e.label, assetPath: e.assetPath })),
    supportedEntries: { phrases: PHRASE_ENTRIES.length, words: WORD_ENTRIES.length }
  };
}

export class TextToSignService {
  constructor() {
    this.phraseLookup = buildLookup(PHRASE_ENTRIES);
    this.wordLookup   = buildWordLookup(WORD_ENTRIES, PHRASE_ENTRIES);
    this.cache        = new Map();
    this.maxPhraseLength = Math.max(
      2,
      ...Array.from(this.phraseLookup.keys(), (k) => k.split(' ').length)
    );
  }

  findPhraseMatch(tokens, startIndex) {
    const maxWindow = Math.min(this.maxPhraseLength, tokens.length - startIndex);
    for (let size = maxWindow; size >= 2; size--) {
      const candidate = tokens.slice(startIndex, startIndex + size).join(' ');
      const entry = this.phraseLookup.get(candidate);
      if (entry) return { entry, consumed: size };
    }
    return null;
  }

  translate(inputText) {
    const normalizedText = normalizeText(inputText);
    if (!normalizedText) return toResponse('', [], []);

    const cached = this.cache.get(normalizedText);
    if (cached) return cached;

    const tokens        = normalizedText.split(' ');
    const matchedEntries = [];
    const missingWords   = [];

    for (let i = 0; i < tokens.length; ) {
      const phraseMatch = this.findPhraseMatch(tokens, i);
      if (phraseMatch) {
        matchedEntries.push(phraseMatch.entry);
        i += phraseMatch.consumed;
        continue;
      }

      const token = tokens[i];
      const wordMatch = this.wordLookup.get(token);
      if (wordMatch) {
        matchedEntries.push(wordMatch);
      } else if (!IGNORED_WORDS.has(token)) {
        missingWords.push(token);
      }
      i++;
    }

    const response = toResponse(normalizedText, matchedEntries, missingWords);
    this.cache.set(normalizedText, response);
    return response;
  }
}
