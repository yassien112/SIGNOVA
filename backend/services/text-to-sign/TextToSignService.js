const PHRASE_ENTRIES = Object.freeze([
  {
    key: 'go-to-school',
    label: 'GO TO SCHOOL',
    assetPath: '/signs/go-to-school.svg',
    aliases: [
      'go to school',
      'go school',
      'to school',
      'go to the school',
      'اذهب الى المدرسة',
      'اذهب للمدرسة',
      'روح المدرسة',
      'روح على المدرسة'
    ]
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
    aliases: [
      'how are you',
      'how are you doing',
      'how are you today',
      'كيف حالك',
      'كيفك',
      'ازيك',
      'عامل ايه'
    ]
  }
]);

const WORD_ENTRIES = Object.freeze([
  {
    key: 'hello',
    label: 'HELLO',
    assetPath: '/signs/hello.svg',
    aliases: ['hello', 'hi', 'hey', 'مرحبا', 'اهلا']
  },
  {
    key: 'yes',
    label: 'YES',
    assetPath: '/signs/yes.svg',
    aliases: ['yes', 'yeah', 'yep', 'نعم', 'ايوه']
  },
  {
    key: 'no',
    label: 'NO',
    assetPath: '/signs/no.svg',
    aliases: ['no', 'nope', 'لا']
  },
  {
    key: 'help',
    label: 'HELP',
    assetPath: '/signs/help.svg',
    aliases: ['help', 'assist', 'مساعدة', 'ساعدني']
  },
  {
    key: 'eat',
    label: 'EAT',
    assetPath: '/signs/eat.svg',
    aliases: ['eat', 'food', 'اكل', 'طعام']
  },
  {
    key: 'drink',
    label: 'DRINK',
    assetPath: '/signs/drink.svg',
    aliases: ['drink', 'water', 'اشرب', 'شرب', 'ماء']
  },
  {
    key: 'go',
    label: 'GO',
    assetPath: '/signs/go.svg',
    aliases: ['go', 'leave', 'اذهب', 'روح']
  },
  {
    key: 'stop',
    label: 'STOP',
    assetPath: '/signs/stop.svg',
    aliases: ['stop', 'wait', 'قف', 'توقف']
  },
  {
    key: 'come',
    label: 'COME',
    assetPath: '/signs/come.svg',
    aliases: ['come', 'arrive', 'here', 'تعال', 'تعالى']
  },
  {
    key: 'school',
    label: 'SCHOOL',
    assetPath: '/signs/school.svg',
    aliases: ['school', 'class', 'مدرسة', 'مدرسه']
  }
]);

const IGNORED_WORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'and',
  'are',
  'is',
  'am',
  'be',
  'i',
  'you',
  'me',
  'my',
  'your',
  'our',
  'please',
  'now',
  'today',
  'في',
  'على',
  'الى',
  'إلى',
  'و',
  'هل'
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
      const normalizedAlias = normalizeText(alias);
      if (normalizedAlias.split(' ').length === 1) {
        lookup.set(normalizedAlias, entry);
      }
    }
  }

  return lookup;
}

function toResponse(normalizedText, matchedEntries, missingWords) {
  return {
    text: normalizedText,
    simplifiedText: matchedEntries.map((entry) => entry.label.toLowerCase()).join(' '),
    signs: matchedEntries.map((entry) => entry.assetPath),
    matchedWords: matchedEntries.map((entry) => entry.label),
    missingWords,
    segments: matchedEntries.map((entry) => ({
      key: entry.key,
      label: entry.label,
      assetPath: entry.assetPath
    }))
  };
}

export class TextToSignService {
  constructor() {
    this.phraseLookup = buildLookup(PHRASE_ENTRIES);
    this.wordLookup = buildWordLookup(WORD_ENTRIES, PHRASE_ENTRIES);
    this.cache = new Map();
    this.maxPhraseLength = Math.max(
      2,
      ...Array.from(this.phraseLookup.keys(), (alias) => alias.split(' ').length)
    );
  }

  findPhraseMatch(tokens, startIndex) {
    const remaining = tokens.length - startIndex;
    const maxWindow = Math.min(this.maxPhraseLength, remaining);

    for (let size = maxWindow; size >= 2; size -= 1) {
      const candidate = tokens.slice(startIndex, startIndex + size).join(' ').trim();
      const entry = this.phraseLookup.get(candidate);

      if (entry) {
        return {
          entry,
          consumed: size
        };
      }
    }

    return null;
  }

  translate(inputText) {
    const normalizedText = normalizeText(inputText);

    if (!normalizedText) {
      return toResponse('', [], []);
    }

    const cached = this.cache.get(normalizedText);
    if (cached) {
      return cached;
    }

    const tokens = normalizedText.split(' ');
    const matchedEntries = [];
    const missingWords = [];

    for (let index = 0; index < tokens.length; ) {
      const phraseMatch = this.findPhraseMatch(tokens, index);

      if (phraseMatch) {
        matchedEntries.push(phraseMatch.entry);
        index += phraseMatch.consumed;
        continue;
      }

      const token = tokens[index];
      const wordMatch = this.wordLookup.get(token);

      if (wordMatch) {
        matchedEntries.push(wordMatch);
      } else if (!IGNORED_WORDS.has(token)) {
        missingWords.push(token);
      }

      index += 1;
    }

    const response = toResponse(normalizedText, matchedEntries, missingWords);
    this.cache.set(normalizedText, response);
    return response;
  }
}
