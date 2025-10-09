import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Loader2, Play, RefreshCw, Send } from 'lucide-react';

const presets = [
  {
    id: 'general',
    name: '일반 대화',
    description: '도움이 되는 AI 어시스턴트',
    systemPrompt: '당신은 친절하고 유용한 AI 어시스턴트입니다. 간결하고 명확하게 답변하세요.',
    temperature: 0.7,
  },
  {
    id: 'coding',
    name: '코딩',
    description: '코드 작성과 리뷰에 최적화',
    systemPrompt:
      '당신은 능숙한 소프트웨어 엔지니어입니다. 가능한 경우 코드 예제와 함께 단계별로 설명하세요.',
    temperature: 0.2,
  },
  {
    id: 'translation',
    name: '번역',
    description: '자연스러운 한-영 번역',
    systemPrompt:
      '당신은 전문 번역가입니다. 사용자의 요청에 맞게 자연스러운 번역을 제공하세요.',
    temperature: 0.6,
  },
  {
    id: 'analysis',
    name: '데이터 분석',
    description: '긴 텍스트 분석과 요약',
    systemPrompt:
      '당신은 데이터 분석 전문가입니다. 체계적인 단계로 분석하고 핵심만 요약해서 답변하세요.',
    temperature: 0.4,
  },
];

const modelOptions = [
  { value: 'openai/gpt-4-turbo', label: 'OpenAI · GPT-4 Turbo' },
  { value: 'anthropic/claude-3-opus', label: 'Anthropic · Claude 3 Opus' },
  { value: 'google/gemini-pro', label: 'Google · Gemini Pro' },
];

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 4,
  }).format(value ?? 0);

