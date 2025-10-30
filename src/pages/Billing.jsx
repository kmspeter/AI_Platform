import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  Settings
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts';

const API_BASE = 'https://67a194bab0bb.ngrok-free.app';

const getUserIdFromAuth = (user) => {
  if (typeof window === 'undefined') return '';
  const storedEmail = localStorage.getItem('userEmail') || '';
  const storedName = localStorage.getItem('userName') || '';
  const email = user?.email || storedEmail || '';
  const prefix = email.split('@')[0]?.trim();
  if (prefix) return prefix;
  if (storedName && storedName.trim()) return storedName.trim();
  return '';
};

const PERIOD_OPTIONS = [
  { value: '7d', label: '7일', days: 7 },
  { value: '30d', label: '30일', days: 30 },
  { value: '90d', label: '90일', days: 90 },
  { value: '1y', label: '1년', days: 365 }
];

const getDaysForPeriod = (period) => {
  const found = PERIOD_OPTIONS.find(option => option.value === period);
  return found ? found.days : 30;
};

const formatChange = (current, previous) => {
  if (previous <= 0 || Number.isNaN(previous)) return '-';
  const delta = ((current - previous) / previous) * 100;
  if (!Number.isFinite(delta)) return '-';
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
};

const formatTokenValue = (value) => {
  if (!value) return '0 tokens';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M tokens`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K tokens`;
  }
  return `${value.toLocaleString()} tokens`;
};

const createDeterministicTxHash = (isoDate) => {
  if (!isoDate) return null;
  const normalized = isoDate.replace(/-/g, '').padEnd(12, '0');
  return `0x${normalized.slice(-12)}`;
};

