export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 백엔드 API로 요청 전달
    const backendUrl = 'https://kau-capstone.duckdns.org/api/models';
    
    console.log('Proxying request to:', backendUrl);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 필요시 추가 헤더
        ...(req.body && { 'Content-Length': JSON.stringify(req.body).length })
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Backend response data:', data);

    // 클라이언트에 응답 전달
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    res.status(500).json({ 
      error: 'Proxy server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}