import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Database,
  Plus,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { cachedFetch } from '../utils/apiCache';
import { resolveApiUrl } from '../config/api';
import { convertSolToLamports, formatLamports } from '../utils/currency';
import { MODEL_DEFAULT_THUMBNAIL } from '../utils/modelTransformers';

const tabs = [
  { id: 'models', name: '내 모델', icon: Bot },
  { id: 'datasets', name: '내 데이터셋', icon: Database },
];

const extractApiItems = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.response)) {
    return data.response;
  }

  if (data?.response && typeof data.response === 'object') {
    return [data.response];
  }

  const nestedWithResponse = Object.values(data || {}).find(
    (value) => value && typeof value === 'object' && Array.isArray(value.response)
  );

  if (nestedWithResponse) {
    return nestedWithResponse.response;
  }

  const firstArray = Object.values(data || {}).find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
};


const normalizeUploaderId = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const [localPart] = trimmed.split('@');
  return (localPart || trimmed).toLowerCase();
};

const determineResourceType = (resource) => {
  const candidates = [
    resource?.resourceType,
    resource?.type,
    resource?.assetType,
    resource?.category,
    resource?.categoryName,
    resource?.modality,
  ]
    .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
    .filter(Boolean);

  if (candidates.some((value) => value.includes('dataset') || value.includes('data'))) {
    return 'dataset';
  }

  if (candidates.some((value) => value.includes('model'))) {
    return 'model';
  }

  return 'model';
};

const extractPricingAmount = (pricing) => {
  if (!pricing) return 0;
  if (typeof pricing === 'number') {
    return convertSolToLamports(pricing);
  }

  if (Array.isArray(pricing)) {
    const plan = pricing.find((item) => typeof item?.price === 'number' || typeof item?.amount === 'number');
    if (plan) {
      const value = typeof plan.price === 'number' ? plan.price : plan.amount;
      return convertSolToLamports(value);
    }
    return 0;
  }

  const amount =
    typeof pricing.amount === 'number'
      ? pricing.amount
      : typeof pricing.price === 'number'
        ? pricing.price
        : typeof pricing.defaultPrice === 'number'
          ? pricing.defaultPrice
          : 0;

  return convertSolToLamports(amount);
};

const parseDateValue = (value) => {
  if (!value) return '-';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '-' : value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().split('T')[0];
  }

  return '-';
};

const normalizeResource = (resource) => {
  const type = determineResourceType(resource);
  const uploaderRaw = resource?.uploader || resource?.creator || '';
  const uploaderId = normalizeUploaderId(resource?.uploaderId || uploaderRaw);

  const revenue =
    typeof resource?.revenue === 'number'
      ? resource.revenue
      : typeof resource?.totalRevenue === 'number'
        ? resource.totalRevenue
        : extractPricingAmount(resource?.pricing);

  const downloads =
    typeof resource?.downloads === 'number'
      ? resource.downloads
      : typeof resource?.totalDownloads === 'number'
        ? resource.totalDownloads
        : typeof resource?.downloadCount === 'number'
          ? resource.downloadCount
          : typeof resource?.purchases === 'number'
            ? resource.purchases
            : 0;

  const ratingValue =
    typeof resource?.rating === 'number'
      ? resource.rating
      : typeof resource?.averageRating === 'number'
        ? resource.averageRating
        : typeof resource?.score === 'number'
          ? resource.score
          : null;

  const createdAtRaw =
    resource?.createdAt || resource?.created_at || resource?.created_at || resource?.publishedAt || resource?.releaseDate;

  return {
    id: resource?.id?.toString() || Math.random().toString(36).slice(2),
    name: resource?.name || resource?.title || '이름 미정',
    status:
      resource?.status ||
      resource?.publicationStatus ||
      resource?.state ||
      resource?.visibility ||
      (type === 'dataset' ? '검토중' : '확인중'),
    sales:
      typeof resource?.sales === 'number'
        ? resource.sales
        : typeof resource?.totalSales === 'number'
          ? resource.totalSales
          : typeof resource?.salesCount === 'number'
            ? resource.salesCount
            : 0,
    revenue,
    rating: ratingValue,
    downloads,
    createdAt: parseDateValue(createdAtRaw),
    thumbnail:
      resource?.thumbnail ||
      resource?.thumbnailUrl ||
      resource?.thumbnailURL ||
      resource?.image ||
      resource?.coverImage ||
      resource?.coverUrl ||
      resource?.coverURL ||
      MODEL_DEFAULT_THUMBNAIL,
    type,
    uploader: typeof uploaderRaw === 'string' ? uploaderRaw : '',
    uploaderId,
  };
};