export const Billing = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showBudgetDrawer, setShowBudgetDrawer] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [chartView, setChartView] = useState('tokens');
  const [modelFilter, setModelFilter] = useState('all');
  const [chartType, setChartType] = useState('area');
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState(() => getUserIdFromAuth(user));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    setUserId(getUserIdFromAuth(user));
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!userId) {
      setUsageData([]);
      setError('Google 로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchUsage = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/usage/user/${encodeURIComponent(userId)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload?.detail?.[0]?.msg || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('예상치 못한 응답 형식입니다.');
        }

        setUsageData(data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setUsageData([]);
        setError(err.message || '사용량 데이터를 불러오지 못했습니다.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsage();

    return () => controller.abort();
  }, [userId, refreshKey, authLoading]);

  const handleRefresh = () => {
    if (authLoading || !userId) return;
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

  const availableModels = useMemo(() => {
    const modelsMap = new Map();
    usageData.forEach(entry => {
      if (entry?.model_id) {
        modelsMap.set(entry.model_id, {
          id: entry.model_id,
          provider: entry.provider || '알 수 없음'
        });
      }
    });
    return Array.from(modelsMap.values());
  }, [usageData]);

  useEffect(() => {
    if (modelFilter === 'all') return;
    const exists = availableModels.some(model => model.id === modelFilter);
    if (!exists) {
      setModelFilter('all');
    }
  }, [availableModels, modelFilter]);

  const analytics = useMemo(() => {
    const days = getDaysForPeriod(selectedPeriod);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));

    const normalized = usageData.map(record => {
      const dateObj = record?.date ? new Date(record.date) : null;
      if (dateObj) {
        dateObj.setHours(0, 0, 0, 0);
      }
      return {
        ...record,
        dateObj
      };
    }).filter(record => record.dateObj instanceof Date && !Number.isNaN(record.dateObj.getTime()));

    const filtered = normalized.filter(record => record.dateObj >= startDate && record.dateObj <= now);
    const filteredByModel = modelFilter === 'all'
      ? filtered
      : filtered.filter(record => record.model_id === modelFilter);

    const aggregatedMap = new Map();
    filteredByModel.forEach(record => {
      const isoDate = record.date;
      if (!isoDate) return;
      if (!aggregatedMap.has(isoDate)) {
        aggregatedMap.set(isoDate, {
          tokens: 0,
          cost: 0,
          requests: 0,
          providers: new Set(),
          models: new Set()
        });
      }
      const entry = aggregatedMap.get(isoDate);
      entry.tokens += Number(record.total_tokens || 0);
      entry.cost += Number(record.total_cost || 0);
      entry.requests += Number(record.request_count || 0);
      if (record.provider) entry.providers.add(record.provider);
      if (record.model_id) entry.models.add(record.model_id);
    });

    const aggregatedRecords = Array.from(aggregatedMap.entries()).map(([isoDate, entry]) => {
      const dateObj = new Date(isoDate);
      const dateLabel = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      return {
        isoDate,
        dateObj,
        dateLabel,
        fullDate: dateObj.toLocaleDateString('ko-KR'),
        tokens: entry.tokens,
        cost: entry.cost,
        requests: entry.requests,
        providers: Array.from(entry.providers),
        models: Array.from(entry.models)
      };
    }).sort((a, b) => a.dateObj - b.dateObj);

    const totals = aggregatedRecords.reduce((acc, record) => {
      acc.tokens += record.tokens;
      acc.cost += record.cost;
      acc.requests += record.requests;
      return acc;
    }, { tokens: 0, cost: 0, requests: 0 });

    const averageCostPerRequest = totals.requests > 0 ? totals.cost / totals.requests : 0;

    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - days);
    const previousEnd = new Date(startDate);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousFiltered = normalized.filter(record => record.dateObj >= previousStart && record.dateObj <= previousEnd);
    const previousByModel = modelFilter === 'all'
      ? previousFiltered
      : previousFiltered.filter(record => record.model_id === modelFilter);

    const previousTotals = previousByModel.reduce((acc, record) => {
      acc.tokens += Number(record.total_tokens || 0);
      acc.cost += Number(record.total_cost || 0);
      acc.requests += Number(record.request_count || 0);
      return acc;
    }, { tokens: 0, cost: 0, requests: 0 });

    const previousAverageCost = previousTotals.requests > 0 ? previousTotals.cost / previousTotals.requests : 0;

    const kpiData = [
      {
        title: '총 토큰 사용량',
        value: formatTokenValue(totals.tokens),
        change: formatChange(totals.tokens, previousTotals.tokens),
        icon: 'TrendingUp',
        color: 'text-blue-600'
      },
      {
        title: '총 비용',
        value: `$${totals.cost.toFixed(6)}`,
        change: formatChange(totals.cost, previousTotals.cost),
        icon: 'DollarSign',
        color: 'text-green-600'
      },
      {
        title: '총 요청 수',
        value: totals.requests.toLocaleString(),
        change: formatChange(totals.requests, previousTotals.requests),
        icon: 'Clock',
        color: 'text-purple-600'
      },
      {
        title: '평균 요청당 비용',
        value: `$${averageCostPerRequest.toFixed(6)}`,
        change: formatChange(averageCostPerRequest, previousAverageCost || 0),
        icon: 'AlertTriangle',
        color: 'text-red-600'
      }
    ];

    const chartData = aggregatedRecords.map(record => ({
      date: record.dateLabel,
      tokens: record.tokens,
      cost: Number(record.cost.toFixed(6)),
      requests: record.requests
    }));

    const invoices = aggregatedRecords.slice().reverse().map((record, index) => {
      const status = index === 0 ? '대기중' : '완료';
      return {
        id: `USAGE-${record.isoDate.replace(/-/g, '')}`,
        date: record.fullDate,
        amount: `$${record.cost.toFixed(6)}`,
        status,
        txHash: status === '완료' ? createDeterministicTxHash(record.isoDate) : null
      };
    });

    return { kpiData, chartData, invoices };
  }, [usageData, selectedPeriod, modelFilter]);

  const { kpiData, chartData, invoices } = analytics;

  const iconMap = {
    TrendingUp,
    DollarSign,
    Clock,
    AlertTriangle
  };

  const periods = PERIOD_OPTIONS;

  const formatYAxisTick = (value = 0) => {
    const numeric = typeof value === 'number' ? value : Number(value) || 0;
    if (chartView === 'tokens') {
      if (numeric >= 1000) {
        return `${(numeric / 1000).toFixed(1)}K`;
      }
      return numeric.toLocaleString();
    }
    if (chartView === 'cost') {
      return `$${numeric >= 1 ? numeric.toFixed(2) : numeric.toFixed(6)}`;
    }
    return numeric.toLocaleString();
  };

  const formatTooltipValue = (value = 0) => {
    const numeric = typeof value === 'number' ? value : Number(value) || 0;
    if (chartView === 'tokens') {
      return [numeric.toLocaleString(), '토큰'];
    }
    if (chartView === 'cost') {
      return [`$${numeric >= 1 ? numeric.toFixed(2) : numeric.toFixed(6)}`, '비용'];
    }
    return [numeric.toLocaleString(), '요청'];
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용량/청구</h1>
            <p className="text-gray-600 mt-2">API 사용량과 비용을 확인하세요</p>
          </div>
          <button
            onClick={() => setShowBudgetDrawer(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>예산 설정</span>
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">사용자 ID</span>
            <span className="ml-2 font-mono text-gray-900">
              {userId || '로그인 정보를 확인 중...'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || !userId}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            새로고침
          </button>
          {loading && (
            <span className="text-xs text-gray-500">데이터를 불러오는 중입니다...</span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Period Filter */}
        <div className="mb-8">
          <div className="flex space-x-2">
            {periods.map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => {
            const Icon = iconMap[kpi.icon];
            const changeValue = kpi.change || '-';
            const changeClass = changeValue.startsWith('+')
              ? 'text-green-600'
              : changeValue.startsWith('-')
                ? 'text-red-600'
                : 'text-gray-500';
            const changeText = changeValue === '-' ? '이전 기간 데이터 부족' : `${changeValue} vs 이전 기간`;
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                    <p className={`text-sm mt-1 ${changeClass}`}>
                      {changeText}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${kpi.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage Graph */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">사용량 추이</h2>
            <div className="flex space-x-2">
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">모든 모델</option>
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.id} ({model.provider})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartType === 'area' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                영역
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartType === 'bar' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                막대
              </button>
              <button
                onClick={() => setChartView('tokens')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartView === 'tokens' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                토큰
              </button>
              <button
                onClick={() => setChartView('cost')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartView === 'cost' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                비용
              </button>
              <button
                onClick={() => setChartView('requests')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  chartView === 'requests' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                요청수
              </button>
            </div>
          </div>
          <div className="h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                데이터를 불러오는 중입니다...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                선택한 조건에 대한 사용량 데이터가 없습니다.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickFormatter={formatYAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => formatTooltipValue(value ?? 0)}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartView}
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                      animationDuration={500}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      tickFormatter={formatYAxisTick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => formatTooltipValue(value ?? 0)}
                    />
                    <Bar
                      dataKey={chartView}
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      animationDuration={500}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">인보이스</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>전체 다운로드</span>
            </button>
          </div>

          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">인보이스 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">온체인</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={6}>
                      표시할 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === '완료' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.txHash ? (
                          <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm">
                            <ExternalLink className="h-3 w-3" />
                            <span>보기</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          다운로드
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Drawer */}
      {showBudgetDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowBudgetDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">예산/쿼터 설정</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월 예산 한도: ${budget}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">알림 설정</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">80% 도달 시 알림</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">95% 도달 시 알림</span>
                    </label>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};