import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cachedFetch } from '../utils/apiCache';
import { 
  Star, 
  Download, 
  ExternalLink, 
  ChevronDown,
  Play,
  ShoppingCart,
  Copy,
  Check,
  Eye,
  Shield,
  Clock,
  Bot,
  Loader2,
  AlertCircle
} from 'lucide-react';

// API 서비스
const modelDetailService = {
  async fetchModel(id, forceRefresh = false) {
    try {
      const data = await cachedFetch(`/api/models/${id}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        forceRefresh
      }, 10 * 60 * 1000); // 10분 캐시 (상세 정보는 더 오래 캐시)
      
      console.log('Model detail API response:', data);
      
      return this.transformModel(data);
    } catch (error) {
      console.error('Failed to fetch model detail:', error);
      throw error;
    }
  },

  transformModel(apiModel) {
    console.log('Raw API model data:', apiModel);
    
    // samples 데이터 파싱
    let parsedSamples = [];
    if (apiModel.samples) {
      if (Array.isArray(apiModel.samples)) {
        parsedSamples = apiModel.samples.filter(sample => typeof sample === 'string');
      } else if (typeof apiModel.samples === 'string') {
        try {
          const parsed = JSON.parse(apiModel.samples);
          if (Array.isArray(parsed)) {
            parsedSamples = parsed.filter(sample => typeof sample === 'string');
          }
        } catch (e) {
          console.warn('Failed to parse samples:', apiModel.samples);
          parsedSamples = [apiModel.samples]; // 문자열로 처리
        }
      } else if (typeof apiModel.samples === 'object') {
        // 객체인 경우 문자열 값들만 추출
        const values = Object.values(apiModel.samples);
        parsedSamples = values.filter(val => typeof val === 'string');
      }
    }

    // lineage 데이터 파싱
    let parsedLineage = [];
    if (apiModel.lineage) {
      if (Array.isArray(apiModel.lineage)) {
        parsedLineage = apiModel.lineage.filter(line => typeof line === 'string');
      } else if (typeof apiModel.lineage === 'string') {
        try {
          const parsed = JSON.parse(apiModel.lineage);
          if (Array.isArray(parsed)) {
            parsedLineage = parsed.filter(line => typeof line === 'string');
          }
        } catch (e) {
          console.warn('Failed to parse lineage:', apiModel.lineage);
          parsedLineage = [apiModel.lineage]; // 문자열로 처리
        }
      } else if (typeof apiModel.lineage === 'object') {
        // 객체인 경우 문자열 값들만 추출
        const values = Object.values(apiModel.lineage);
        parsedLineage = values.filter(val => typeof val === 'string');
      }
    }

    console.log('Parsed samples:', parsedSamples);
    console.log('Parsed lineage:', parsedLineage);

    // API 응답을 컴포넌트에서 사용하는 형태로 변환
    return {
      id: apiModel.id?.toString(),
      name: apiModel.name,
      creator: apiModel.uploader,
      versionName: apiModel.versionName,
      status: apiModel.status,
      description: apiModel.overview,
      thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400', // 기본 이미지
      metrics: apiModel.metrics || {},
      samples: parsedSamples,
      lineage: parsedLineage,
      releaseNotes: apiModel.releaseNotes,
      releaseDate: apiModel.releaseDate,
      modality: apiModel.modality,
      license: apiModel.license,
      pricing: {
        plans: [
          { 
            id: 'research', 
            name: '연구용', 
            price: apiModel.priceResearch || 0, 
            rights: ['학술연구', '비상업적', '논문발표', '교육목적'] 
          },
          { 
            id: 'standard', 
            name: '표준', 
            price: apiModel.priceStandard || 0, 
            rights: ['상업적', 'API 액세스', '배포허용', '수정가능'] 
          },
          { 
            id: 'enterprise', 
            name: '엔터프라이즈', 
            price: apiModel.priceEnterprise || 0, 
            rights: ['온프렘', '커스텀', '전용지원', '무제한'] 
          }
        ]
      },
      integrity: {
        cid: apiModel.cidRoot,
        checksum: apiModel.checksumRoot,
        txHash: apiModel.onchainTx,
        verified: true, // API에서 제공되지 않으므로 기본값
        storage: 'IPFS + Arweave' // API에서 제공되지 않으므로 기본값
      },
      reviews: {
        average: 4.8, // 임시값 - API에서 제공되지 않음
        count: 124,   // 임시값 - API에서 제공되지 않음
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
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [copiedHash, setCopiedHash] = useState('');

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
  const parseReleaseNotes = (notes) => {
    if (!notes) return [];
    return notes.split('\n').filter(note => note.trim());
  };

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

  const topMetrics = Object.entries(model.metrics).slice(0, 3);
  const allMetrics = Object.entries(model.metrics);
  const releaseNotes = parseReleaseNotes(model.releaseNotes);

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
                  <div className="space-y-3">
                    {model.samples.map((sample, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 italic leading-relaxed">
                          {typeof sample === 'string' ? sample : JSON.stringify(sample)}
                        </p>
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
                    {releaseNotes.map((note, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p className="text-gray-700">{note}</p>
                      </div>
                    ))}
                  </div>
                  {model.releaseDate && (
                    <p className="text-sm text-gray-500 mt-4">릴리스 일자: {model.releaseDate}</p>
                  )}
                </div>
              )}
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit shadow-sm">
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
                        {plan.price === 0 ? '무료' : `$${plan.price} USDC`}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {plan.rights.map(right => (
                          <span key={right} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium text-center">
                            {right}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">예상 비용</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${model.pricing.plans.find(p => p.id === selectedPlan)?.price || 0} USDC
                </div>
              </div>

              <Link
                to={`/checkout/${id}?plan=${selectedPlan}`}
                className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block shadow-sm"
              >
                구매로 이동
              </Link>
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section id="performance" className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">성능 지표</h2>
          
          {/* Top 3 Metrics */}
          {topMetrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {topMetrics.map(([metric, value]) => (
                <div key={metric} className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{value}%</div>
                  <div className="text-sm font-medium text-gray-600 uppercase">{metric}</div>
                  <div className="text-xs text-gray-500 mt-1">벤치마크 기준</div>
                </div>
              ))}
            </div>
          )}

          {/* Show More Metrics */}
          {allMetrics.length > 3 && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">데이터셋</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allMetrics.map(([metric, value]) => (
                    <tr key={metric}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 uppercase">{metric}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{value}%</td>
                      <td className="px-6 py-4 text-sm text-gray-600">표준 벤치마크</td>
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