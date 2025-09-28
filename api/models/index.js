// api/models/index.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Node.js에서 fetch 사용을 위해 동적 import
    const fetch = (await import('node-fetch')).default;
    
    const backendUrl = 'https://kau-capstone.duckdns.org/api/models';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Proxy/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Backend API returned ${response.status}`,
        message: response.statusText 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}