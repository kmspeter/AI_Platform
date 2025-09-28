import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { cachedFetch, apiCache } from '../utils/apiCache';
import { FilterBar } from '../components/market/FilterBar';
import { ModelCard } from '../components/market/ModelCard';
import { ComparisonBar } from '../components/market/ComparisonBar';
import { ComparisonOverlay } from '../components/market/ComparisonOverlay';

// API 서비스 함수
const apiService = {
  // 환경변수 기반 baseURL 설정
  baseURL: '',
  
  async fetchModels(forceRefresh = false) {
    try {
      // 환경에 따른 API URL 생성
      const apiUrl = import.meta.env.NODE_ENV === 'development' 
        ? `/api/models`  // 개발환경: 프록시 사용
        : `${this.baseURL}/api/models`;  // 프로덕션: 직접 호출
      
      console.log('Environment:', import.meta.env.NODE_ENV);
      console.log('Base URL:', this.baseURL);
      console.log('API 요청 URL:', apiUrl);
            
      const data = await cachedFetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        forceRefresh
      }, 5 * 60 * 1000); // 5분 캐시
      
      console.log('API Response:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('서버 응답이 배열 형태가 아닙니다.');
      }
      
      return data.map(model => this.transformModel(model));
    } catch (error) {
      console.error('Failed to fetch models:', error);
      
      // 네트워크 에러 처리
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`네트워크 연결을 확인해주세요. API 서버(${this.baseURL})에 접근할 수 없습니다.`);
      }
      
      throw error;
    }
  },
  
  transformModel(apiModel) {
    try {
      console.log('Transforming model:', apiModel);
      
      // API 응답을 프론트엔드 형식으로 변환
      let transformedMetrics = {};
      
      if (apiModel.metrics) {
        if (typeof apiModel.metrics === 'object') {
          // metrics가 객체인 경우 (일반적인 경우)
          Object.keys(apiModel.metrics).forEach(key => {
            if (key === 'raw') {
              // raw 필드가 있는 경우 파싱 시도
              try {
                const rawMetrics = JSON.parse(apiModel.metrics.raw);
                if (Array.isArray(rawMetrics)) {
                  rawMetrics.forEach(metric => {
                    if (metric && metric.code && metric.value !== undefined) {
                      transformedMetrics[metric.code] = parseFloat(metric.value) || 0;
                    }
                  });
                }
              } catch (e) {
                console.warn('Failed to parse raw metrics:', apiModel.metrics.raw, e);
              }
            } else {
              // 일반 메트릭 필드
              transformedMetrics[key] = parseFloat(apiModel.metrics[key]) || 0;
            }
          });
        } else if (typeof apiModel.metrics === 'string') {
          // metrics가 문자열인 경우
          try {
            const parsedMetrics = JSON.parse(apiModel.metrics);
            if (Array.isArray(parsedMetrics)) {
              parsedMetrics.forEach(metric => {
                if (metric && metric.code && metric.value !== undefined) {
                  transformedMetrics[metric.code] = parseFloat(metric.value) || 0;
                }
              });
            }
          } catch (e) {
            console.warn('Failed to parse metrics string:', apiModel.metrics, e);
          }
        }
      }
      
      const transformed = {
        id: apiModel.id?.toString() || Math.random().toString(36).substr(2, 9),
        name: apiModel.name || 'Unknown Model',
        creator: apiModel.uploader || 'Unknown Creator',
        modality: apiModel.modality || 'text',
        license: apiModel.license || 'unknown',
        pricing: {
          type: apiModel.priceStandard > 0 ? 'paid' : 'free',
          amount: parseFloat(apiModel.priceStandard) || 0,
          currency: apiModel.currency || 'USDC'
        },
        metrics: transformedMetrics,
        downloads: Math.floor(Math.random() * 10000), // API에 없는 데이터는 임시값
        tags: [], // API에 없는 데이터는 빈 배열
        description: `${apiModel.name || 'Unknown Model'} - ${apiModel.modality || 'AI'} 모델입니다.`,
      };
      
      console.log('Transformed model:', transformed);
      return transformed;
      
    } catch (error) {
      console.error('Error transforming model:', apiModel, error);
      // 기본값으로 fallback
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Error Model',
        creator: 'Unknown',
        modality: 'text',
        license: 'unknown',
        pricing: { type: 'free', amount: 0, currency: 'USDC' },
        metrics: {},
        downloads: 0,
        tags: [],
        description: '모델 정보를 불러오는 중 오류가 발생했습니다.',
      };
    }
  }
};