export const Playground = () => {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [model, setModel] = useState(modelOptions[0].value);
  const [temperature, setTemperature] = useState(presets[0].temperature);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [topP, setTopP] = useState(1);
  const [stream, setStream] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(presets[0].systemPrompt);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);
  const [sessionUsage, setSessionUsage] = useState(null);
  const [sessionUsageLoading, setSessionUsageLoading] = useState(false);
  const [sessionUsageError, setSessionUsageError] = useState(null);
  const [dailyUsage, setDailyUsage] = useState([]);
  const [dailyUsageLoading, setDailyUsageLoading] = useState(false);
  const [dailyUsageError, setDailyUsageError] = useState(null);
  const [usageFilters, setUsageFilters] = useState({ provider: '', modelId: '', userId: '' });

  useEffect(() => {
    setSystemPrompt(selectedPreset.systemPrompt);
    setTemperature(selectedPreset.temperature);
  }, [selectedPreset]);

  const requestMessages = useMemo(() => {
    const historyMessages = conversation.map(({ role, content }) => ({ role, content }));
    return [
      ...(systemPrompt.trim()
        ? [
            {
              role: 'system',
              content: systemPrompt.trim(),
            },
          ]
        : []),
      ...historyMessages,
      ...(prompt.trim()
        ? [
            {
              role: 'user',
              content: prompt.trim(),
            },
          ]
        : []),
    ];
  }, [conversation, prompt, systemPrompt]);

  const latestAssistantMessage = useMemo(
    () => [...conversation].reverse().find((message) => message.role === 'assistant'),
    [conversation],
  );

  const aggregatedUsage = useMemo(() => {
    return conversation.reduce(
      (acc, message) => {
        if (message?.usage) {
          acc.prompt += message.usage.prompt_tokens ?? 0;
          acc.completion += message.usage.completion_tokens ?? 0;
          acc.total += message.usage.total_tokens ?? 0;
        }
        if (message?.cost) {
          acc.cost += message.cost.total_cost ?? 0;
        }
        return acc;
      },
      { prompt: 0, completion: 0, total: 0, cost: 0 },
    );
  }, [conversation]);

  const fetchSessionUsage = async (targetSessionId) => {
    if (!targetSessionId) {
      setSessionUsage(null);
      setSessionUsageError(null);
      return;
    }

    setSessionUsageLoading(true);
    setSessionUsageError(null);

    try {
      const response = await fetch(`/api/usage/session/${encodeURIComponent(targetSessionId)}`);
      if (!response.ok) {
        throw new Error('세션 사용량을 불러오지 못했습니다.');
      }

      const data = await response.json();
      setSessionUsage(data);
    } catch (err) {
      setSessionUsage(null);
      setSessionUsageError(err.message);
    } finally {
      setSessionUsageLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionUsage(sessionId.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchDailyUsage = async () => {
    setDailyUsageLoading(true);
    setDailyUsageError(null);

    const params = new URLSearchParams();
    if (usageFilters.provider.trim()) params.set('provider', usageFilters.provider.trim());
    if (usageFilters.modelId.trim()) params.set('model_id', usageFilters.modelId.trim());
    if (usageFilters.userId.trim()) params.set('user_id', usageFilters.userId.trim());

    try {
      const response = await fetch(`/api/usage/daily${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error('일별 사용량을 불러오지 못했습니다.');
      }
      const data = await response.json();
      setDailyUsage(Array.isArray(data) ? data : []);
    } catch (err) {
      setDailyUsage([]);
      setDailyUsageError(err.message);
    } finally {
      setDailyUsageLoading(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = {
      role: 'user',
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };

    const conversationWithUser = [...conversation, userMessage];
    setConversation(conversationWithUser);
    setPrompt('');
    setLoading(true);
    setError(null);

    const body = {
      model,
      messages: [
        ...(systemPrompt.trim()
          ? [
              {
                role: 'system',
                content: systemPrompt.trim(),
              },
            ]
          : []),
        ...conversationWithUser.map(({ role, content }) => ({ role, content })),
      ],
      temperature,
      max_tokens: maxTokens,
      stream,
      session_id: sessionId.trim() || null,
      user_id: userId.trim() || null,
    };

    try {
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const message = errorPayload?.detail?.[0]?.msg || errorPayload?.message || '응답을 생성하지 못했습니다.';
        throw new Error(message);
      }

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.content,
        usage: data.usage,
        cost: data.cost,
        provider: data.provider,
        model: data.model,
        id: data.id,
        createdAt: data.created_at,
      };

      setConversation((prev) => [...prev, assistantMessage]);

      if (sessionId.trim()) {
        fetchSessionUsage(sessionId.trim());
      }
      if (
        dailyUsage.length > 0 ||
        usageFilters.provider ||
        usageFilters.modelId ||
        usageFilters.userId
      ) {
        fetchDailyUsage();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('클립보드 복사 실패', err);
    }
  };

  const exportToCurl = () => {
    const payload = {
      model,
      messages: requestMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
      ...(sessionId.trim() ? { session_id: sessionId.trim() } : {}),
      ...(userId.trim() ? { user_id: userId.trim() } : {}),
    };

    const serialized = JSON.stringify(payload, null, 2).replace(/'/g, "\\'");
    const curlLines = [
      'curl -X POST "https://api.your-domain.com/api/chat/completions"',
      '-H "Content-Type: application/json"',
      '-H "Authorization: Bearer YOUR_API_KEY"',
      `-d '${serialized}'`,
    ];

    copyToClipboard(curlLines.join(' \\\n  '));
  };

  const exportToJavaScript = () => {
    const payload = {
      model,
      messages: requestMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
      ...(sessionId.trim() ? { session_id: sessionId.trim() } : {}),
      ...(userId.trim() ? { user_id: userId.trim() } : {}),
    };

    const code = `const response = await fetch('/api/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)}),
});

if (!response.ok) {
  throw new Error('Failed to create chat completion');
}

const data = await response.json();
console.log(data.content);`;

    copyToClipboard(code);
  };

  const exportToPython = () => {
    const payload = {
      model,
      messages: requestMessages,
      temperature,
      max_tokens: maxTokens,
      stream,
      ...(sessionId.trim() ? { session_id: sessionId.trim() } : {}),
      ...(userId.trim() ? { user_id: userId.trim() } : {}),
    };

    const code = `import requests

url = 'https://api.your-domain.com/api/chat/completions'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
}

payload = ${JSON.stringify(payload, null, 2)}

response = requests.post(url, headers=headers, json=payload)
response.raise_for_status()
data = response.json()
print(data['content'])`;

    copyToClipboard(code);
  };

  return (
    <div className="flex-1 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <span className="text-xs font-medium text-slate-500">프리셋</span>
              <select
                value={selectedPreset.id}
                onChange={(event) => {
                  const nextPreset = presets.find((preset) => preset.id === event.target.value);
                  if (nextPreset) setSelectedPreset(nextPreset);
                }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-xs font-medium text-slate-500">모델</div>
              <div className="text-sm font-semibold text-slate-900">
                {latestAssistantMessage?.model || modelOptions.find((option) => option.value === model)?.label}
              </div>
            </div>
            {latestAssistantMessage?.provider && (
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <div className="text-xs font-medium text-slate-500">프로바이더</div>
                <div className="text-sm font-semibold text-slate-900">{latestAssistantMessage.provider}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div>총 토큰 {aggregatedUsage.total.toLocaleString()}</div>
            <div>총 비용 {formatCurrency(aggregatedUsage.cost)}</div>
            <div className="flex items-center gap-1 text-emerald-600">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              실시간 게이트웨이 연결됨
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-9rem)] flex-col lg:flex-row">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {conversation.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <Play className="mb-4 h-12 w-12 text-slate-300" />
                <p className="text-lg font-semibold">메시지를 입력해 첫 대화를 시작해보세요</p>
                <p className="mt-2 text-sm text-slate-400">
                  시스템 프롬프트와 모델 설정은 OpenAPI 명세에 맞춰 즉시 적용됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversation.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === 'user'
                        ? 'ml-auto max-w-3xl rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white shadow-sm'
                        : 'max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                    }
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{message.role === 'user' ? '사용자' : message.provider || '게이트웨이'}</span>
                      {message.createdAt && (
                        <span>{new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                      {message.content}
                    </p>
                    {message.usage && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-3">
                          <span>입력 {message.usage.prompt_tokens?.toLocaleString()} tokens</span>
                          <span>출력 {message.usage.completion_tokens?.toLocaleString()} tokens</span>
                          <span>총 {message.usage.total_tokens?.toLocaleString()} tokens</span>
                          {message.cost && (
                            <span className="font-medium text-slate-700">
                              비용 {formatCurrency(message.cost.total_cost, message.cost.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {message.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(message.content)}
                        className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        <Copy className="h-3.5 w-3.5" /> 복사
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex flex-col gap-3 lg:flex-row">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="메시지를 입력하세요. 시스템 프롬프트와 이전 대화가 함께 전송됩니다."
                rows={3}
                className="h-full flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex items-end justify-end gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={stream}
                    onChange={(event) => setStream(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  스트리밍
                </label>
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? '생성 중...' : '전송'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="w-full border-t border-slate-200 bg-white lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">요청 설정</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">OpenAPI 3.1</span>
            </div>

            <div className="mt-4 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-600">모델</label>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">세션 ID</label>
                <input
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  placeholder="예: session-1234"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">사용자 ID</label>
                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="선택 입력"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">시스템 프롬프트</label>
                <textarea
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  rows={showAdvanced ? 6 : 3}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>프리셋 설명: {selectedPreset.description}</span>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="font-medium text-blue-600"
                  >
                    {showAdvanced ? '간단히' : '자세히'}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>최대 토큰</span>
                    <span>{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={128}
                    max={4096}
                    step={64}
                    value={maxTokens}
                    onChange={(event) => setMaxTokens(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>온도</span>
                    <span>{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Top-p</span>
                    <span>{topP.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={topP}
                    onChange={(event) => setTopP(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>
              </div>

              <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-700">OpenAPI 요청 미리보기</summary>
                <pre className="mt-3 max-h-60 overflow-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
{JSON.stringify(
  {
    model,
    messages: requestMessages,
    temperature,
    max_tokens: maxTokens,
    stream,
    session_id: sessionId.trim() || null,
    user_id: userId.trim() || null,
  },
  null,
  2,
)}
                </pre>
              </details>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">코드로 내보내기</h4>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={exportToCurl}
                    className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    cURL 명령 복사
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={exportToJavaScript}
                    className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    JavaScript 예제 복사
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={exportToPython}
                    className="inline-flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    Python 예제 복사
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-700">
                <p className="font-semibold">세션 누적 비용</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{formatCurrency(aggregatedUsage.cost)}</p>
                <p className="mt-2 text-xs text-blue-600">
                  빌링 한도 초과 시 게이트웨이에서 경고 메시지를 반환하고 요청은 계속 진행됩니다.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">세션 사용량</h4>
                  <button
                    type="button"
                    onClick={() => fetchSessionUsage(sessionId.trim())}
                    disabled={!sessionId.trim()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 disabled:text-slate-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> 새로고침
                  </button>
                </div>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  {!sessionId.trim() ? (
                    <p>세션 ID를 입력하면 응답 이후 누적 사용량을 확인할 수 있습니다.</p>
                  ) : sessionUsageLoading ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> 불러오는 중...
                    </div>
                  ) : sessionUsageError ? (
                    <p className="text-rose-500">{sessionUsageError}</p>
                  ) : sessionUsage ? (
                    <div className="space-y-1 text-slate-600">
                      <div className="font-semibold text-slate-700">총 비용 {formatCurrency(sessionUsage.total_cost)}</div>
                      <div>요청 수 {sessionUsage.records?.length ?? 0}회</div>
                      <div>토큰 {sessionUsage.totals?.total_tokens?.toLocaleString() || 0}개</div>
                    </div>
                  ) : (
                    <p>사용량 데이터를 불러오지 못했습니다.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">일별 사용량</h4>
                  <button
                    type="button"
                    onClick={fetchDailyUsage}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> 불러오기
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  <input
                    value={usageFilters.provider}
                    onChange={(event) => setUsageFilters((prev) => ({ ...prev, provider: event.target.value }))}
                    placeholder="프로바이더 필터"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    value={usageFilters.modelId}
                    onChange={(event) => setUsageFilters((prev) => ({ ...prev, modelId: event.target.value }))}
                    placeholder="모델 ID 필터"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    value={usageFilters.userId}
                    onChange={(event) => setUsageFilters((prev) => ({ ...prev, userId: event.target.value }))}
                    placeholder="사용자 ID 필터"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {dailyUsageLoading ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> 로딩 중
                    </div>
                  ) : dailyUsageError ? (
                    <div className="px-3 py-4 text-xs text-rose-500">{dailyUsageError}</div>
                  ) : dailyUsage.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-slate-400">사용량 데이터가 없습니다.</div>
                  ) : (
                    <table className="min-w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">날짜</th>
                          <th className="px-3 py-2 font-medium">모델</th>
                          <th className="px-3 py-2 font-medium">토큰</th>
                          <th className="px-3 py-2 font-medium">비용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyUsage.map((usage) => (
                          <tr key={`${usage.date}-${usage.model_id}`} className="border-t border-slate-100 text-slate-600">
                            <td className="px-3 py-2">{usage.date}</td>
                            <td className="px-3 py-2">{usage.model_id}</td>
                            <td className="px-3 py-2">{usage.total_tokens.toLocaleString()}</td>
                            <td className="px-3 py-2">{formatCurrency(usage.total_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
