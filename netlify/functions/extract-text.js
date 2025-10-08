const Tesseract = require('tesseract.js');

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
    const body = JSON.parse(event.body);
    const { imageData, fileName, fileType } = body;
    
    if (!imageData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No image data provided' }),
      };
    }

    console.log(`🚀 Processing ${fileName || 'unknown file'} with ULTRA-ADVANCED OCR...`);

    // Convert base64 to buffer if needed
    let imageBuffer;
    if (imageData.startsWith('data:')) {
      // Remove data URL prefix
      const base64Data = imageData.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(imageData, 'base64');
    }

    // ULTRA-ADVANCED OCR Configuration (replicating your Python backend)
    const ocrConfigs = [
      // Configuration 1: High accuracy for clean text
      {
        lang: 'hin+eng',
        options: {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:-()[]{}"\'-/\\|&%$#@+=<>~`^_अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ',
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6', // Uniform block of text
        }
      },
      // Configuration 2: Default with better accuracy
      {
        lang: 'hin+eng',
        options: {
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:-()[]{}"\'-/\\|&%$#@+=<>~`^_अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ',
          preserve_interword_spaces: '1',
        }
      },
      // Configuration 3: Single column text
      {
        lang: 'hin+eng',
        options: {
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '1',
        }
      },
      // Configuration 4: Raw line without OSD
      {
        lang: 'hin+eng',
        options: {
          tessedit_pageseg_mode: '7',
          preserve_interword_spaces: '1',
        }
      },
      // Configuration 5: Single word
      {
        lang: 'hin+eng',
        options: {
          tessedit_pageseg_mode: '8',
          preserve_interword_spaces: '1',
        }
      }
    ];

    let bestResult = '';
    let bestConfidence = 0;

    // Try multiple OCR configurations (like your Python backend)
    for (let i = 0; i < ocrConfigs.length; i++) {
      try {
        console.log(`🔍 Trying OCR configuration ${i + 1}/${ocrConfigs.length}...`);
        
        const result = await Tesseract.recognize(
          imageBuffer,
          ocrConfigs[i].lang,
          ocrConfigs[i].options
        );

        const confidence = result.data.confidence || 0;
        const text = result.data.text || '';

        console.log(`📊 Config ${i + 1}: Confidence ${confidence.toFixed(1)}%, Text length: ${text.length}`);

        // Keep the best result
        if (confidence > bestConfidence && text.trim().length > 0) {
          bestResult = text;
          bestConfidence = confidence;
        }

        // If we get a very high confidence, use it
        if (confidence > 85 && text.trim().length > 10) {
          console.log(`✅ High confidence result found (${confidence.toFixed(1)}%), using this result`);
          break;
        }

      } catch (configError) {
        console.warn(`⚠️ OCR config ${i + 1} failed:`, configError.message);
        continue;
      }
    }

    // Post-process the text (like your Python backend)
    let processedText = bestResult;
    
    if (processedText) {
      // Clean up common OCR artifacts
      processedText = processedText
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .replace(/[^\w\s\.,!?;:\-\(\)\[\]\{\}"'\/\\|&%\$#@\+=\<\>\~\`\^_अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ]/g, '') // Remove unwanted characters
        .trim();
    }

    console.log(`🎯 Final OCR Result: Confidence ${bestConfidence.toFixed(1)}%, Text: "${processedText.substring(0, 100)}..."`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extracted_text: processedText,
        confidence: bestConfidence,
        success: true,
        method: 'tesseract_ultra_advanced',
        configs_tried: ocrConfigs.length
      }),
    };

  } catch (error) {
    console.error('❌ Error in ULTRA-ADVANCED OCR:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'OCR processing failed',
        details: error.message 
      }),
    };
  }
};