export const Market = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    modality: [],
    license: [],
    priceRange: [0, 1000],
    minPerformance: 0
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [comparison, setComparison] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // 새로고침 함수
  const refreshModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedModels = await apiService.fetchModels(true); // 강제 새로고침
      console.log('Refreshed models:', fetchedModels);
      setModels(fetchedModels);
    } catch (err) {
      console.error('Error refreshing models:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // API에서 모델 데이터 로드
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedModels = await apiService.fetchModels();
        console.log('Loaded models:', fetchedModels);
        setModels(fetchedModels);
      } catch (err) {
        console.error('Error loading models:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // 검색 필터
      if (filters.search && 
          !model.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !model.creator.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // 모달리티 필터
      if (filters.modality.length > 0 && !filters.modality.includes(model.modality)) {
        return false;
      }
      
      // 라이센스 필터
      if (filters.license.length > 0 && !filters.license.includes(model.license)) {
        return false;
      }
      
      // 가격 범위 필터
      if (model.pricing.type === 'paid' && model.pricing.amount > filters.priceRange[1]) {
        return false;
      }
      
      // 성능 필터
      const metricValues = Object.values(model.metrics);
      const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 0;
      if (maxMetric < filters.minPerformance) {
        return false;
      }
      
      return true;
    });
  }, [models, filters]);

  const handleAddToComparison = (model) => {
    const existingIndex = comparison.findIndex(item => item.model.id === model.id);
    if (existingIndex >= 0) {
      setComparison(comparison.filter(item => item.model.id !== model.id));
    } else if (comparison.filter(item => item.selected).length < 3) {
      setComparison([...comparison, { model, selected: true }]);
    }
  };

  const handleRemoveFromComparison = (modelId) => {
    setComparison(comparison.filter(item => item.model.id !== modelId));
  };

  const isModelInComparison = (modelId) => {
    return comparison.some(item => item.model.id === modelId && item.selected);
  };

  const handleCompare = () => {
    setShowComparison(true);
  };

  const handleRetry = () => {
    const loadModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedModels = await apiService.fetchModels();
        setModels(fetchedModels);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">모델 데이터를 불러오는 중...</p>
          <p className="text-xs text-gray-400 mt-1">
            환경: {import.meta.env.NODE_ENV} | 서버: {apiService.baseURL}
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-xs text-gray-400 mb-4">
            <div>환경: {import.meta.env.NODE_ENV}</div>
            <div>API 서버: {apiService.baseURL}</div>
          </div>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        showAdvanced={showAdvanced}
      />

      <div className="flex">
        {/* Advanced Filters Sidebar */}
        {showAdvanced && (
          <div className="w-80 bg-white border-r border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">상세 필터</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  모델 크기
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                  <option>전체</option>
                  <option>7B 미만</option>
                  <option>7B-13B</option>
                  <option>13B-70B</option>
                  <option>70B 이상</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  포맷
                </label>
                <div className="space-y-2">
                  {['GGUF', 'FP16', 'ONNX'].map(format => (
                    <label key={format} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  스토리지
                </label>
                <div className="space-y-2">
                  {['IPFS', 'Arweave'].map(storage => (
                    <label key={storage} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">{storage}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  호환 GPU
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                  <option>전체</option>
                  <option>RTX 3090</option>
                  <option>RTX 4090</option>
                  <option>A100</option>
                  <option>H100</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  데이터셋 기준 성능
                </label>
                <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                  <option>전체</option>
                  <option>MMLU 기준</option>
                  <option>HellaSwag 기준</option>
                  <option>ARC 기준</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">AI 모델 마켓</h1>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-600">{filteredModels.length}개의 모델이 있습니다</p>
              <button
                onClick={refreshModels}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                새로고침
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-20">
            {filteredModels.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onAddToComparison={handleAddToComparison}
                isComparing={isModelInComparison(model.id)}
              />
            ))}
          </div>

          {filteredModels.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-4">조건에 맞는 모델이 없습니다</p>
              <button
                onClick={() => setFilters({
                  search: '',
                  modality: [],
                  license: [],
                  priceRange: [0, 1000],
                  minPerformance: 0
                })}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      <ComparisonBar
        items={comparison}
        onRemove={handleRemoveFromComparison}
        onCompare={handleCompare}
      />

      {showComparison && (
        <ComparisonOverlay
          models={comparison.filter(item => item.selected).map(item => item.model)}
          onClose={() => setShowComparison(false)}
          onRemove={handleRemoveFromComparison}
        />
      )}
    </div>
  );
};