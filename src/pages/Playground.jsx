import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Copy, Play, Trash2, RefreshCw } from 'lucide-react';

// 배포용 API 엔드포인트 (ngrok 또는 고정 도메인)
const API_BASE = 'https://8459f05797f9.ngrok-free.app';

export const Playground = () => {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState('general');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [systemPrompt, setSystemPrompt] = useState('도움이 되는 AI 어시스턴트입니다.');
  const [sessionId] = useState(`session-${Date.now()}`);
  const [totalCost, setTotalCost] = useState(0);
  const messagesEndRef = useRef(null);

  const presets = [
    { id: 'general', name: '일반 대화', systemPrompt: '도움이 되는 AI 어시스턴트입니다.' },
    { id: 'coding', name: '코딩', systemPrompt: '코딩과 프로그래밍에 특화된 어시스턴트입니다. 코드는 명확하고 잘 설명되어야 합니다.' },
    { id: 'translation', name: '한-영 번역', systemPrompt: '한국어와 영어 번역 전문가입니다. 정확하고 자연스러운 번역을 제공합니다.' },
    { id: 'creative', name: '창의적 글쓰기', systemPrompt: '창의적이고 흥미로운 콘텐츠를 작성하는 전문가입니다.' }
  ];

  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePresetChange = (presetId) => {
    setPreset(presetId);
    const selectedPreset = presets.find(p => p.id === presetId);
    if (selectedPreset) {
      setSystemPrompt(selectedPreset.systemPrompt);
    }
  };

  const buildMessages = () => {
    const msgs = [];
    if (systemPrompt.trim()) {
      msgs.push({ role: 'system', content: systemPrompt });
    }
    messages.forEach(msg => {
      if (msg.role !== 'system') {
        msgs.push({ role: msg.role, content: msg.content });
      }
    });
    msgs.push({ role: 'user', content: prompt });
    return msgs;
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = { role: 'user', content: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const requestBody = {
        model: model,
        messages: buildMessages(),
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false,
        session_id: sessionId,
        user_id: 'playground-user'
      };

      const response = await fetch(`${API_BASE}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        metadata: {
          model: data.model,
          provider: data.provider,
          tokens: data.usage,
          cost: data.cost
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTotalCost(prev => prev + (data.cost?.total_cost || 0));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `오류가 발생했습니다: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const clearMessages = () => {
    setMessages([]);
    setTotalCost(0);
  };

  const exportToCurl = () => {
    const curlCommand = `curl -X POST "${API_BASE}/api/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "system", "content": "${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"},
      {"role": "user", "content": "${prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}
    ],
    "temperature": ${temperature},
    "max_tokens": ${maxTokens},
    "session_id": "${sessionId}",
    "user_id": "playground-user"
  }'`;
    
    navigator.clipboard.writeText(curlCommand);
    alert('cURL 명령어가 클립보드에 복사되었습니다!');
  };

  const exportToJavaScript = () => {
    const jsCode = `const response = await fetch('${API_BASE}/api/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '${model}',
    messages: [
      { role: 'system', content: '${systemPrompt.replace(/'/g, "\\'")}' },
      { role: 'user', content: '${prompt.replace(/'/g, "\\'")}' }
    ],
    temperature: ${temperature},
    max_tokens: ${maxTokens},
    session_id: '${sessionId}',
    user_id: 'playground-user'
  })
});

const data = await response.json();
console.log(data.content);`;
    
    navigator.clipboard.writeText(jsCode);
    alert('JavaScript 코드가 클립보드에 복사되었습니다!');
  };

  const exportToPython = () => {
    const pyCode = `import requests

response = requests.post(
    '${API_BASE}/api/chat/completions',
    headers={'Content-Type': 'application/json'},
    json={
        'model': '${model}',
        'messages': [
            {'role': 'system', 'content': '${systemPrompt.replace(/'/g, "\\'")}'},
            {'role': 'user', 'content': '${prompt.replace(/'/g, "\\'")}'}
        ],
        'temperature': ${temperature},
        'max_tokens': ${maxTokens},
        'session_id': '${sessionId}',
        'user_id': 'playground-user'
    }
)

data = response.json()
print(data['content'])`;
    
    navigator.clipboard.writeText(pyCode);
    alert('Python 코드가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">AI Playground</h1>
            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-1.5"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button 
              onClick={clearMessages}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>초기화</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>모델: {models.find(m => m.id === model)?.name}</span>
            <span>•</span>
            <span>세션: {sessionId.slice(-8)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">메시지를 입력하여 대화를 시작하세요</p>
                  <p className="text-gray-400 text-sm">선택한 AI 모델이 응답을 생성합니다</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-50 border border-blue-100'
                        : msg.isError
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-700">
                        {msg.role === 'user' ? '사용자' : msg.metadata?.model || 'AI'}
                      </div>
                      {msg.timestamp && (
                        <div className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString('ko-KR')}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.metadata && (
                      <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                        >
                          <Copy className="h-4 w-4" />
                          <span>복사</span>
                        </button>
                        <span className="text-xs text-gray-500">
                          토큰: {msg.metadata.tokens?.total_tokens || 0}
                        </span>
                        <span className="text-xs text-gray-500">
                          비용: ${msg.metadata.cost?.total_cost?.toFixed(6) || '0.000000'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {msg.metadata.provider}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center space-x-3">
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-gray-600">AI가 응답을 생성하고 있습니다...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  rows={3}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm h-fit"
                >
                  <Send className="h-5 w-5" />
                  <span>{loading ? '생성 중...' : '전송'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">설정</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모델
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 토큰: {maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span>4000</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  온도: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>정확</span>
                  <span>창의적</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시스템 프롬프트
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="시스템 메시지를 입력하세요..."
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">비용/사용량</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>이번 세션:</span>
                  <span className="font-medium">${totalCost.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>총 메시지:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-900 mb-3">코드 내보내기</h4>
              <div className="space-y-2">
                <button
                  onClick={exportToCurl}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  cURL로 복사
                </button>
                <button
                  onClick={exportToJavaScript}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  JavaScript로 복사
                </button>
                <button
                  onClick={exportToPython}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  Python으로 복사
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
