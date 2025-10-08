import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cachedFetch } from '../utils/apiCache';
import { resolveApiUrl } from '../config/api';
import {
  extractPricingPlans,
  MODEL_DEFAULT_THUMBNAIL,
  normalizeLicense,
  normalizeMetrics,
  normalizeModality,
  normalizeSampleEntries,
  prepareMetricDisplay,
  getMetricHighlights,
  formatTechnicalSpecs,
  selectDefaultPlan,
} from '../utils/modelTransformers';
import {
  Star,
  Play,
  ShoppingCart,
  Copy,
  Check,
  Shield,
  Bot,
  Loader2,
  AlertCircle
} from 'lucide-react';

const extractModelResponse = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.response)) {
      return data.response;
    }

    if (data.response && typeof data.response === 'object') {
      return [data.response];
    }

    const nestedWithResponse = Object.values(data).find(
      (value) => value && typeof value === 'object' && 'response' in value
    );

    if (nestedWithResponse) {
      const nestedResponse = nestedWithResponse.response;
      if (Array.isArray(nestedResponse)) {
        return nestedResponse;
      }
      if (nestedResponse && typeof nestedResponse === 'object') {
        return [nestedResponse];
      }
    }

    return [data];
  }

  return [];
};

// API 서비스
const modelDetailService = {
  async fetchModel(id, forceRefresh = false) {
    try {
      // 쿼리 파라미터 방식으로 변경
      const apiPath = `/api/models?id=${id}`;
      const apiUrl = resolveApiUrl(apiPath);

      console.log('Model detail API 요청 URL:', apiUrl);

      const data = await cachedFetch(apiUrl, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        forceRefresh
      }, 10 * 60 * 1000);
      
      return this.transformModel(data, id);
    } catch (error) {
      console.error('Failed to fetch model detail:', error);
      throw error;
    }
  },

  transformModel(apiResponse, requestedId) {
    const apiModels = extractModelResponse(apiResponse);
    const targetModel = apiModels.find(model => model.id?.toString() === requestedId?.toString()) || apiModels[0];

    if (!targetModel) {
      throw new Error('요청한 모델을 찾을 수 없습니다.');
    }

    console.log('Raw API model data:', targetModel);
    const normalizedModality = normalizeModality(targetModel.modality);
    const metrics = normalizeMetrics(targetModel.metrics);
    const licenseInfo = normalizeLicense(targetModel.license);
    const pricingPlansRaw = extractPricingPlans(targetModel.pricing);
    const defaultPlan = selectDefaultPlan(pricingPlansRaw);
    const metricDisplay = prepareMetricDisplay(metrics, normalizedModality);
    const metricHighlights = getMetricHighlights(metrics, normalizedModality);
    const samples = normalizeSampleEntries(targetModel, normalizedModality);
    const technicalSpecs = formatTechnicalSpecs(targetModel.technicalSpecs);

    // lineage 데이터 파싱
    let parsedLineage = [];
    if (targetModel.lineage) {
      if (Array.isArray(targetModel.lineage)) {
        parsedLineage = targetModel.lineage;
      } else if (typeof targetModel.lineage === 'string') {
        try {
          const parsed = JSON.parse(targetModel.lineage);
          if (Array.isArray(parsed)) {
            parsedLineage = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse lineage:', targetModel.lineage);
          parsedLineage = [targetModel.lineage];
        }
      } else if (typeof targetModel.lineage === 'object') {
        parsedLineage = Object.values(targetModel.lineage);
      }
    }

    const planOrder = { '연구용': 1, '표준': 2, '엔터프라이즈': 3 };

    const plansToUse = pricingPlansRaw.length > 0 ? pricingPlansRaw : [defaultPlan];
    const pricingPlans = plansToUse
      .map(plan => ({
        ...plan,
        rights: plan.rights && plan.rights.length > 0
          ? plan.rights
          : (licenseInfo.labels.length > 0 ? licenseInfo.labels : ['권한 정보 미제공']),
      }))
      .sort((a, b) => {
        const orderA = planOrder[a.name] || 999;
        const orderB = planOrder[b.name] || 999;
        return orderA - orderB;
      });

    const releaseNotes = Array.isArray(targetModel.releaseNotes)
      ? targetModel.releaseNotes.map((note, index) => {
          if (typeof note === 'string') {
            return {
              id: `release-note-${index}`,
              category: '',
              change: note,
              impact: '',
            };
          }

          return {
            id: note.id || `release-note-${index}`,
            category: note.category || '',
            change: note.change || '',
            impact: note.impact || '',
          };
        })
      : [];

    const hasIntegrityInfo = Boolean(targetModel.cidRoot || targetModel.checksumRoot || targetModel.onchainTx);

    // API 응답을 컴포넌트에서 사용하는 형태로 변환
    return {
      id: targetModel.id?.toString(),
      name: targetModel.name || 'Unknown Model',
      creator: targetModel.uploader || 'Unknown Creator',
      versionName: targetModel.versionName || '1.0.0',
      version: targetModel.versionName || '1.0.0',
      status: targetModel.status || 'PUBLISHED',
      description: targetModel.overview || `${targetModel.name || '이 모델'}에 대한 설명이 제공되지 않았습니다.`,
      thumbnail: targetModel.thumbnail || `${MODEL_DEFAULT_THUMBNAIL}?auto=compress&cs=tinysrgb&w=400`,
      metrics,
      metricDisplay,
      metricHighlights,
      samples,
      lineage: parsedLineage,
      releaseNotes,
      releaseDate: targetModel.releaseDate || '',
      modality: normalizedModality,
      rawModality: targetModel.modality || '',
      license: licenseInfo.primary,
      licenseTags: licenseInfo.labels,
      pricing: {
        plans: pricingPlans,
      },
      technicalSpecs,
      compliance: targetModel.compliance || '',
      integrity: {
        cid: targetModel.cidRoot || '',
        checksum: targetModel.checksumRoot || '',
        txHash: targetModel.onchainTx || '',
        verified: hasIntegrityInfo,
        storage: targetModel.storage || '제공되지 않음',
      },
      reviews: {
        average: 4.8,
        count: 124,
        items: [
          {
            id: 1,
            user: '개발자123',
            rating: 5,
            comment: '매우 뛰어난 성능입니다. 한국어 처리가 특히 인상적이네요.',
            date: '3일 전'
          },
          {
            id: 2,
            user: 'AI연구원',
            rating: 4,
            comment: '연구용으로 사용하기에 충분한 성능을 보여줍니다.',
            date: '1주 전'
          }
        ]
      }
    };
  }
};

