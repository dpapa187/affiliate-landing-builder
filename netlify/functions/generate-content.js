cd ~/Desktop/affiliate-landing-builder
cat > netlify/functions/generate-content.js << 'EOF'
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Get API key from the request (user provides it)
    const CLAUDE_API_KEY = data.apiKey;
    
    if (!CLAUDE_API_KEY || !CLAUDE_API_KEY.startsWith('sk-ant-')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Valid API key required' }) };
    }

    // Call Claude API with user's key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: data.prompt }]
      })
    });

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate content' }) };
  }
};
EOF