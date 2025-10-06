import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Upload, RefreshCcw, Loader2, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveApiUrl } from '../config/api';

const modalityOptions = [
  { value: 'LLM', label: 'LLM (언어모델)' },
  { value: 'image-generation', label: '이미지 생성' },
  { value: 'audio', label: '오디오' },
  { value: 'multimodal', label: '멀티모달' },
];

const licenseOptions = [
  { value: 'research', label: '연구용' },
  { value: 'commercial', label: '상업용' },
  { value: 'open-source', label: '오픈소스' },
];

const billingTypeOptions = [
  { value: 'free', label: '무료' },
  { value: 'monthly_subscription', label: '월간 구독' },
  { value: 'one_time_purchase', label: '일회성 구매' },
];

const pricingPlans = ['research', 'standard', 'enterprise'];

const TECHNICAL_SPEC_TEMPLATES = {
  LLM: { contextWindow: '', maxOutputTokens: '' },
  'image-generation': { promptTokens: '', maxOutputResolution: '' },
  audio: { maxAudioInput: '', maxAudioOutput: '', sampleRate: '' },
  multimodal: { textTokens: '', maxImages: '', maxImageResolution: '' },
};

const SAMPLE_FIELDS_BY_MODALITY = {
  'image-generation': ['prompt', 'outputImage'],
  audio: ['inputAudio', 'output'],
  multimodal: ['inputImage', 'prompt', 'output'],
};

const extractModelList = (data) => {
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
      (value) => value && typeof value === 'object' && Array.isArray(value.response)
    );

    if (nestedWithResponse) {
      return nestedWithResponse.response;
    }

    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    if (firstArray) {
      return firstArray;
    }
  }

  return [];
};

const mapModelOptionLabel = (model) => {
  const name = model.name || '이름 없는 모델';
  const version = model.versionName ? ` v${model.versionName}` : '';
  const modality = model.modality ? ` · ${model.modality}` : '';
  return `${name}${version}${modality}`;
};

