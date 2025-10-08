// Simple transliteration function for Netlify
// This provides basic Roman to Hindi conversion

const transliterationMap = {
  // Vowels (with diacritics)
  'a': 'अ', 'aa': 'आ', 'ā': 'आ', 'i': 'इ', 'ii': 'ई', 'ī': 'ई',
  'u': 'उ', 'uu': 'ऊ', 'ū': 'ऊ', 'e': 'ए', 'ee': 'ई', 'o': 'ओ', 'oo': 'ऊ',
  'ai': 'ऐ', 'au': 'औ', 'ri': 'ऋ', 'rī': 'ॠ', 'lri': 'ऌ', 'lrii': 'ॡ',
  
  // Consonants
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ', 'ch': 'च', 'chh': 'छ',
  'j': 'ज', 'jh': 'झ', 'ny': 'ञ', 't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध',
  'n': 'न', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म', 'y': 'य',
  'r': 'र', 'l': 'ल', 'v': 'व', 'sh': 'श', 'shh': 'ष', 's': 'स', 'h': 'ह',
  
  // Retroflex consonants
  't.': 'ट', 'th.': 'ठ', 'd.': 'ड', 'dh.': 'ढ', 'n.': 'ण',
  
  // Special characters
  '.': '।', '..': '॥', ',': ',', ';': ';', ':': ':', '!': '!', '?': '?',
  
  // Common spiritual words
  'hari': 'हरि', 'krishna': 'कृष्ण', 'ram': 'राम', 'shiva': 'शिव', 'guru': 'गुरु',
  'dev': 'देव', 'devi': 'देवी', 'bhagavan': 'भगवान', 'ishwar': 'ईश्वर',
  'paramatma': 'परमात्मा', 'brahman': 'ब्रह्म', 'atma': 'आत्मा', 'jiva': 'जीव',
  
  // Kripalu Ji Maharaj specific vocabulary
  'kripalu': 'कृपालु', 'kripal': 'कृपाल', 'gurudev': 'गुरुदेव', 'gurudeva': 'गुरुदेव',
  'shri': 'श्री', 'krishna': 'कृष्ण', 'radha': 'राधा', 'radhe': 'राधे', 'radhey': 'राधे',
  'shyam': 'श्याम', 'sundar': 'सुन्दर', 'shyamsundar': 'श्यामसुन्दर',
  'bhakti': 'भक्ति', 'prem': 'प्रेम', 'ras': 'रस', 'premras': 'प्रेमरस',
  'leela': 'लीला', 'bhagwan': 'भगवान', 'prabhu': 'प्रभु', 'swami': 'स्वामी',
  'madhav': 'माधव', 'mohan': 'मोहन', 'gopal': 'गोपाल', 'govind': 'गोविन्द',
  'nandlal': 'नन्दलाल', 'nandlaal': 'नन्दलाल', 'kanha': 'कान्हा', 'kanhaiya': 'कन्हैया',
  
  // Spiritual terms
  'braj': 'ब्रज', 'vrindavan': 'वृन्दावन', 'vrindavana': 'वृन्दावन',
  'mathura': 'मथुरा', 'dwarka': 'द्वारका', 'dwarkadhish': 'द्वारकाधीश',
  'siddhant': 'सिद्धान्त', 'madhuri': 'माधुरी', 'keertan': 'कीर्तन', 'bhajan': 'भजन',
  'satsang': 'सत्संग', 'sadhana': 'साधना', 'tapasya': 'तपस्या', 'maya': 'माया',
  'moksha': 'मोक्ष', 'mukti': 'मुक्ति', 'nirvana': 'निर्वाण', 'samadhi': 'समाधि',
  
  // Divine qualities
  'karuna': 'करुणा', 'kripa': 'कृपा', 'daya': 'दया', 'prem': 'प्रेम', 'bhakti': 'भक्ति',
  'shraddha': 'श्रद्धा', 'vishwas': 'विश्वास', 'surrender': 'समर्पण',
  
  // Common devotional terms
  'das': 'दास', 'dasi': 'दासी', 'sevak': 'सेवक', 'sevika': 'सेविका',
  'bhakt': 'भक्त', 'bhakta': 'भक्त', 'bhaktin': 'भक्तिन', 'upasak': 'उपासक',
  'pujari': 'पुजारी', 'acharya': 'आचार्य', 'sant': 'संत', 'maharaj': 'महाराज',
  
  // Time and place
  'kal': 'काल', 'yug': 'युग', 'kaliyug': 'कलियुग', 'satya': 'सत्य',
  'treta': 'त्रेता', 'dwapar': 'द्वापर', 'lok': 'लोक', 'swarg': 'स्वर्ग',
  'narak': 'नरक', 'mrityu': 'मृत्यु', 'janma': 'जन्म', 'karma': 'कर्म'
};

function transliterateToHindi(text) {
  if (!text) return '';
  
  // Split into words while preserving punctuation
  const words = text.split(/\s+/);
  const hindiWords = [];
  
  for (const word of words) {
    const wordLower = word.toLowerCase();
    let hindiWord = '';
    
    // Check if whole word exists in map (exact match)
    if (transliterationMap[wordLower]) {
      hindiWord = transliterationMap[wordLower];
      // Preserve original punctuation
      if (word !== wordLower) {
        hindiWord += word.substring(wordLower.length);
      }
      hindiWords.push(hindiWord);
      continue;
    }
    
    // Try character-by-character conversion (like Python backend)
    let i = 0;
    while (i < wordLower.length) {
      let found = false;
      
      // Try 3-character combinations first
      if (i + 2 < wordLower.length) {
        const threeChar = wordLower.substring(i, i + 3);
        if (transliterationMap[threeChar]) {
          hindiWord += transliterationMap[threeChar];
          i += 3;
          found = true;
        }
      }
      
      // Try 2-character combinations
      if (!found && i + 1 < wordLower.length) {
        const twoChar = wordLower.substring(i, i + 2);
        if (transliterationMap[twoChar]) {
          hindiWord += transliterationMap[twoChar];
          i += 2;
          found = true;
        }
      }
      
      // Try single characters
      if (!found) {
        const singleChar = wordLower[i];
        if (transliterationMap[singleChar]) {
          hindiWord += transliterationMap[singleChar];
        } else {
          // Keep original character if no mapping found
          hindiWord += word[i];
        }
        i += 1;
      }
    }
    
    // Add punctuation back
    if (word !== wordLower) {
      hindiWord += word.substring(wordLower.length);
    }
    hindiWords.push(hindiWord);
  }
  
  return hindiWords.join(' ');
}

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No text provided' }),
      };
    }

    const hindiText = transliterateToHindi(text);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hindi_text: hindiText,
        original_text: text,
        success: true,
      }),
    };

  } catch (error) {
    console.error('Error in transliteration:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
};
