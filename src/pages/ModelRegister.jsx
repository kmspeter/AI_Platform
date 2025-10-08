import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Upload, RefreshCcw, Loader2, Plus, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveApiUrl, resolveIpfsUrl } from '../config/api';
import { useAuth } from '@/contexts';

const modalityOptions = [
  { value: 'LLM', label: 'LLM (언어모델)' },
  { value: 'image-generation', label: '이미지 생성' },
  { value: 'audio', label: '오디오' },
  { value: 'multimodal', label: '멀티모달' },
];

const licenseOptions = [
  { value: 'research', label: '연구용' },
  { value: 'commercial', label: '상업용' },
  { value: 'open-source', label: '오픈소스(단독 선택)' },
];

const pricingPlans = ['research', 'standard', 'enterprise'];

// IPFS 노드 서버 엔드포인트 (백엔드로 릴레이)
const IPFS_NODE_ENDPOINT = resolveIpfsUrl('/ipfs/register');

// 모달리티별 기술 스펙 템플릿
const TECHNICAL_SPEC_TEMPLATES = {
  LLM: { contextWindow: '', maxOutputTokens: '' },
  'image-generation': { promptTokens: '', maxOutputResolution: '' },
  audio: { maxAudioInput: '', maxAudioOutput: '', sampleRate: '' },
  multimodal: { textTokens: '', maxImages: '', maxImageResolution: '' },
};

// 모달리티별 샘플 필드 (입출력 예시)
const SAMPLE_FIELDS_BY_MODALITY = {
  LLM: ['prompt', 'output'],
  'image-generation': ['prompt', 'outputImage'],
  audio: ['inputAudio', 'output'],
  multimodal: ['inputImage', 'prompt', 'output'],
};

// 모달리티별 성능 메트릭(필수)
const METRIC_FIELDS_BY_MODALITY = {
  LLM: ['MMLU', 'HellaSwag', 'ARC', 'TruthfulQA', 'GSM8K', 'HumanEval'],
  'image-generation': ['FID', 'InceptionScore', 'CLIPScore'],
  multimodal: ['MME', 'OCR_F1', 'VQAv2'],
  audio: ['WER_KO', 'MOS', 'Latency'],
};

const extractModelList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.response)) return data.response;
    if (data.response && typeof data.response === 'object') return [data.response];
    const nestedWithResponse = Object.values(data).find(
      (value) => value && typeof value === 'object' && Array.isArray(value.response)
    );
    if (nestedWithResponse) return nestedWithResponse.response;
    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) return firstArray;
  }
  return [];
};

const mapModelOptionLabel = (model) => {
  const name = model.name || '이름 없는 모델';
  const version = model.versionName ? ` v${model.versionName}` : '';
  const modality = model.modality ? ` · ${model.modality}` : '';
  return `${name}${version}${modality}`;
};

// 모달리티별 standard 플랜 한도 필드명
const getStandardLimitKey = (modality) => {
  switch (modality) {
    case 'LLM':
      return 'monthlyTokenLimit';
    case 'image-generation':
      return 'monthlyGenerationLimit';
    case 'multimodal':
      return 'monthlyRequestLimit';
    case 'audio':
      return 'monthlyMinuteLimit';
    default:
      return 'monthlyRequestLimit';
  }
};
// 한도 라벨
const getStandardLimitLabel = (modality) => {
  switch (modality) {
    case 'LLM':
      return '월 토큰 한도 (monthlyTokenLimit)';
    case 'image-generation':
      return '월 생성 수 한도 (monthlyGenerationLimit)';
    case 'multimodal':
      return '월 요청 수 한도 (monthlyRequestLimit)';
    case 'audio':
      return '월 이용 분 한도 (monthlyMinuteLimit)';
    default:
      return '월 한도';
  }
};
// 한도 placeholder
const getStandardLimitPlaceholder = (modality) => {
  switch (modality) {
    case 'LLM':
      return '예: 5,000,000';
    case 'image-generation':
      return '예: 1,000 (장)';
    case 'multimodal':
      return '예: 10,000 (요청)';
    case 'audio':
      return '예: 3,000 (분)';
    default:
      return '값을 입력하세요';
  }
};

