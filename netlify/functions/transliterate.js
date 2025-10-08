// Simple transliteration function for Netlify
// This provides basic Roman to Hindi conversion

const transliterationMap = {
  // Basic vowels
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  
  // Consonants
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'sh': 'श',
  'shh': 'ष', 's': 'स', 'h': 'ह',
  
  // Kripalu Ji Maharaj specific vocabulary
  'kripalu': 'कृपालु', 'kripal': 'कृपाल', 'gurudev': 'गुरुदेव',
  'shri': 'श्री', 'krishna': 'कृष्ण', 'radha': 'राधा',
  'bhakti': 'भक्ति', 'prem': 'प्रेम', 'ras': 'रस',
  'leela': 'लीला', 'bhagwan': 'भगवान', 'prabhu': 'प्रभु',
  'hari': 'हरि', 'ram': 'राम', 'govind': 'गोविन्द',
  'madhav': 'माधव', 'mohan': 'मोहन', 'gopal': 'गोपाल'
};

function transliterateToHindi(text) {
  if (!text) return '';
  
  let result = text.toLowerCase();
  
  // Replace words from our map
  Object.keys(transliterationMap).forEach(roman => {
    const regex = new RegExp(`\\b${roman}\\b`, 'gi');
    result = result.replace(regex, transliterationMap[roman]);
  });
  
  return result;
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