export const ModelRegister = () => {
  const navigate = useNavigate();
  const API_BASE = resolveApiUrl('/api');
  const modelFileInputRef = useRef(null);

  const [modelFile, setModelFile] = useState(null);
  const [modelStatus, setModelStatus] = useState('');

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
        monthlyTokenLimit: '',
        monthlyGenerationLimit: '',
        monthlyRequestLimit: '',
        rights: [],
      },
      standard: {
        price: 20,
        description: '',
        billingType: 'monthly_subscription',
        monthlyTokenLimit: '',
        monthlyGenerationLimit: '',
        monthlyRequestLimit: '',
        rights: [],
      },
      enterprise: {
        price: 100,
        description: '',
        billingType: 'one_time_purchase',
        monthlyTokenLimit: '',
        monthlyGenerationLimit: '',
        monthlyRequestLimit: '',
        rights: [],
      },
    },
    technicalSpecs: { ...TECHNICAL_SPEC_TEMPLATES.LLM },
    compliance: '',
    sampleText: '',
    sampleData: {},
    releaseNotes: [{ category: '', change: '', impact: '' }],
    cidRoot: '',
    checksumRoot: '',
    onchainTx: '',
    thumbnail: '',
    parentModelId: '',
  });

  const [metricsEntries, setMetricsEntries] = useState([{ key: '', value: '' }]);
  const [existingModels, setExistingModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  const technicalSpecFields = TECHNICAL_SPEC_TEMPLATES[modelForm.modality] || {};
  const sampleFields = SAMPLE_FIELDS_BY_MODALITY[modelForm.modality] || [];

  const handlePickModelFile = () => modelFileInputRef.current?.click();

  const handleModelFileChange = (e) => {
    const file = e.target.files?.[0];
    setModelFile(file || null);
    setModelStatus('');
  };

  const uploadToServer = async (file, setStatus) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setStatus('⌧ 파일 크기는 100MB를 초과할 수 없습니다.');
      return;
    }
    setStatus('업로드 중…');

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
      setStatus(
        [
          '✅ 업로드 완료!',
          `IPFS Hash: ${ipfsHash}`,
          `Metadata: ${metadataHash}`,
          `Key: ${encryptionKey}`,
          `Gateway: ${gateway}`,
        ].join('\n')
      );
    } catch (err) {
      setStatus(`⌧ 실패: ${err.message}`);
    }
  };

  const handleModelUpload = async () => uploadToServer(modelFile, setModelStatus);

  const updateModelForm = (field, value) => {
    setModelForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePricing = (plan, field, value) => {
    setModelForm((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [plan]: {
          ...prev.pricing[plan],
          [field]: value,
        },
      },
    }));
  };

  const updateTechnicalSpecs = (field, value) => {
    setModelForm((prev) => ({
      ...prev,
      technicalSpecs: {
        ...prev.technicalSpecs,
        [field]: value,
      },
    }));
  };

  const updateSampleData = (field, value) => {
    setModelForm((prev) => ({
      ...prev,
      sampleData: {
        ...prev.sampleData,
        [field]: value,
      },
    }));
  };

  const toggleLicense = (license) => {
    setModelForm((prev) => ({
      ...prev,
      license: prev.license.includes(license)
        ? prev.license.filter((item) => item !== license)
        : [...prev.license, license],
    }));
  };

  const handleModalityChange = (nextModality) => {
    setModelForm((prev) => ({
      ...prev,
      modality: nextModality,
      technicalSpecs: { ...TECHNICAL_SPEC_TEMPLATES[nextModality] },
      sampleData: SAMPLE_FIELDS_BY_MODALITY[nextModality]
        ? SAMPLE_FIELDS_BY_MODALITY[nextModality].reduce((acc, key) => {
            acc[key] = prev.sampleData[key] || '';
            return acc;
          }, {})
        : {},
      sampleText: nextModality === 'LLM' ? prev.sampleText : '',
    }));
  };

  const handleRightsChange = (plan, text) => {
    const rights = text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    updatePricing(plan, 'rights', rights);
  };

  const handleMetricChange = (index, field, value) => {
    setMetricsEntries((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    );
  };

  const addMetric = () => {
    setMetricsEntries((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeMetric = (index) => {
    setMetricsEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReleaseNoteChange = (index, field, value) => {
    setModelForm((prev) => {
      const updated = [...prev.releaseNotes];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        releaseNotes: updated,
      };
    });
  };

  const addReleaseNote = () => {
    setModelForm((prev) => ({
      ...prev,
      releaseNotes: [...prev.releaseNotes, { category: '', change: '', impact: '' }],
    }));
  };

  const removeReleaseNote = (index) => {
    setModelForm((prev) => ({
      ...prev,
      releaseNotes:
        prev.releaseNotes.length === 1
          ? prev.releaseNotes
          : prev.releaseNotes.filter((_, idx) => idx !== index),
    }));
  };

  const loadExistingModels = async () => {
    try {
      setModelsLoading(true);
      setModelsError('');
      const response = await fetch(resolveApiUrl('/api/models'));
      if (!response.ok) {
        throw new Error(`모델 목록을 불러오지 못했습니다. (${response.status})`);
      }
      const data = await response.json();
      const list = extractModelList(data);
      const mapped = list
        .filter((item) => item && item.id)
        .map((item) => ({
          id: item.id.toString(),
          label: mapModelOptionLabel(item),
        }));
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

  const renderSampleFields = () => {
    if (modelForm.modality === 'LLM') {
      return (
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">샘플 응답</label>
          <textarea
            rows={3}
            value={modelForm.sampleText}
            onChange={(e) => updateModelForm('sampleText', e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="모델의 출력 예시를 입력하세요"
          />
        </div>
      );
    }

    if (sampleFields.length === 0) {
      return null;
    }

    return (
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field === 'prompt'
                  ? '프롬프트'
                  : field === 'outputImage'
                  ? '출력 이미지 경로'
                  : field === 'inputImage'
                  ? '입력 이미지 경로'
                  : field === 'inputAudio'
                  ? '입력 오디오 경로'
                  : '출력 예시'}
              </label>
              <input
                type="text"
                value={modelForm.sampleData[field] || ''}
                onChange={(e) => updateSampleData(field, e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="내용을 입력하세요"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const modelJson = useMemo(() => {
    const pricing = {};
    pricingPlans.forEach((plan) => {
      const planData = modelForm.pricing[plan];
      const planOutput = {
        price: Number(planData.price) || 0,
        billingType: planData.billingType,
      };
      if (planData.description) {
        planOutput.description = planData.description;
      }
      if (planData.monthlyTokenLimit) {
        const value = Number(planData.monthlyTokenLimit);
        planOutput.monthlyTokenLimit = Number.isNaN(value) ? planData.monthlyTokenLimit : value;
      }
      if (planData.monthlyGenerationLimit) {
        const value = Number(planData.monthlyGenerationLimit);
        planOutput.monthlyGenerationLimit = Number.isNaN(value)
          ? planData.monthlyGenerationLimit
          : value;
      }
      if (planData.monthlyRequestLimit) {
        const value = Number(planData.monthlyRequestLimit);
        planOutput.monthlyRequestLimit = Number.isNaN(value)
          ? planData.monthlyRequestLimit
          : value;
      }
      if (planData.rights?.length) {
        planOutput.rights = planData.rights;
      }
      pricing[plan] = planOutput;
    });

    const metrics = {};
    metricsEntries
      .filter((entry) => entry.key.trim() !== '' && entry.value !== '')
      .forEach((entry) => {
        const numeric = Number(entry.value);
        metrics[entry.key.trim()] = Number.isNaN(numeric) ? entry.value : numeric;
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

    const releaseNotes = modelForm.releaseNotes.filter(
      (note) => note.category || note.change || note.impact
    );

    const payload = {
      name: modelForm.name.trim(),
      uploader: modelForm.uploader.trim(),
      versionName: modelForm.versionName.trim(),
      modality: modelForm.modality,
      license: modelForm.license,
      pricing,
    };

    if (modelForm.releaseDate) {
      payload.releaseDate = modelForm.releaseDate;
    }
    if (modelForm.overview.trim()) {
      payload.overview = modelForm.overview.trim();
    }
    if (Object.keys(metrics).length > 0) {
      payload.metrics = metrics;
    }
    if (Object.keys(technicalSpecs).length > 0) {
      payload.technicalSpecs = technicalSpecs;
    }
    if (modelForm.compliance.trim()) {
      payload.compliance = modelForm.compliance.trim();
    }
    if (modelForm.cidRoot.trim()) {
      payload.cidRoot = modelForm.cidRoot.trim();
    }
    if (modelForm.checksumRoot.trim()) {
      payload.checksumRoot = modelForm.checksumRoot.trim();
    }
    if (modelForm.onchainTx.trim()) {
      payload.onchainTx = modelForm.onchainTx.trim();
    }
    if (modelForm.thumbnail.trim()) {
      payload.thumbnail = modelForm.thumbnail.trim();
    }
    if (modelForm.parentModelId) {
      payload.parentModelId = modelForm.parentModelId;
    }
    if (releaseNotes.length > 0) {
      payload.releaseNotes = releaseNotes;
    }

    if (modelForm.modality === 'LLM') {
      if (modelForm.sampleText.trim()) {
        payload.samples = modelForm.sampleText.trim();
      }
    } else if (sampleFields.length > 0) {
      const sample = sampleFields.reduce((acc, key) => {
        const value = modelForm.sampleData[key];
        if (value && value.toString().trim()) {
          acc[key] = value;
        }
        return acc;
      }, {});
      if (Object.keys(sample).length > 0) {
        payload.sample = sample;
      }
    }

    return payload;
  }, [modelForm, metricsEntries, technicalSpecFields, sampleFields]);

  const modelJsonString = useMemo(() => JSON.stringify(modelJson, null, 2), [modelJson]);

  const handleSubmit = () => {
    console.log('모델 등록 JSON:', modelJson);
    setSubmitStatus('모델 JSON이 콘솔에 출력되었습니다. 필요한 API 호출 로직을 여기에 연결하세요.');
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>이전으로</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">AI 모델 등록</h1>
        </div>
        <p className="text-gray-600">
          아래 양식은 플랫폼의 표준 JSON 스키마에 맞추어 모델 정보를 구성합니다. 모든 항목은 필요에 따라 자유롭게 수정하세요.
        </p>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">1. 모델 파일 업로드</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">모델 파일 업로드</h3>
            <p className="text-gray-600 mb-4">GGUF, PyTorch, ONNX 등 주요 형식을 지원합니다.</p>
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
            {modelFile && <p className="mt-3 text-sm text-gray-700">{modelFile.name}</p>}
            {modelFile && (
              <button
                onClick={handleModelUpload}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                IPFS에 업로드
              </button>
            )}
            {modelStatus && (
              <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
                {modelStatus}
              </pre>
            )}
          </div>
        </section>

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
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">부모 모델</label>
                <button
                  type="button"
                  onClick={loadExistingModels}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {modelsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  <span>새로고침</span>
                </button>
              </div>
              <select
                value={modelForm.parentModelId}
                onChange={(e) => updateModelForm('parentModelId', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">상속 관계 없음</option>
                {existingModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
              {modelsError && <p className="mt-2 text-sm text-red-500">{modelsError}</p>}
            </div>
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
            </div>
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
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">3. 가격 및 권한</h2>
          </div>
          <div className="space-y-4">
            {pricingPlans.map((plan) => (
              <div key={plan} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">{plan} 플랜</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">가격 (USD)</label>
                    <input
                      type="number"
                      value={modelForm.pricing[plan].price}
                      onChange={(e) => updatePricing(plan, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">과금 방식</label>
                    <select
                      value={modelForm.pricing[plan].billingType}
                      onChange={(e) => updatePricing(plan, 'billingType', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {billingTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">플랜 설명</label>
                    <input
                      type="text"
                      value={modelForm.pricing[plan].description}
                      onChange={(e) => updatePricing(plan, 'description', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="예: 연구용, 표준, 엔터프라이즈"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월간 토큰 제한</label>
                    <input
                      type="number"
                      value={modelForm.pricing[plan].monthlyTokenLimit}
                      onChange={(e) => updatePricing(plan, 'monthlyTokenLimit', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="필요 시 입력"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월간 생성 제한</label>
                    <input
                      type="number"
                      value={modelForm.pricing[plan].monthlyGenerationLimit}
                      onChange={(e) => updatePricing(plan, 'monthlyGenerationLimit', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="필요 시 입력"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월간 요청 제한</label>
                    <input
                      type="number"
                      value={modelForm.pricing[plan].monthlyRequestLimit}
                      onChange={(e) => updatePricing(plan, 'monthlyRequestLimit', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="필요 시 입력"
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
                    placeholder="예: 상업적\nAPI 액세스"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">4. 성능 메트릭</h2>
            <button
              onClick={addMetric}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>메트릭 추가</span>
            </button>
          </div>
          <div className="space-y-3">
            {metricsEntries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => handleMetricChange(index, 'key', e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="메트릭 이름 (예: MMLU)"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="값 (예: 87)"
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeMetric(index)}
                    className="inline-flex items-center space-x-1 text-sm text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">5. 기술 스펙</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderTechnicalSpecsFields()}</div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">6. 추가 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">컴플라이언스</label>
              <input
                type="text"
                value={modelForm.compliance}
                onChange={(e) => updateModelForm('compliance', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 개인정보·수출 규제 없음"
              />
            </div>
            {renderSampleFields()}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CID Root</label>
              <input
                type="text"
                value={modelForm.cidRoot}
                onChange={(e) => updateModelForm('cidRoot', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="IPFS CID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Checksum Root</label>
              <input
                type="text"
                value={modelForm.checksumRoot}
                onChange={(e) => updateModelForm('checksumRoot', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: sha256:..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">온체인 트랜잭션</label>
              <input
                type="text"
                value={modelForm.onchainTx}
                onChange={(e) => updateModelForm('onchainTx', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: 0x..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">썸네일 URL</label>
              <input
                type="text"
                value={modelForm.thumbnail}
                onChange={(e) => updateModelForm('thumbnail', e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="이미지 URL"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">7. 릴리즈 노트</h2>
            <button
              onClick={addReleaseNote}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>항목 추가</span>
            </button>
          </div>
          <div className="space-y-4">
            {modelForm.releaseNotes.map((note, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                <input
                  type="text"
                  value={note.category}
                  onChange={(e) => handleReleaseNoteChange(index, 'category', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="카테고리 (예: performance)"
                />
                <input
                  type="text"
                  value={note.change}
                  onChange={(e) => handleReleaseNoteChange(index, 'change', e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="변경 내용"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={note.impact || ''}
                    onChange={(e) => handleReleaseNoteChange(index, 'impact', e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="영향 (선택)"
                  />
                  <button
                    onClick={() => removeReleaseNote(index)}
                    className="inline-flex items-center space-x-1 text-sm text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">8. JSON 미리보기</h2>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>모델 등록</span>
            </button>
          </div>
          <pre className="bg-gray-900 text-green-200 text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
            {modelJsonString}
          </pre>
          {submitStatus && <p className="text-sm text-blue-600">{submitStatus}</p>}
        </section>
      </div>
    </div>
  );
};
