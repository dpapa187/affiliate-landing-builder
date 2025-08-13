const https = require('https');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { apiKey, prompt, model } = JSON.parse(event.body || '{}');

    if (!apiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing API key' }) };
    }

    const chosenModel = (model && String(model).trim()) || 'claude-3-5-sonnet-20240620';

    const payload = JSON.stringify({
      model: chosenModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt || 'Test' }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Parse error: ${e.message}`));
            }
          } else {
            reject(new Error(`Anthropic ${res.statusCode}: ${data}`));
          }
        });
      });
      req.on('error', (error) => reject(error));
      req.write(payload);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Error:', error);
    let message = error.message || 'Function error';
    try {
      const match = /Anthropic\s(\d+):\s([\s\S]+)/.exec(message);
      if (match) {
        const status = match[1];
        const raw = match[2];
        const parsed = JSON.parse(raw);
        message = parsed?.error?.message || parsed?.message || message;
      }
    } catch (_) {}
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Function error', 
        message 
      }) 
    };
  }
};