export const ModelRegister = () => {
  const navigate = useNavigate();
  const API_BASE = resolveApiUrl('/api');
  const modelFileInputRef = useRef(null);
  const { user } = useAuth();

  const [modelFile, setModelFile] = useState(null);
  const [modelStatus, setModelStatus] = useState('');

  // 썸네일 업로드 상태
  const [thumbUploadStatus, setThumbUploadStatus] = useState('');

  const [modelForm, setModelForm] = useState({
    name: '',
    uploader: '',
    versionName: '1.0.0',
    modality: 'LLM',
    license: ['research'],
    releaseDate: '',
    overview: '',
    pricing: {
      research: {
        price: 0,
        description: '',
        billingType: 'free',
        rights: [],
      },
      standard: {
        price: 20,
        description: '',
        billingType: 'monthly_subscription',
        rights: [],
        // 모달리티별 동적 키로 저장할 예정
      },
      enterprise: {
        price: 100,
        description: '',
        billingType: 'one_time_purchase',
        rights: [],
      },
    },
    technicalSpecs: { ...TECHNICAL_SPEC_TEMPLATES.LLM },
    sampleData: { prompt: '', output: '' },
    parentModelId: '',
    releaseNotes: '',
    thumbnail: '',
  });

  const makeEmptyMetrics = (mod) => {
    const keys = METRIC_FIELDS_BY_MODALITY[mod] || [];
    return keys.reduce((acc, k) => ({ ...acc, [k]: '' }), {});
  };
  const [metricsValues, setMetricsValues] = useState(makeEmptyMetrics('LLM'));

  const [sampleUploadStatus, setSampleUploadStatus] = useState({});
  const [existingModels, setExistingModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitError, setSubmitError] = useState('');

  const technicalSpecFields = TECHNICAL_SPEC_TEMPLATES[modelForm.modality] || {};
  const sampleFields = SAMPLE_FIELDS_BY_MODALITY[modelForm.modality] || [];
  const requiredMetricKeys = METRIC_FIELDS_BY_MODALITY[modelForm.modality] || [];

  // 제출 진행 상태 & 취소
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0); // 0~100
  const [progressLog, setProgressLog] = useState([]);
  const abortRef = useRef(null);
  const appendLog = (msg) => setProgressLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handlePickModelFile = () => modelFileInputRef.current?.click();

  const handleModelFileChange = (e) => {
    const file = e.target.files?.[0];
    setModelFile(file || null);
    setModelStatus(file ? '' : '');
  };

  // 공통 업로드 유틸: 샘플/썸네일 업로드에 사용
  const uploadToServer = async (file, setStatus) => {
    if (!file) return null;
    if (file.size > 100 * 1024 * 1024) {
      setStatus && setStatus('⌧ 파일 크기는 100MB를 초과할 수 없습니다.');
      return null;
    }
    setStatus && setStatus('업로드 중…');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
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
      const msg = [
        '✅ 업로드 완료!',
        `IPFS Hash: ${ipfsHash}`,
        `Metadata: ${metadataHash}`,
        `Key: ${encryptionKey}`,
        `Gateway: ${gateway}`,
      ].join('\n');

      setStatus && setStatus(msg);
      return gateway || ipfsHash || null;
    } catch (err) {
      setStatus && setStatus(`⌧ 실패: ${err.message}`);
      return null;
    }
  };

  const updateModelForm = (field, value) => {
    setModelForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePricing = (plan, field, value) => {
    setModelForm((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [plan]: { ...prev.pricing[plan], [field]: value },
      },
    }));
  };

  // 썸네일 업로드 핸들러
  const handleThumbnailFileChange = async (e) => {
    const file = e.target.files?.[0];
    const url = await uploadToServer(file, setThumbUploadStatus);
    if (url) {
      setModelForm((prev) => ({ ...prev, thumbnail: url }));
    }
  };

  const updateTechnicalSpecs = (field, value) => {
    setModelForm((prev) => ({
      ...prev,
      technicalSpecs: { ...prev.technicalSpecs, [field]: value },
    }));
  };

  const updateSampleData = (field, value) => {
    setModelForm((prev) => ({
      ...prev,
      sampleData: { ...prev.sampleData, [field]: value },
    }));
  };

  // 샘플 파일 업로드 핸들러 (이미지/오디오)
  const handleSampleFileChange = async (field, file) => {
    setSampleUploadStatus((s) => ({ ...s, [field]: '업로드 준비 중…' }));
    const url = await uploadToServer(file, (m) => setSampleUploadStatus((s) => ({ ...s, [field]: m })));
    if (url) updateSampleData(field, url);
  };

  // 라이선스 토글 규칙
  const toggleLicense = (license) => {
    setModelForm((prev) => {
      const current = new Set(prev.license);
      if (license === 'open-source') {
        return { ...prev, license: current.has('open-source') ? [] : ['open-source'] };
      }
      const next = new Set([...current].filter((l) => l !== 'open-source'));
      if (next.has(license)) next.delete(license); else next.add(license);
      const arr = Array.from(next);
      return { ...prev, license: arr.length ? arr : ['research'] };
    });
  };

  const handleModalityChange = (nextModality) => {
    setModelForm((prev) => {
      // 표준 플랜 한도 키 재정렬을 위해 기존 값을 읽어 새 키로 이관
      const prevKey = getStandardLimitKey(prev.modality);
      const nextKey = getStandardLimitKey(nextModality);
      const prevVal = prev.pricing?.standard?.[prevKey];

      const standardNext = { ...prev.pricing.standard };
      if (prevVal !== undefined && standardNext[nextKey] === undefined) {
        standardNext[nextKey] = prevVal; // 이전 값 이관
      }
      // 이전 키가 있고, 모달리티 바뀔 때 혼선을 피하려면 필요 시 제거 가능(여기선 제거)
      if (prevKey !== nextKey) {
        delete standardNext[prevKey];
      }

      return {
        ...prev,
        modality: nextModality,
        technicalSpecs: { ...TECHNICAL_SPEC_TEMPLATES[nextModality] },
        sampleData: SAMPLE_FIELDS_BY_MODALITY[nextModality]
          ? SAMPLE_FIELDS_BY_MODALITY[nextModality].reduce((acc, key) => {
              acc[key] = prev.sampleData[key] || '';
              return acc;
            }, {})
          : {},
        pricing: {
          ...prev.pricing,
          standard: standardNext,
        },
      };
    });
    setMetricsValues(makeEmptyMetrics(nextModality));
  };

  const handleRightsChange = (plan, text) => {
    const rights = text
      .split(/\n|,/) // 줄바꿈 또는 콤마 구분
      .map((item) => item.trim())
      .filter(Boolean);
    updatePricing(plan, 'rights', rights);
  };

  const loadExistingModels = async () => {
    try {
      setModelsLoading(true);
      setModelsError('');
      const response = await fetch(resolveApiUrl('/api/models'));
      if (!response.ok) throw new Error(`모델 목록을 불러오지 못했습니다. (${response.status})`);
      const data = await response.json();
      const list = extractModelList(data);
      const mapped = list
        .filter((item) => item && item.id)
        .map((item) => ({ id: item.id.toString(), label: mapModelOptionLabel(item) }));
      setExistingModels(mapped);
    } catch (error) {
      setModelsError(error.message || '모델 목록을 불러오지 못했습니다.');
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    loadExistingModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePlans = useMemo(() => {
    const set = new Set();
    if (modelForm.license.includes('research') || modelForm.license.includes('open-source')) set.add('research');
    if (modelForm.license.includes('commercial')) { set.add('standard'); set.add('enterprise'); }
    return Array.from(set);
  }, [modelForm.license]);

  const modelJson = useMemo(() => {
    const pricing = {};
    activePlans.forEach((plan) => {
      const p = modelForm.pricing[plan];
      pricing[plan] = {
        price: Number(p.price) || 0,
        billingType: p.billingType,
      };
      if (p.description) pricing[plan].description = p.description;
      if (p.rights?.length) pricing[plan].rights = p.rights;

      // 🔹 standard 플랜 모달리티별 월 한도 필드 반영
      if (plan === 'standard') {
        const key = getStandardLimitKey(modelForm.modality);
        const rawVal = p[key];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
          const num = Number(rawVal);
          pricing[plan][key] = Number.isNaN(num) ? rawVal : num;
        }
      }
    });

    const metrics = {};
    requiredMetricKeys.forEach((k) => {
      const raw = (metricsValues[k] ?? '').toString().trim();
      if (raw !== '') {
        const num = Number(raw);
        metrics[k] = Number.isNaN(num) ? raw : num;
      }
    });

    const specKeys = Object.keys(technicalSpecFields);
    const technicalSpecs = specKeys.reduce((acc, key) => {
      const value = modelForm.technicalSpecs[key];
      if (value !== '' && value !== undefined && value !== null) {
        const numeric = Number(value);
        acc[key] = Number.isNaN(numeric) ? value : numeric;
      }
      return acc;
    }, {});

    const sample = (SAMPLE_FIELDS_BY_MODALITY[modelForm.modality] || []).reduce((acc, key) => {
      const v = modelForm.sampleData[key];
      if (v && v.toString().trim()) acc[key] = v;
      return acc;
    }, {});

    const payload = {
      name: modelForm.name.trim(),
      uploader: modelForm.uploader.trim(),
      versionName: modelForm.versionName.trim(),
      modality: modelForm.modality,
      license: modelForm.license,
      pricing,
      parentModelId: modelForm.parentModelId,
      walletAddress: user?.wallet?.address ?? null,
    };

    if (modelForm.releaseDate) payload.releaseDate = modelForm.releaseDate;
    if (modelForm.overview.trim()) payload.overview = modelForm.overview.trim();
    if (modelForm.releaseNotes && modelForm.releaseNotes.trim()) payload.releaseNotes = modelForm.releaseNotes.trim(); // 🔹 릴리스 노트 포함
    if (modelForm.thumbnail && modelForm.thumbnail.trim()) payload.thumbnail = modelForm.thumbnail.trim();           // 🔹 썸네일 URL 포함
    if (Object.keys(metrics).length) payload.metrics = metrics;
    if (Object.keys(technicalSpecs).length) payload.technicalSpecs = technicalSpecs;
    if (Object.keys(sample).length) payload.sample = sample;

    return payload;
  }, [activePlans, metricsValues, modelForm, technicalSpecFields, requiredMetricKeys, user?.wallet?.address]);

  const validateBeforeSubmit = () => {
    if (!modelForm.parentModelId) return '부모 모델을 선택해 주세요.';
    for (const k of requiredMetricKeys) {
      const v = (metricsValues[k] ?? '').toString().trim();
      if (!v) return `성능 메트릭 "${k}" 값을 입력해 주세요.`;
    }
    if (!activePlans.length) return '라이선스를 선택해 활성화할 플랜이 필요합니다.';
    if (modelForm.license.includes('open-source') && modelForm.license.length > 1)
      return '오픈소스는 단독 선택만 가능합니다.';
    if (!modelFile) return '모델 파일을 선택해 주세요.';
    if (modelFile.size > 1024 * 1024 * 1024 * 4) return '모델 파일은 4GB를 초과할 수 없습니다.'; // 방어적 제한
    return '';
  };

  // 네트워크 오프라인 감지 시 업로드 취소
  useEffect(() => {
    const handleOffline = () => {
      if (isSubmitting) {
        appendLog('오프라인 감지됨: 업로드를 취소합니다.');
        try { abortRef.current?.abort(); } catch {}
        setIsSubmitting(false);
        setSubmitError('네트워크 연결이 끊어져 업로드가 취소되었습니다.');
      }
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [isSubmitting]);

  const cancelUpload = () => {
    try { abortRef.current?.abort(); } catch {}
    setIsSubmitting(false);
    appendLog('사용자에 의해 업로드가 취소되었습니다.');
    setSubmitError('업로드가 취소되었습니다.');
  };

  // 최종 제출: 모델 파일 + 모든 메타데이터를 IPFS 노드 서버로 전송
  const handleSubmit = async () => {
    const err = validateBeforeSubmit();
    if (err) {
      setSubmitError(err);
      setSubmitStatus('');
      return;
    }
    setSubmitError('');
    setSubmitStatus('');
    setProgressLog([]);
    setSubmitProgress(0);

    // 폼 데이터 준비 (multipart)
    const formData = new FormData();
    formData.append('model', modelFile, modelFile.name);
    formData.append('metadata', new Blob([JSON.stringify(modelJson)], { type: 'application/json' }));

    setIsSubmitting(true);
    appendLog('IPFS 노드 서버로 업로드를 시작합니다…');

    try {
      const xhr = new XMLHttpRequest();
      abortRef.current = xhr;
      xhr.open('POST', IPFS_NODE_ENDPOINT, true);
      xhr.responseType = 'json';

      // 업로드(송신) 진행률: 0~80%
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(80, Math.round((e.loaded / e.total) * 80));
          setSubmitProgress(pct);
          if (pct % 10 === 0) appendLog(`업로드 진행률: ${pct}%`);
        }
      };

      // 응답 수신 진행률: 남은 20%
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = 80 + Math.round((e.loaded / e.total) * 20);
          setSubmitProgress(Math.min(99, pct));
        }
      };

      xhr.onerror = () => {
        setIsSubmitting(false);
        setSubmitError('네트워크 오류로 업로드가 실패했습니다.');
        appendLog('네트워크 오류가 발생했습니다.');
      };

      xhr.onabort = () => {
        setIsSubmitting(false);
        setSubmitError('업로드가 취소되었습니다.');
        appendLog('요청이 중단되었습니다.');
      };

      xhr.onload = () => {
        setIsSubmitting(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setSubmitProgress(100);
          const res = xhr.response || {};
          if (res.success) {
            appendLog('IPFS 노드 서버 업로드 성공. 백엔드 릴레이 완료.');
            setSubmitStatus('모델이 성공적으로 등록되었습니다.');
          } else {
            setSubmitError(res.error || '업로드는 완료되었으나 서버에서 오류가 발생했습니다.');
            appendLog(`서버 오류: ${res.error || '알 수 없는 오류'}`);
          }
        } else {
          setSubmitError(`서버 응답 오류 (${xhr.status})`);
          appendLog(`서버 응답 오류 (${xhr.status})`);
        }
      };

      xhr.send(formData);
    } catch (e) {
      setIsSubmitting(false);
      setSubmitError(e.message || '제출 중 예기치 못한 오류가 발생했습니다.');
      appendLog(`예외 발생: ${e.message}`);
    }
  };

  const renderTechnicalSpecsFields = () => {
    switch (modelForm.modality) {
      case 'LLM':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">컨텍스트 윈도우</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.contextWindow || ''}
                onChange={(e) => updateTechnicalSpecs('contextWindow', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 128k"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 출력 토큰</label>
              <input
                type="number"
                value={modelForm.technicalSpecs.maxOutputTokens || ''}
                onChange={(e) => updateTechnicalSpecs('maxOutputTokens', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 4096"
              />
            </div>
          </>
        );
      case 'image-generation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">프롬프트 토큰 제한</label>
              <input
                type="number"
                value={modelForm.technicalSpecs.promptTokens || ''}
                onChange={(e) => updateTechnicalSpecs('promptTokens', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 1024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 출력 해상도</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.maxOutputResolution || ''}
                onChange={(e) => updateTechnicalSpecs('maxOutputResolution', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 2048×2048"
              />
            </div>
          </>
        );
      case 'audio':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 오디오 입력</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.maxAudioInput || ''}
                onChange={(e) => updateTechnicalSpecs('maxAudioInput', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 30분"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 오디오 출력</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.maxAudioOutput || ''}
                onChange={(e) => updateTechnicalSpecs('maxAudioOutput', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 5분"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">샘플레이트</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.sampleRate || ''}
                onChange={(e) => updateTechnicalSpecs('sampleRate', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 16-48 kHz"
              />
            </div>
          </>
        );
      case 'multimodal':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">텍스트 토큰 제한</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.textTokens || ''}
                onChange={(e) => updateTechnicalSpecs('textTokens', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 4k"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 이미지 수</label>
              <input
                type="number"
                value={modelForm.technicalSpecs.maxImages || ''}
                onChange={(e) => updateTechnicalSpecs('maxImages', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 이미지 해상도</label>
              <input
                type="text"
                value={modelForm.technicalSpecs.maxImageResolution || ''}
                onChange={(e) => updateTechnicalSpecs('maxImageResolution', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 2048×2048"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderMetricsFields = () => {
    return (
      <div className="space-y-3">
        {requiredMetricKeys.map((k) => (
          <div key={k} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2">
              <input type="text" readOnly value={k} className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-700" />
            </div>
            <div className="md:col-span-3">
              <input
                type="text"
                required
                value={metricsValues[k]}
                onChange={(e) => setMetricsValues((prev) => ({ ...prev, [k]: e.target.value }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={`값 입력 (예: ${k === 'MMLU' ? '87' : ''})`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSampleFields = () => {
    if (sampleFields.length === 0) return null;
    return (
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleFields.map((field) => {
            const isImage = field === 'outputImage' || field === 'inputImage';
            const isAudio = field === 'inputAudio';
            const needsUpload = isImage || isAudio;
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field === 'prompt'
                    ? '프롬프트'
                    : field === 'outputImage'
                    ? '출력 이미지 파일'
                    : field === 'inputImage'
                    ? '입력 이미지 파일'
                    : field === 'inputAudio'
                    ? '입력 오디오 파일'
                    : '출력 예시'}
                </label>
                {needsUpload ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={isImage ? 'image/*' : isAudio ? 'audio/*' : '*'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSampleFileChange(field, file);
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {sampleUploadStatus[field] && (
                      <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-2 rounded">{sampleUploadStatus[field]}</pre>
                    )}
                    {modelForm.sampleData[field] && (
                      <a href={modelForm.sampleData[field]} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">업로드된 파일 열기</a>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={modelForm.sampleData[field] || ''}
                    onChange={(e) => updateSampleData(field, e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="내용을 입력하세요"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>이전으로</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">AI 모델 등록</h1>
        </div>

        {/* 1. 모델 파일 업로드 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">1. 모델 파일 업로드</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">모델 파일 선택</h3>
            <p className="text-gray-600 mb-4">GGUF, PyTorch, ONNX 등 주요 형식을 지원합니다. (이 단계에서 IPFS 업로드는 수행하지 않습니다)</p>
            <button onClick={handlePickModelFile} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">파일 선택</button>
            <input ref={modelFileInputRef} type="file" className="hidden" onChange={handleModelFileChange} />
            {modelFile && <p className="mt-3 text-sm text-gray-700">{modelFile.name}</p>}
            {modelStatus && (
              <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">{modelStatus}</pre>
            )}
          </div>
        </section>

        {/* 2. 기본 정보 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">2. 기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모델명 *</label>
              <input
                type="text"
                value={modelForm.name}
                onChange={(e) => updateModelForm('name', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: GPT-4 Turbo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">업로더 *</label>
              <input
                type="text"
                value={modelForm.uploader}
                onChange={(e) => updateModelForm('uploader', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: openai_official"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">버전 *</label>
              <input
                type="text"
                value={modelForm.versionName}
                onChange={(e) => updateModelForm('versionName', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">출시일</label>
              <input
                type="date"
                value={modelForm.releaseDate}
                onChange={(e) => updateModelForm('releaseDate', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모달리티 *</label>
              <select
                value={modelForm.modality}
                onChange={(e) => handleModalityChange(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {modalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 부모 모델 - 필수 */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">부모 모델 *</label>
                <button type="button" onClick={loadExistingModels} className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                  {modelsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  <span>새로고침</span>
                </button>
              </div>
              <select
                value={modelForm.parentModelId}
                onChange={(e) => updateModelForm('parentModelId', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="" disabled>부모 모델을 선택하세요</option>
                {existingModels.map((model) => (
                  <option key={model.id} value={model.id}>{model.label}</option>
                ))}
              </select>
              {modelsError && <p className="mt-2 text-sm text-red-500">{modelsError}</p>}
            </div>

            {/* 라이선스 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">라이선스 *</label>
              <div className="flex flex-wrap gap-4">
                {licenseOptions.map((option) => (
                  <label key={option.value} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={modelForm.license.includes(option.value)}
                      onChange={() => toggleLicense(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {modelForm.license.includes('open-source') && modelForm.license.length > 1 && (
                <p className="mt-2 text-sm text-red-500">오픈소스는 단독 선택만 가능합니다.</p>
              )}
            </div>

            {/* 모델 설명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">모델 설명 *</label>
              <textarea
                rows={3}
                value={modelForm.overview}
                onChange={(e) => updateModelForm('overview', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="모델에 대한 상세 설명을 입력하세요"
              />
            </div>

            {/* 🔹 릴리스 노트 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">릴리스 노트 (선택)</label>
              <textarea
                rows={4}
                value={modelForm.releaseNotes}
                onChange={(e) => updateModelForm('releaseNotes', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 버그 수정, 성능 향상, API 변경사항 등"
              />
            </div>

            {/* 🔹 썸네일 업로드 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">썸네일 / 미리보기 이미지</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {thumbUploadStatus && (
                <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-2 rounded mt-2">
                  {thumbUploadStatus}
                </pre>
              )}
              {modelForm.thumbnail && (
                <div className="mt-3">
                  <img
                    src={modelForm.thumbnail}
                    alt="thumbnail preview"
                    className="h-28 w-auto rounded border border-gray-200"
                  />
                  <div className="text-xs text-gray-600 mt-1 break-all">{modelForm.thumbnail}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. 가격 및 권한 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">3. 가격 및 권한</h2>
          </div>
          {activePlans.length === 0 && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span>라이선스를 선택하면 해당 플랜이 활성화됩니다.</span>
            </div>
          )}
          <div className="space-y-4">
            {activePlans.map((plan) => (
              <div key={plan} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">{plan} 플랜</h3>
                  <span className="text-xs text-gray-500">
                    {plan === 'research' && '과금방식: 무료 고정'}
                    {plan === 'standard' && '과금방식: 월간 구독 고정'}
                    {plan === 'enterprise' && '과금방식: 일회성 구매 고정'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">가격 (SOL){plan === 'research' && ' - 0 고정'}</label>
                    <input
                      type="number"
                      value={plan === 'research' ? 0 : modelForm.pricing[plan].price}
                      onChange={(e) => updatePricing(plan, 'price', parseFloat(e.target.value) || 0)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${plan === 'research' ? 'bg-gray-50 text-gray-500' : ''}`}
                      min="0"
                      step="0.01"
                      disabled={plan === 'research'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">과금 방식</label>
                    <input type="text" readOnly className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-600" value={
                      plan === 'research' ? '무료' : plan === 'standard' ? '월간 구독' : '일회성 구매'} />
                  </div>

                  {/* 🔹 표준 플랜: 모달리티별 월 한도 입력 */}
                  {plan === 'standard' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getStandardLimitLabel(modelForm.modality)}
                        </label>
                        <input
                          type="number"
                          value={modelForm.pricing.standard[getStandardLimitKey(modelForm.modality)] || ''}
                          onChange={(e) =>
                            setModelForm((prev) => ({
                              ...prev,
                              pricing: {
                                ...prev.pricing,
                                standard: {
                                  ...prev.pricing.standard,
                                  [getStandardLimitKey(modelForm.modality)]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder={getStandardLimitPlaceholder(modelForm.modality)}
                          min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">현재 모달리티({modelForm.modality})에 따라 필드명이 달라집니다.</p>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">플랜 설명</label>
                    <input
                      type="text"
                      value={modelForm.pricing[plan].description}
                      onChange={(e) => updatePricing(plan, 'description', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="예: 연구용, 표준, 엔터프라이즈"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">권한 (한 줄당 하나)</label>
                  <textarea
                    rows={2}
                    value={modelForm.pricing[plan].rights.join('\n')}
                    onChange={(e) => handleRightsChange(plan, e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder={`예: 상업적\nAPI 액세스`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 성능 메트릭 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">4. 성능 메트릭 *</h2>
          </div>
          {renderMetricsFields()}
        </section>

        {/* 5. 기술 스펙 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">5. 기술 스펙</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderTechnicalSpecsFields()}</div>
        </section>

        {/* 6. 입·출력 예시 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">6. 입·출력 예시</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderSampleFields()}</div>
        </section>

        {/* 제출 영역 */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">제출</h2>
            <div className="flex items-center gap-2">
              {isSubmitting && (
                <button onClick={cancelUpload} className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4" />
                  <span>취소</span>
                </button>
              )}
              <button onClick={handleSubmit} disabled={isSubmitting} className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isSubmitting ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>{isSubmitting ? '업로드 중…' : '모델 등록'}</span>
              </button>
            </div>
          </div>

          {(isSubmitting || submitProgress > 0 || progressLog.length > 0) && (
            <div className="space-y-3">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 transition-all" style={{ width: `${submitProgress}%` }} />
              </div>
              <div className="text-xs text-gray-600">진행률: {submitProgress}%</div>
              {progressLog.length > 0 && (
                <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded max-h-40 overflow-auto">{progressLog.join('\n')}</pre>
              )}
            </div>
          )}

          {submitError && <div className="text-sm text-red-600">{submitError}</div>}
          {submitStatus && <p className="text-sm text-green-700">{submitStatus}</p>}
        </section>
      </div>
    </div>
  );
};
