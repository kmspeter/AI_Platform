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
    // 쿼리 파라미터에서 id 확인
    const { id } = req.query;
    
    let backendUrl;
    if (id) {
      // /api/models?id=1 -> 특정 모델 상세 정보
      backendUrl = `https://kau-capstone.duckdns.org/api/models/${id}`;
    } else {
      // /api/models -> 모델 목록
      backendUrl = 'https://kau-capstone.duckdns.org/api/models';
    }
    
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