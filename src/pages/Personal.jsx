import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Bot, 
  Database, 
  Upload, 
  Eye, 
  Settings, 
  BarChart3, 
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Personal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('model');

  // ====== [업로드 기능 추가] 시작 ======
  const SERVER_URL = import.meta.env?.VITE_SERVER_URL || 'http://3.39.195.161:3001';

  const modelFileInputRef = useRef(null);
  const datasetFileInputRef = useRef(null);

  const [modelFile, setModelFile] = useState(null);
  const [datasetFile, setDatasetFile] = useState(null);

  const [modelStatus, setModelStatus] = useState('');
  const [datasetStatus, setDatasetStatus] = useState('');

  const handlePickModelFile = () => modelFileInputRef.current?.click();
  const handlePickDatasetFile = () => datasetFileInputRef.current?.click();

  const handleModelFileChange = (e) => {
    const f = e.target.files?.[0];
    setModelFile(f || null);
    setModelStatus('');
  };
  const handleDatasetFileChange = (e) => {
    const f = e.target.files?.[0];
    setDatasetFile(f || null);
    setDatasetStatus('');
  };

  const uploadToServer = async (file, setStatus) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setStatus('❌ 파일 크기는 100MB를 초과할 수 없습니다.');
      return;
    }
    setStatus('업로드 중…');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || res.statusText || 'Upload failed');
      }
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Upload failed');
      }

      const { ipfsHash, metadataHash, encryptionKey, gateway } = data.data || {};
      setStatus([
        '✅ 업로드 완료!',
        `IPFS Hash: ${ipfsHash}`,
        `Metadata: ${metadataHash}`,
        `Key: ${encryptionKey}`,
        `Gateway: ${gateway}`
      ].join('\n'));
    } catch (err) {
      setStatus(`❌ 실패: ${err.message}`);
    }
  };

  const handleModelUpload = async () => uploadToServer(modelFile, setModelStatus);
  const handleDatasetUpload = async () => uploadToServer(datasetFile, setDatasetStatus);
  // ====== [업로드 기능 추가] 끝 ======

  const tabs = [
    { id: 'overview', name: '개요', icon: BarChart3 },
    { id: 'models', name: '내 모델', icon: Bot },
    { id: 'datasets', name: '내 데이터셋', icon: Database },
    { id: 'upload', name: '업로드', icon: Plus }
  ];

  const myModels = [
    {
      id: '1',
      name: 'MyLLM v2.0',
      type: 'model',
      status: '활성',
      sales: 156,
      revenue: 3120,
      rating: 4.7,
      downloads: 2340,
      createdAt: '2024-01-15',
      thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    {
      id: '2',
      name: 'CustomVision Pro',
      type: 'model',
      status: '검토중',
      sales: 0,
      revenue: 0,
      rating: 0,
      downloads: 0,
      createdAt: '2024-01-20',
      thumbnail: 'https://images.pexels.com/photos/6153354/pexels-photo-6153354.jpeg?auto=compress&cs=tinysrgb&w=100'
    }
  ];

  const myDatasets = [
    {
      id: '1',
      name: 'Korean Chat Dataset v3',
      type: 'dataset',
      status: '활성',
      sales: 89,
      revenue: 4450,
      rating: 4.9,
      downloads: 1250,
      createdAt: '2024-01-10',
      thumbnail: 'https://images.pexels.com/photos/8728380/pexels-photo-8728380.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    {
      id: '2',
      name: 'Medical Images Dataset',
      type: 'dataset',
      status: '활성',
      sales: 23,
      revenue: 4600,
      rating: 4.8,
      downloads: 450,
      createdAt: '2024-01-05',
      thumbnail: 'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=100'
    }
  ];

  const allItems = [...myModels, ...myDatasets];
  const totalRevenue = allItems.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = allItems.reduce((sum, item) => sum + item.sales, 0);
  const totalDownloads = allItems.reduce((sum, item) => sum + item.downloads, 0);
  const avgRating = allItems.filter(item => item.rating > 0).reduce((sum, item, _, arr) => sum + item.rating / arr.length, 0);

  const recentUsers = [
    { id: '1', name: '김개발자', email: 'dev@company.com', purchasedItem: 'MyLLM v2.0', amount: 20, date: '2시간 전' },
    { id: '2', name: '이연구원', email: 'research@lab.com', purchasedItem: 'Korean Chat Dataset v3', amount: 50, date: '5시간 전' },
    { id: '3', name: '박분석가', email: 'analyst@corp.com', purchasedItem: 'Medical Images Dataset', amount: 200, date: '1일 전' }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">개인 대시보드</h1>
          <p className="text-gray-600 mt-2">내 모델과 데이터셋을 관리하고 수익을 확인하세요</p>
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 수익</p>
                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+12% vs 지난달</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 판매</p>
                    <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                    <p className="text-sm text-blue-600 mt-1">+8% vs 지난달</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 다운로드</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()}</p>
                    <p className="text-sm text-purple-600 mt-1">+15% vs 지난달</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">평균 평점</p>
                    <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    <p className="text-sm text-yellow-600 mt-1">+0.2 vs 지난달</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 수익</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">수익 차트 (Recharts 구현 예정)</p>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 구매자</h3>
                <div className="space-y-4">
                  {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-600">{user.purchasedItem}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">${user.amount}</div>
                        <div className="text-xs text-gray-500">{user.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 모델</h2>
              <button
                onClick={() => {
                  setUploadType('model');
                  setShowUploadModal(true);
                }}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수익</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myModels.map(model => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={model.thumbnail} alt={model.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{model.name}</div>
                            <div className="text-sm text-gray-500">{model.createdAt}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          model.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {model.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{model.sales}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${model.revenue}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-900">{model.rating || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link to={`/model/${model.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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

        {/* Datasets Tab */}
        {activeTab === 'datasets' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 데이터셋</h2>
              <button
                onClick={() => {
                  setUploadType('dataset');
                  setShowUploadModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>새 데이터셋</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">데이터셋</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수익</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {myDatasets.map(dataset => (
                    <tr key={dataset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={dataset.thumbnail} alt={dataset.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                            <div className="text-sm text-gray-500">{dataset.createdAt}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dataset.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dataset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{dataset.sales}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${dataset.revenue}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-900">{dataset.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            보기
                          </button>
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

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bot className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">모델 업로드</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors mb-6">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">모델 파일 업로드</h4>
                <p className="text-gray-600 mb-4">GGUF, PyTorch, ONNX 등 지원</p>

                {/* ====== [업로드 기능 추가] 파일 선택 버튼 & 숨김 input ====== */}
                <button
                  onClick={handlePickModelFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  파일 선택
                </button>
                <input
                  ref={modelFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleModelFileChange}
                />
                {modelFile && (
                  <p className="mt-3 text-sm text-gray-700">{modelFile.name}</p>
                )}
              </div>

              {/* 기존 폼 유지 */}
              <div className="space-y-4">
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

                {/* ====== [업로드 기능 추가] 업로드 버튼 & 상태 ====== */}
                <button
                  onClick={handleModelUpload}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!modelFile}
                >
                  IPFS에 업로드
                </button>
                {modelStatus && (
                  <pre className="text-xs whitespace-pre-wrap text-gray-700">{modelStatus}</pre>
                )}

                {/* 기존 버튼 (모델 등록) 유지 */}
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  모델 등록
                </button>
              </div>
            </div>

            {/* Dataset Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Database className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">데이터셋 업로드</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors mb-6">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">데이터셋 파일 업로드</h4>
                <p className="text-gray-600 mb-4">JSON, CSV, Parquet 등 지원</p>

                {/* ====== [업로드 기능 추가] 파일 선택 버튼 & 숨김 input ====== */}
                <button
                  onClick={handlePickDatasetFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  파일 선택
                </button>
                <input
                  ref={datasetFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleDatasetFileChange}
                />
                {datasetFile && (
                  <p className="mt-3 text-sm text-gray-700">{datasetFile.name}</p>
                )}
              </div>

              {/* 기존 폼 유지 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">데이터셋명</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="데이터셋 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option>대화</option>
                    <option>이미지</option>
                    <option>코드</option>
                    <option>텍스트</option>
                    <option>음성</option>
                  </select>
                </div>

                {/* ====== [업로드 기능 추가] 업로드 버튼 & 상태 ====== */}
                <button
                  onClick={handleDatasetUpload}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!datasetFile}
                >
                  IPFS에 업로드
                </button>
                {datasetStatus && (
                  <pre className="text-xs whitespace-pre-wrap text-gray-700">{datasetStatus}</pre>
                )}

                {/* 기존 버튼 (데이터셋 등록) 유지 */}
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  데이터셋 등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowUploadModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {uploadType === 'model' ? '모델' : '데이터셋'} 업로드
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">파일을 드래그하거나 클릭하여 선택</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  업로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