export const ModelDetail = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [copiedHash, setCopiedHash] = useState('');

  const getSampleTypeLabel = (type) => {
    switch (type) {
      case 'image':
        return '이미지';
      case 'audio':
        return '오디오';
      case 'text':
      default:
        return '텍스트';
    }
  };

  const isUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

  const formatBillingType = (value) =>
    (value || '')
      .toString()
      .replace(/_/g, ' ');

  const formatNumberWithCommas = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString() : value;
  };

  // 새로고침 함수
  const refreshModel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const modelData = await modelDetailService.fetchModel(id, true); // 강제 새로고침
      console.log('Refreshed model detail:', modelData);
      setModel(modelData);
    } catch (err) {
      console.error('Error refreshing model detail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // API에서 모델 상세 정보 로드
  useEffect(() => {
    let isCancelled = false;

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const modelData = await modelDetailService.fetchModel(id);
        
        if (!isCancelled) {
          console.log('Loaded model detail:', modelData);
          setModel(modelData);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading model detail:', err);
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (model?.pricing?.plans?.length) {
      const availablePlans = model.pricing.plans.map(plan => plan.id);
      if (!selectedPlan || !availablePlans.includes(selectedPlan)) {
        setSelectedPlan(model.pricing.plans[0].id);
      }
    }
  }, [model, selectedPlan]);

  const sections = [
    { id: 'overview', name: '개요' },
    { id: 'pricing', name: '가격/라이선스' },
    { id: 'performance', name: '성능' },
    { id: 'provenance', name: '계보' },
    { id: 'integrity', name: '저장/무결성' },
    { id: 'reviews', name: '후기' }
  ];

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  // 릴리스 노트를 줄바꿈 기준으로 배열로 변환
  // 로딩 상태
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">모델 정보를 불러오는 중...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">모델 정보를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/market"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            마켓으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">모델을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const topMetrics = (Array.isArray(model.metricHighlights) && model.metricHighlights.length > 0
    ? model.metricHighlights.slice(0, 3)
    : (model.metricDisplay || []).slice(0, 3));
  const allMetrics = model.metricDisplay || [];
  const hasAdditionalMetrics = allMetrics.length > topMetrics.length;
  const releaseNotes = Array.isArray(model.releaseNotes) ? model.releaseNotes : [];

  return (
    <div className="flex-1">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={model.thumbnail} 
              alt={model.name}
              className="w-16 h-16 rounded-lg object-cover ring-1 ring-gray-200"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{model.name}</h1>
              <p className="text-lg text-gray-600">by {model.creator}</p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">v{model.versionName}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  model.status === 'PUBLISHED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {model.status}
                </span>
                </div>
                <button
                  onClick={refreshModel}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/playground?model=${id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>체험</span>
            </Link>
            <Link
              to={`/checkout/${id}?plan=${selectedPlan}`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>구매</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-16 z-40">
        <nav className="flex space-x-8">
          {sections.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2 border-b-2 border-transparent hover:border-blue-300 transition-colors"
            >
              {section.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Section */}
        <section id="overview" className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">모델 개요</h2>
              <p className="text-gray-700 mb-8 text-lg leading-relaxed">{model.description}</p>
              
              {/* 샘플 출력 */}
              {model.samples && model.samples.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">샘플 출력</h3>
                  <div className="space-y-4">
                    {model.samples.map((sample, index) => (
                      <div key={sample.id || index} className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                            {getSampleTypeLabel(sample.type)} 샘플
                          </span>
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                        </div>

                        {sample.prompt && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">프롬프트</div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sample.prompt}</p>
                          </div>
                        )}

                        {sample.inputImage && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">입력 이미지</div>
                            {isUrl(sample.inputImage) ? (
                              <img
                                src={sample.inputImage}
                                alt={`입력 이미지 ${index + 1}`}
                                className="w-full rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                                {sample.inputImage}
                              </div>
                            )}
                          </div>
                        )}

                        {sample.outputImage && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">생성 이미지</div>
                            {isUrl(sample.outputImage) ? (
                              <img
                                src={sample.outputImage}
                                alt={`생성 이미지 ${index + 1}`}
                                className="w-full rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                                {sample.outputImage}
                              </div>
                            )}
                          </div>
                        )}

                        {sample.inputAudio && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">입력 오디오</div>
                            {isUrl(sample.inputAudio) ? (
                              <audio controls className="w-full">
                                <source src={sample.inputAudio} />
                                브라우저에서 오디오를 재생할 수 없습니다.
                              </audio>
                            ) : (
                              <div className="px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                                {sample.inputAudio}
                              </div>
                            )}
                          </div>
                        )}

                        {sample.outputAudio && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">출력 오디오</div>
                            {isUrl(sample.outputAudio) ? (
                              <audio controls className="w-full">
                                <source src={sample.outputAudio} />
                                브라우저에서 오디오를 재생할 수 없습니다.
                              </audio>
                            ) : (
                              <div className="px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-600">
                                {sample.outputAudio}
                              </div>
                            )}
                          </div>
                        )}

                        {sample.output && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">출력</div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sample.output}</p>
                          </div>
                        )}

                        {!sample.prompt && !sample.output && typeof sample.raw === 'string' && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sample.raw}</p>
                        )}

                        {sample.raw && typeof sample.raw === 'object' && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer select-none">원본 데이터 보기</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded-lg overflow-x-auto whitespace-pre-wrap text-[11px] text-gray-600">
                              {JSON.stringify(sample.raw, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 릴리스 노트 */}
              {releaseNotes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">릴리스 노트</h3>
                  <div className="space-y-3">
                    {releaseNotes.map((note) => (
                      <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {note.category && (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                {note.category}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900">{note.change}</span>
                          </div>
                        </div>
                        {note.impact && (
                          <p className="text-sm text-gray-600 mt-1">{note.impact}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {model.releaseDate && (
                    <p className="text-sm text-gray-500 mt-4">릴리스 일자: {model.releaseDate}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div id="pricing" className="bg-white rounded-xl border border-gray-200 p-6 h-fit shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">가격 플랜</h3>
                <div className="space-y-4">
                  {model.pricing.plans.map(plan => (
                    <label key={plan.id} className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{plan.name}</div>
                        <div className="text-sm text-gray-600 mb-3">
                          {plan.price === 0 ? '무료' : `${plan.price} SOL`}
                        </div>
                        {plan.billingType && (
                          <div className="text-xs text-gray-500 mb-2">과금 방식: {formatBillingType(plan.billingType)}</div>
                        )}
                        {plan.rights.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mb-3">
                            {plan.rights.map(right => (
                              <span key={right} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium text-center">
                                {right}
                              </span>
                            ))}
                          </div>
                        )}
                        {(plan.metadata?.monthlyTokenLimit || plan.metadata?.monthlyGenerationLimit || plan.metadata?.monthlyRequestLimit) && (
                          <div className="space-y-1 text-xs text-gray-500">
                            {plan.metadata?.monthlyTokenLimit && (
                              <div>월 토큰 한도: {formatNumberWithCommas(plan.metadata.monthlyTokenLimit)}</div>
                            )}
                            {plan.metadata?.monthlyGenerationLimit && (
                              <div>월 생성 한도: {formatNumberWithCommas(plan.metadata.monthlyGenerationLimit)}</div>
                            )}
                            {plan.metadata?.monthlyRequestLimit && (
                              <div>월 요청 한도: {formatNumberWithCommas(plan.metadata.monthlyRequestLimit)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">예상 비용</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {model.pricing.plans.find(p => p.id === selectedPlan)?.price || 0} SOL
                  </div>
                </div>

                <Link
                  to={`/checkout/${id}?plan=${selectedPlan}`}
                  className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block shadow-sm"
                >
                  구매로 이동
                </Link>
              </div>

              {model.technicalSpecs && model.technicalSpecs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">기술 사양</h3>
                  <dl className="space-y-3">
                    {model.technicalSpecs.map(spec => (
                      <div key={spec.key} className="flex items-start justify-between">
                        <dt className="text-sm font-medium text-gray-600">{spec.label}</dt>
                        <dd className="text-sm text-gray-900">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {model.compliance && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">준수/라이선스</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{model.compliance}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section id="performance" className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">성능 지표</h2>
          
          {/* Top 3 Metrics */}
          {topMetrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {topMetrics.map(metric => (
                <div key={metric.key || metric.label} className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{metric.formattedValue}</div>
                  <div className="text-sm font-medium text-gray-600 uppercase">{metric.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metric.description || '벤치마크 기준'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show More Metrics */}
          {hasAdditionalMetrics && (
            <button
              onClick={() => setShowAllMetrics(!showAllMetrics)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showAllMetrics ? '간단히 보기' : '모든 지표 보기'}
            </button>
          )}

          {showAllMetrics && allMetrics.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">지표</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">점수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allMetrics.map(metric => (
                    <tr key={metric.key || metric.label}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 uppercase">{metric.label}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{metric.formattedValue}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{metric.description || '표준 벤치마크'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{model.versionName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Provenance Section */}
        <section id="provenance" className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">계보</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {model.lineage && model.lineage.length > 0 ? (
              <div className="space-y-4">
                {model.lineage.map((line, index) => (
                  <div key={index} className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-gray-700">
                        {typeof line === 'string' ? line : JSON.stringify(line)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">계보 정보 없음</h3>
                  <p className="text-gray-600">이 모델의 계보 정보가 제공되지 않습니다.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Storage & Integrity Section */}
        <section id="integrity" className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">저장/무결성</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">저장 정보</h3>
                <div className="space-y-3">
                  {model.integrity.cid && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">CID</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-gray-900">{model.integrity.cid}</code>
                        <button
                          onClick={() => copyToClipboard(model.integrity.cid, 'cid')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedHash === 'cid' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {model.integrity.txHash && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">트랜잭션</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-gray-900">{model.integrity.txHash}</code>
                        <button
                          onClick={() => copyToClipboard(model.integrity.txHash, 'tx')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedHash === 'tx' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {model.integrity.checksum && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">체크섬</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-gray-900">{model.integrity.checksum}</code>
                        <button
                          onClick={() => copyToClipboard(model.integrity.checksum, 'checksum')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedHash === 'checksum' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">검증 상태</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">검증됨</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>스토리지: {model.integrity.storage}</p>
                    <p>마지막 검증: 2시간 전</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">후기</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-6 mb-8">
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                <span className="text-2xl font-bold text-gray-900">{model.reviews.average}</span>
                <span className="text-gray-600">({model.reviews.count} 후기)</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {model.reviews.items.map(review => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.user}</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};