export const Personal = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [datasetFile, setDatasetFile] = useState(null);
  const [datasetStatus, setDatasetStatus] = useState('');
  const [myModels, setMyModels] = useState([]);
  const [myDatasets, setMyDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const datasetFileInputRef = useRef(null);

  const uploaderId = useMemo(() => normalizeUploaderId(user?.email || ''), [user?.email]);

  const [datasetForm, setDatasetForm] = useState({
    name: '',
    category: '대화',
    description: '',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      if (!uploaderId) {
        if (isMounted) {
          setMyModels([]);
          setMyDatasets([]);
          setIsLoading(false);
          setFetchError(null);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setFetchError(null);
        }

        const apiUrl = resolveApiUrl('/api/models');
        const data = await cachedFetch(
          apiUrl,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
          5 * 60 * 1000,
        );

        if (!isMounted) return;

        const normalizedResources = extractApiItems(data).map(normalizeResource);
        const userResources = normalizedResources.filter((item) => item.uploaderId === uploaderId);
        setMyModels(userResources.filter((item) => item.type === 'model'));
        setMyDatasets(userResources.filter((item) => item.type === 'dataset'));
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load personal resources:', error);
          setFetchError(error?.message || '내 리소스를 불러오지 못했습니다.');
          setMyModels([]);
          setMyDatasets([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      isMounted = false;
    };
  }, [uploaderId]);

  const handlePickDatasetFile = () => datasetFileInputRef.current?.click();

  const handleDatasetFileChange = (event) => {
    const file = event.target.files?.[0];
    setDatasetFile(file || null);
    setDatasetStatus('');
  };

  const handleDatasetUpload = () => {
    if (!datasetFile) return;
    setDatasetStatus('데이터셋 업로드는 추후 지원될 예정입니다.');
  };

  const resetModal = () => {
    setShowUploadModal(false);
    setFormStep(1);
    setDatasetFile(null);
    setDatasetStatus('');
    setDatasetForm({
      name: '',
      category: '대화',
      description: '',
    });
  };

  const handleUploadClick = () => {
    if (!user?.wallet?.connected) {
      alert('모델이나 데이터셋을 등록하려면 먼저 지갑을 연결해주세요.');
      return;
    }
    setShowUploadModal(true);
  };

  const renderEmptyState = (message, Icon = Bot) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-blue-50 p-3 mb-4">
        <Icon className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">개인 대시보드</h1>
          <p className="text-gray-600 mt-2">내 모델과 데이터셋을 관리하세요.</p>
        </div>

        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
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

        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">데이터를 불러오는 중 오류가 발생했습니다.</p>
              <p className="mt-1 text-red-600">{fetchError}</p>
            </div>
          </div>
        )}

        {!uploaderId && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            로그인된 사용자의 이메일 정보를 찾을 수 없어 내 리소스를 표시할 수 없습니다.
          </div>
        )}

        {activeTab === 'models' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 truncate">내 모델</h2>
              <button
                onClick={handleUploadClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>새 업로드</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">내 모델 정보를 불러오는 중...</span>
                  </div>
                </div>
              ) : myModels.length === 0 ? (
                renderEmptyState('등록된 모델이 없습니다. 새로운 모델을 업로드해보세요.')
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">모델</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수익</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">다운로드</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myModels.map((model) => (
                      <tr key={model.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={model.thumbnail}
                              alt={model.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(event) => {
                                event.currentTarget.src = MODEL_DEFAULT_THUMBNAIL;
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{model.name}</div>
                              <div className="text-xs text-gray-500">{model.uploader || uploaderId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              model.status === '활성'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {model.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{model.sales}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatLamports(model.revenue)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-900">{model.rating ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{model.downloads}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{model.createdAt}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link
                              to={`/model/${model.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              보기
                            </Link>
                            <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">편집</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">내 데이터셋</h2>
              <button
                onClick={handleUploadClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>새 업로드</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm">내 데이터셋 정보를 불러오는 중...</span>
                  </div>
                </div>
              ) : myDatasets.length === 0 ? (
                renderEmptyState('등록된 데이터셋이 없습니다. 새로운 데이터셋을 업로드해보세요.', Database)
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">데이터셋</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수익</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">다운로드</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myDatasets.map((dataset) => (
                      <tr key={dataset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={dataset.thumbnail}
                              alt={dataset.name}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(event) => {
                                event.currentTarget.src = MODEL_DEFAULT_THUMBNAIL;
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                              <div className="text-xs text-gray-500">{dataset.uploader || uploaderId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dataset.status === '활성'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {dataset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{dataset.sales}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatLamports(dataset.revenue)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-900">{dataset.rating ?? '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{dataset.downloads}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{dataset.createdAt}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link
                              to={`/datasets/${dataset.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              보기
                            </Link>
                            <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">편집</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={resetModal} />
            <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-400">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formStep === 1 ? '업로드 타입 선택' : '데이터셋 등록'}
                </h3>
                <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {formStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => {
                        navigate('/models/register');
                        resetModal();
                      }}
                      className="p-8 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                    >
                      <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">AI 모델</h4>
                      <p className="text-gray-600">LLM, 이미지 생성, 오디오 모델 등</p>
                    </button>

                    <button
                      onClick={() => {
                        setFormStep(2);
                      }}
                      className="p-8 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
                    >
                      <Database className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">데이터셋</h4>
                      <p className="text-gray-600">훈련 데이터, 평가 데이터셋 등</p>
                    </button>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">데이터셋 파일 업로드</h4>
                      <p className="text-gray-600 mb-4">JSON, CSV, Parquet 등 지원</p>
                      <button
                        onClick={handlePickDatasetFile}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        파일 선택
                      </button>
                      <input ref={datasetFileInputRef} type="file" className="hidden" onChange={handleDatasetFileChange} />
                      {datasetFile && <p className="mt-3 text-sm text-gray-700">{datasetFile.name}</p>}
                      {datasetFile && (
                        <button
                          onClick={handleDatasetUpload}
                          className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          IPFS에 업로드
                        </button>
                      )}
                      {datasetStatus && (
                        <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{datasetStatus}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">데이터셋명</label>
                        <input
                          type="text"
                          value={datasetForm.name}
                          onChange={(event) => setDatasetForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="데이터셋 이름을 입력하세요"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                        <select
                          value={datasetForm.category}
                          onChange={(event) => setDatasetForm((prev) => ({ ...prev, category: event.target.value }))}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option>대화</option>
                          <option>이미지</option>
                          <option>코드</option>
                          <option>텍스트</option>
                          <option>음성</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                        <textarea
                          rows={3}
                          value={datasetForm.description}
                          onChange={(event) => setDatasetForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="데이터셋에 대한 설명을 입력하세요"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-6 border-t border-gray-400">
                      <button
                        onClick={() => setFormStep(1)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        뒤로
                      </button>
                      <button
                        onClick={() => {
                          console.log('데이터셋 등록:', datasetForm);
                          resetModal();
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        데이터셋 등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
