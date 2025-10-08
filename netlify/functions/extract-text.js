const { chromium } = require('playwright');

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
    const { file } = JSON.parse(event.body);
    
    if (!file) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No file provided' }),
      };
    }

    // For now, return a simple response since we can't use Python OCR in Netlify Functions
    // We'll use a different approach for OCR
    const extractedText = `OCR functionality will be implemented using a different approach for Netlify deployment.
    
    File received: ${file.name || 'Unknown'}
    File size: ${file.size || 'Unknown'} bytes
    
    For production deployment, we'll integrate with:
    - Google Cloud Vision API
    - Or use a client-side OCR library
    - Or implement serverless OCR using AWS Lambda`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        extracted_text: extractedText,
        success: true,
      }),
    };

  } catch (error) {
    console.error('Error processing file:', error);
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
