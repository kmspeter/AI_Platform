import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Play, 
  Settings,
  Clock,
  Shield,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PurchaseComplete = () => {
  const { txId } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('typescript');
  const [sessionToken, setSessionToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // URL 파라미터에서 추가 정보 가져오기
  const accessPassId = searchParams.get('passId') || 'pass_abc123';
  const modelId = searchParams.get('modelId') || 'gpt-4-turbo';

  const accessPass = {
    id: accessPassId,
    modelId: modelId,
    modelName: 'GPT-4 Turbo',
    plan: '표준',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    remainingQuota: 1000000, // tokens
    totalQuota: 1000000,
    regions: ['US', 'EU', 'KR'],
    ownerWallet: '0x1234...5678'
  };

  const codeSnippets = {
    typescript: `import { ModelHubClient } from '@modelhub/client';

// 1. 세션 발급
const client = new ModelHubClient({
  accessPass: '${accessPass.id}'
});

const session = await client.createSession();

// 2. API 키 생성
const apiKey = await session.generateApiKey({
  permissions: ['chat', 'completions'],
  expiresIn: '24h'
});

// 3. 모델 추론
const response = await client.chat.completions.create({
  model: '${accessPass.modelId}',
  messages: [
    { role: 'user', content: '안녕하세요!' }
  ],
  apiKey: apiKey.key
});

console.log(response.choices[0].message.content);`,

    python: `import modelhub

# 1. 세션 발급
client = modelhub.Client(access_pass='${accessPass.id}')
session = client.create_session()

# 2. API 키 생성
api_key = session.generate_api_key(
    permissions=['chat', 'completions'],
    expires_in='24h'
)

# 3. 모델 추론
response = client.chat.completions.create(
    model='${accessPass.modelId}',
    messages=[
        {'role': 'user', 'content': '안녕하세요!'}
    ],
    api_key=api_key.key
)

print(response.choices[0].message.content)`,

    curl: `# 1. 세션 발급
curl -X POST "https://api.modelhub.ai/v1/sessions" \\
  -H "Authorization: Bearer ${accessPass.id}" \\
  -H "Content-Type: application/json"

# 2. API 키 생성 (세션 토큰 사용)
curl -X POST "https://api.modelhub.ai/v1/keys" \\
  -H "Authorization: Bearer SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"permissions": ["chat", "completions"], "expires_in": "24h"}'

# 3. 모델 추론
curl -X POST "https://api.modelhub.ai/v1/chat/completions" \\
  -H "Authorization: Bearer API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${accessPass.modelId}",
    "messages": [{"role": "user", "content": "안녕하세요!"}]
  }'`
  };

  const handleGenerateSession = () => {
    // Simulate session generation
    const token = 'sess_' + Math.random().toString(36).substr(2, 9);
    setSessionToken(token);
    setTokenExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatExpiry = (date) => {
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    return `${hours}시간`;
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto p-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">구매 완료!</h1>
        <p className="text-gray-600">모델 라이선스가 성공적으로 구매되었습니다</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <span className="text-sm text-gray-600">트랜잭션:</span>
          <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
            <span className="font-mono">{txId || '0xabc123...'}</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="text-sm text-gray-600">네트워크:</span>
          <span className="text-sm font-medium text-purple-600">Solana</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Access Pass Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Access Pass</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=100" 
                alt={accessPass.modelName}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{accessPass.modelName}</h3>
                <p className="text-sm text-gray-600">{accessPass.plan} 플랜</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-blue-800">만료</div>
                <div className="text-xs text-blue-700">{formatExpiry(accessPass.expiresAt)}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-green-800">잔여 쿼터</div>
                <div className="text-xs text-green-700">{(accessPass.remainingQuota / 1000).toFixed(0)}K 토큰</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">지원 리전</span>
              </div>
              <div className="flex space-x-2">
                {accessPass.regions.map(region => (
                  <span key={region} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {region}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGenerateSession}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              세션 발급
            </button>
            
            {sessionToken && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">세션 토큰</span>
                  <button
                    onClick={() => copyToClipboard(sessionToken)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <code className="text-xs text-green-700 block mt-1 break-all">{sessionToken}</code>
                <div className="text-xs text-green-600 mt-1">
                  만료: {tokenExpiry && formatExpiry(tokenExpiry)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Development Snippets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">개발용 스니펫</h2>
          
          {/* Language Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
            {Object.keys(codeSnippets).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === lang
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang === 'typescript' ? 'TypeScript' : lang === 'python' ? 'Python' : 'cURL'}
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(codeSnippets[activeTab])}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            위 코드는 세션 발급부터 API 호출까지의 전체 과정을 보여줍니다.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <Link
          to={`/playground?model=${accessPass.modelId}&session=${sessionToken}`}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Play className="h-5 w-5" />
          <span>플레이그라운드 열기</span>
        </Link>
        <Link
          to="/billing"
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <Settings className="h-5 w-5" />
          <span>API 콘솔로 이동</span>
        </Link>
      </div>
    </div>
  );
};