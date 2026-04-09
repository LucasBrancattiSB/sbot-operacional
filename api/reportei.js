export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Action');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['authorization'];
  const action = req.headers['x-action'];

  if (action === 'claude-chat') {
    const { system, messages } = req.body;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'pdfs-2024-09-25'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system,
          messages
        })
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const path = req.query.path || '';
  const url = 'https://app.reportei.com/api/v2' + path;
  try {
    const options = {
      method: req.method,
      headers: { 'Authorization': token, 'Content-Type': 'application/json' }
    };
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
