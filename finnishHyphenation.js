import Hypher from 'hypher';
import finnishPatterns from 'hyphenation.fi';

let hyphenator;

try {
  hyphenator = new Hypher(finnishPatterns);
} catch (error) {
  console.error('Error initializing Hypher:', error);
  // Fallback function if Hypher fails to initialize
  hyphenator = {
    hyphenate: (word) => [word]
  };
}

export function hyphenate(word) {
  if (!word || typeof word !== 'string') return '';
  try {
    return hyphenator.hyphenateText(word, '\u00AD');
  } catch (error) {
    console.error('Hyphenation error:', error);
    return word; // Return the original word if hyphenation fails
  }
}

// Finnish syllabification rules (simplified)
const vowels = 'aeiouyäöAEIOUYÄÖ';
const diphthongs = ['ai', 'ei', 'oi', 'ui', 'yi', 'äi', 'öi', 'au', 'eu', 'ou', 'iu', 'ey', 'äy', 'öy', 'ie', 'uo', 'yö'];

export function syllabify(word) {
  if (!word || typeof word !== 'string') return '';
  
  let syllables = [];
  let currentSyllable = '';
  
  for (let i = 0; i < word.length; i++) {
    currentSyllable += word[i];
    
    if (vowels.includes(word[i])) {
      // Check for diphthongs
      if (i < word.length - 1 && diphthongs.includes(word[i] + word[i+1])) {
        currentSyllable += word[i+1];
        i++;
      }
      
      // End of syllable
      if (i === word.length - 1 || !vowels.includes(word[i+1])) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
  }
  
  // Add any remaining consonants to the last syllable
  if (currentSyllable) {
    syllables[syllables.length - 1] += currentSyllable;
  }
  
  return syllables.join('-');
}
