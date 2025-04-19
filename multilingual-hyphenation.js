import i18n from './translation';

// Finnish language constants
const finnishVowels = 'aeiouyäöAEIOUYÄÖ';
const finnishDiphthongs = [
  'ai', 'ei', 'oi', 'ui', 'yi', 'äi', 'öi',
  'au', 'eu', 'ou', 'iu',
  'ey', 'äy', 'öy',
  'ie', 'uo', 'yö'
];

// Check if a character is a vowel in Finnish
function isVowel(char) {
  return finnishVowels.includes(char);
}

// Check if two vowels form a diphthong
function isDiphthong(char1, char2) {
  return finnishDiphthongs.includes((char1 + char2).toLowerCase());
}

/**
 * Very simple Finnish hyphenation implementation that follows only 
 * the most basic and reliable rules:
 * 
 * 1. Double consonants split (kuk-ka)
 * 2. Non-diphthong vowel pairs split (pi-an)
 * 3. A single consonant between vowels goes with the following vowel (ta-lo)
 */
export function syllabifyFinnish(word) {
  // Don't hyphenate short words (less than 4 characters)
  if (!word || typeof word !== 'string' || word.length < 4) {
    return word;
  }
  
  // Process word character by character
  let result = '';
  
  for (let i = 0; i < word.length; i++) {
    const current = word[i];
    
    // Add current character
    result += current;
    
    // Skip if we're at the last character or too close to the end
    if (i >= word.length - 2) continue;
    
    const next = word[i + 1];
    
    // Rule 1: Double consonants - add hyphen between them
    if (!isVowel(current) && next === current) {
      result += '-';
    }
    // Rule 2: Vowel followed by vowel that doesn't form a diphthong
    else if (isVowel(current) && isVowel(next) && !isDiphthong(current, next)) {
      result += '-';
    }
    // Rule 3: Vowel followed by consonant followed by vowel (V-CV pattern)
    else if (isVowel(current) && !isVowel(next) && i + 2 < word.length && isVowel(word[i + 2])) {
      result += '-';
    }
  }
  
  // Clean up any misplaced hyphens
  result = result.replace(/^-+/, ''); // Remove hyphens at the start
  result = result.replace(/-+$/, ''); // Remove hyphens at the end
  result = result.replace(/-+/g, '-'); // Replace multiple hyphens with single ones
  
  return result;
}

// The main function that chooses the right syllabification based on language
export function syllabify(word) {
  const currentLanguage = i18n.language;
  
  // Only apply syllabification for Finnish
  if (currentLanguage === 'fi') {
    return syllabifyFinnish(word);
  } else {
    // For other languages, don't hyphenate at all
    return word;
  }
} 