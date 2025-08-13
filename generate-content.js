cd ~/Desktop/affiliate-landing-builder
cat > netlify/functions/generate-content.js << 'EOF'
const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body);
    
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service not configured' }) };
    }

    // MUCH BETTER PROMPT for unique content
    const enhancedPrompt = `You are an expert copywriter creating a unique landing page for an affiliate product.

PRODUCT DETAILS:
${data.prompt}

Create ORIGINAL, UNIQUE content that doesn't use generic marketing phrases. Write like a real person talking to a friend about an amazing discovery. Be specific, use storytelling, and create emotional connections.

IMPORTANT INSTRUCTIONS:
1. Write a headline that's specific to THIS product's unique benefit (not generic)
2. Tell a mini-story in the subheadline that creates curiosity
3. For benefits, think of SPECIFIC, MEASURABLE outcomes related to this product
4. Create realistic testimonials with specific details and results
5. Write FAQ answers that address real concerns buyers would have
6. Use numbers, timeframes, and specific details throughout
7. Avoid these overused phrases: "transform your life", "revolutionary", "breakthrough", "ultimate solution", "unlock", "discover the secret"
8. Instead use conversational language like: "Here's what happened when...", "I was skeptical until...", "The weird thing that actually works..."

Generate varied content each time. Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "headline": "Specific, benefit-focused headline unique to this product",
  "subheadline": "Story-driven subheadline that builds curiosity",
  "openingStatement": "A conversational paragraph that connects with the reader's problem",
  "benefits": [
    {"icon": "emoji", "title": "Specific Benefit", "description": "Detailed explanation with numbers/timeframe"},
    {"icon": "emoji", "title": "Specific Benefit", "description": "Detailed explanation with numbers/timeframe"},
    {"icon": "emoji", "title": "Specific Benefit", "description": "Detailed explanation with numbers/timeframe"},
    {"icon": "emoji", "title": "Specific Benefit", "description": "Detailed explanation with numbers/timeframe"}
  ],
  "testimonials": [
    {"name": "Full Name", "text": "Specific story with actual results and timeframe", "rating": 5},
    {"name": "Full Name", "text": "Personal experience with specific details", "rating": 5},
    {"name": "Full Name", "text": "Emotional story with transformation details", "rating": 5}
  ],
  "ctaText": "Action-oriented button text specific to the offer",
  "urgencyText": "Create genuine urgency without being pushy",
  "guarantee": "Specific guarantee that addresses main objection",
  "bonuses": [
    {"title": "Specific Bonus Name", "value": "$X", "description": "What this bonus helps with"},
    {"title": "Specific Bonus Name", "value": "$X", "description": "What this bonus helps with"}
  ],
  "faq": [
    {"question": "Specific concern about this product?", "answer": "Detailed, honest answer"},
    {"question": "Technical question about how it works?", "answer": "Clear explanation"},
    {"question": "Skeptical question about results?", "answer": "Reassuring answer with specifics"}
  ]
}`;

    const requestData = JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 3000,  // Increased for more detailed content
      temperature: 0.8,   // Added for more creativity
      messages: [{ 
        role: 'user', 
        content: enhancedPrompt 
      }]
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(requestData);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Generation failed' }) };
  }
};
EOF