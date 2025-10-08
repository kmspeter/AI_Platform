import React, { useState } from 'react';
import { Upload, Plus, Eye, Settings, BarChart3, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Creator = () => {
  const [activeTab, setActiveTab] = useState('models');

  const myModels = [
    {
      id: '1',
      name: 'MyLLM v1.0',
      baseVersion: '1.0.0',
      status: '활성',
      sales: 45,
      revenue: '$2,340',
      versions: ['1.0.0', '0.9.1', '0.8.5']
    },
    {
      id: '2',
      name: 'CustomVision',
      baseVersion: '2.1.0',
      status: '검토중',
      sales: 0,
      revenue: '$0',
      versions: ['2.1.0']
    }
  ];

  const tabs = [
    { id: 'models', name: '내 모델', icon: Eye },
    { id: 'upload', name: '새 모델', icon: Plus },
    { id: 'analytics', name: '분석', icon: BarChart3 }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">제작자 콘솔</h1>
          <p className="text-gray-600 mt-2">모델을 업로드하고 관리하세요</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'models' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 모델</h2>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>새 모델</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">모델</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기본 버전</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수익</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myModels.map(model => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{model.name}</div>
                            <div className="text-sm text-gray-500">{model.versions.length} 버전</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.baseVersion}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.sales}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{model.revenue}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          model.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {model.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/model/${model.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            보기
                          </Link>
                          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            편집
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">모델 업로드</h2>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">파일 업로드</h3>
                  <p className="text-gray-600 mb-4">모델 파일을 드래그하거나 클릭하여 선택하세요</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    파일 선택
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">모델명</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="모델 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="모델에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">설정</h2>
              
              <div className="space-y-6">
                {/* Encryption Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">암호화</h3>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">로컬 암호화 (AES-GCM)</span>
                  </label>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">수신자 키</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      placeholder="공개키를 입력하세요"
                    />
                  </div>
                </div>

                {/* License Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">라이선스/가격</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'research', name: '연구용', price: 0 },
                      { id: 'commercial', name: '상업용', price: 50 },
                      { id: 'enterprise', name: '엔터프라이즈', price: 200 }
                    ].map(plan => (
                      <label key={plan.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="license" className="text-blue-600 focus:ring-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{plan.name}</div>
                          <div className="text-sm text-gray-600">
                            {plan.price === 0 ? '무료' : `${plan.price} SOL`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Manifest Preview */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">매니페스트 미리보기</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700">
                    <div>CID: QmX7Y8Z9...</div>
                    <div>해시: 0xabc123...</div>
                    <div>크기: 7.2GB</div>
                    <div>포맷: GGUF</div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 font-medium">검증됨</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">분석</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">총 판매</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-gray-900">$8,240</div>
                <div className="text-sm text-gray-600">총 수익</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-gray-900">4.7</div>
                <div className="text-sm text-gray-600">평균 평점</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-2xl font-bold text-gray-900">89%</div>
                <div className="text-sm text-gray-600">만족도</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 수익</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">차트 영역 (Recharts 구현 예정)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};