export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['authorization'];
  const path = req.query.path || '';
  const url = 'https://app.reportei.com/api/v2' + path;

  try {
    const options = {
      method: req.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
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