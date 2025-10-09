import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
  ExternalLink,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateBillingData } from '../utils/mockData';

export const Billing = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showBudgetDrawer, setShowBudgetDrawer] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [chartView, setChartView] = useState('tokens');
  const [modelFilter, setModelFilter] = useState('all');
  const [chartType, setChartType] = useState('area');

  const billingData = useMemo(() => generateBillingData(selectedPeriod, modelFilter), [selectedPeriod, modelFilter]);
  const { kpiData, chartData, invoices } = billingData;

  const iconMap = {
    TrendingUp,
    DollarSign,
    Clock,
    AlertTriangle
  };

  const periods = [
    { value: '7d', label: '7일' },
    { value: '30d', label: '30일' },
    { value: '90d', label: '90일' },
    { value: '1y', label: '1년' }
  ];

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
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                    <p className={`text-sm mt-1 ${kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change} vs 이전 기간
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
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="dall-e-3">DALL-E 3</option>
                <option value="llama-2">Llama 2</option>
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
                    tickFormatter={(value) => {
                      if (chartView === 'tokens') return `${(value / 1000).toFixed(0)}K`;
                      if (chartView === 'cost') return `$${value}`;
                      return value;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    formatter={(value) => {
                      if (chartView === 'tokens') return [value.toLocaleString(), '토큰'];
                      if (chartView === 'cost') return [`$${value.toFixed(2)}`, '비용'];
                      return [value.toLocaleString(), '요청'];
                    }}
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
                    tickFormatter={(value) => {
                      if (chartView === 'tokens') return `${(value / 1000).toFixed(0)}K`;
                      if (chartView === 'cost') return `$${value}`;
                      return value;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    formatter={(value) => {
                      if (chartView === 'tokens') return [value.toLocaleString(), '토큰'];
                      if (chartView === 'cost') return [`$${value.toFixed(2)}`, '비용'];
                      return [value.toLocaleString(), '요청'];
                    }}
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
                {invoices.map(invoice => (
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
                ))}
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