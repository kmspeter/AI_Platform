const LICENSE_LABELS = {
  commercial: '상업용',
  research: '연구용',
  enterprise: '엔터프라이즈',
  open: '오픈소스',
  open_source: '오픈소스',
  free: '무료',
};

const MODALITY_LABELS = {
  LLM: 'LLM',
  VLM: 'VLM',
  IMAGE_GENERATION: '이미지',
  IMAGE: '이미지',
  IMAGEGENERATION: '이미지',
  IMAGE_MODEL: '이미지',
  IMAGE_MODELING: '이미지',
  MULTIMODAL: 'VLM',
  MULTI_MODAL: 'VLM',
  AUDIO: '오디오',
  SPEECH: '오디오',
  TEXT_TO_SPEECH: '오디오',
};

export const MODEL_DEFAULT_THUMBNAIL = 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg';

export const normalizeKey = (value) =>
  (value ?? '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_');

export const normalizeMetrics = (metrics) => {
  if (!metrics || typeof metrics !== 'object') {
    return {};
  }

  return Object.entries(metrics).reduce((acc, [key, value]) => {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseFloat(value)
          : Number.NaN;

    if (!Number.isNaN(numericValue)) {
      acc[key] = Number(numericValue);
    }

    return acc;
  }, {});
};

export const normalizeLicense = (license) => {
  const licenseArray = Array.isArray(license)
    ? license
    : license
      ? [license]
      : [];

  const normalized = licenseArray
    .map((item) => {
      const key = normalizeKey(item).toLowerCase();
      return LICENSE_LABELS[key] || LICENSE_LABELS[item] || item;
    })
    .filter(Boolean);

  const primary = normalized[0] || (licenseArray[0] ?? '라이선스 정보 없음');

  return {
    primary,
    labels: normalized,
    original: licenseArray,
  };
};

export const normalizeModality = (modality) => {
  const key = normalizeKey(modality);
  return MODALITY_LABELS[key] || modality || '기타';
};

export const extractPricingPlans = (pricing) => {
  if (!pricing || typeof pricing !== 'object') {
    return [];
  }

  return Object.entries(pricing).reduce((plans, [planId, planData]) => {
    if (!planData || typeof planData !== 'object') {
      return plans;
    }

    const rawPrice = planData.price;
    const price =
      typeof rawPrice === 'number'
        ? rawPrice
        : typeof rawPrice === 'string'
          ? Number.parseFloat(rawPrice)
          : 0;

    const rights = Array.isArray(planData.rights)
      ? planData.rights
      : [];

    plans.push({
      id: planId,
      name: planData.description || planId,
      price: Number.isFinite(price) ? Number(price) : 0,
      billingType: planData.billingType || '',
      rights,
      metadata: {
        monthlyTokenLimit: planData.monthlyTokenLimit,
        monthlyGenerationLimit: planData.monthlyGenerationLimit,
        monthlyRequestLimit: planData.monthlyRequestLimit,
      },
    });

    return plans;
  }, []);
};

export const selectDefaultPlan = (plans) => {
  if (!plans || plans.length === 0) {
    return {
      id: 'standard',
      name: '표준',
      price: 0,
      billingType: 'free',
      rights: [],
      metadata: {},
    };
  }

  return plans.find((plan) => plan.id === 'standard') || plans[0];
};

const METRIC_METADATA = {
  MMLU: { label: 'MMLU', suffix: '%', decimals: 0, description: '종합 학습 평가' },
  HELLASWAG: { label: 'HellaSwag', suffix: '%', decimals: 0, description: '상황 추론 정확도' },
  ARC: { label: 'ARC', suffix: '%', decimals: 0, description: '과학 추론 정확도' },
  TRUTHFULQA: { label: 'TruthfulQA', suffix: '%', decimals: 0, description: '진실성 평가' },
  GSM8K: { label: 'GSM8K', suffix: '%', decimals: 0, description: '수학 추론 정확도' },
  HUMANEVAL: { label: 'HumanEval', suffix: '%', decimals: 0, description: '코드 생성 정확도' },
  FID: { label: 'FID', suffix: '', decimals: 1, description: 'Fréchet Inception Distance (낮을수록 좋음)' },
  INCEPTIONSCORE: { label: 'Inception Score', suffix: '', decimals: 0, description: '이미지 다양성 지표' },
  CLIPSCORE: { label: 'CLIP Score', suffix: '', decimals: 2, description: '텍스트-이미지 정합성' },
  MME: { label: 'MME', suffix: '', decimals: 0, description: '멀티모달 종합 점수' },
  OCR_F1: { label: 'OCR F1', suffix: '%', decimals: 0, description: '문자 인식 정확도' },
  VQAV2: { label: 'VQAv2', suffix: '%', decimals: 0, description: '시각 질의응답 정확도' },
  WER_KO: { label: 'WER (KO)', suffix: '%', decimals: 1, description: '한국어 음성 인식 오류율 (낮을수록 좋음)' },
  MOS: { label: 'MOS', suffix: '', decimals: 1, description: '음질 평가 (5점 만점)' },
  LATENCY: { label: 'Latency', suffix: 's', decimals: 1, description: '평균 지연 시간' },
};

const MODALITY_PRIORITIES = {
  LLM: ['MMLU', 'HUMANEVAL', 'GSM8K', 'HELLASWAG', 'ARC', 'TRUTHFULQA'],
  이미지: ['FID', 'CLIPSCORE', 'INCEPTIONSCORE'],
  VLM: ['MME', 'OCR_F1', 'VQAV2'],
  오디오: ['MOS', 'WER_KO', 'LATENCY'],
};

const formatMetricValue = (value, decimals = 0, suffix = '') => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  const formatted = decimals > 0 ? rounded.toFixed(decimals) : rounded.toString();
  return `${formatted}${suffix}`;
};

export const prepareMetricDisplay = (metrics = {}, modalityLabel = '') => {
  const entries = Object.entries(metrics)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([key, value]) => {
      const normalizedKey = normalizeKey(key);
      const metadata = METRIC_METADATA[normalizedKey] || {};
      const decimals = metadata.decimals ?? (value < 10 ? 1 : 0);
      const suffix = metadata.suffix ?? '';

      return {
        key,
        normalizedKey,
        label: metadata.label || key,
        rawValue: value,
        formattedValue: formatMetricValue(value, decimals, suffix),
        description: metadata.description || '',
      };
    });

  const priorities = MODALITY_PRIORITIES[modalityLabel] || [];

  return entries.sort((a, b) => {
    const aIndex = priorities.indexOf(a.normalizedKey);
    const bIndex = priorities.indexOf(b.normalizedKey);

    if (aIndex === -1 && bIndex === -1) {
      return a.label.localeCompare(b.label);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

export const getMetricHighlights = (metrics = {}, modalityLabel = '', limit = 3) =>
  prepareMetricDisplay(metrics, modalityLabel).slice(0, limit);

const TECH_SPEC_LABELS = {
  CONTEXTWINDOW: '컨텍스트 윈도우',
  MAXOUTPUTTOKENS: '최대 출력 토큰',
  PROMPTTOKENS: '프롬프트 토큰',
  MAXOUTPUTRESOLUTION: '최대 출력 해상도',
  TEXTTOKENS: '텍스트 토큰',
  MAXIMAGES: '최대 이미지 수',
  MAXIMAGERESOLUTION: '최대 이미지 해상도',
  MAXAUDIOINPUT: '최대 오디오 입력',
  MAXAUDIOOUTPUT: '최대 오디오 출력',
  SAMPLERATE: '샘플링 레이트',
  MONTHLYTOKENLIMIT: '월 토큰 한도',
  MONTHLYGENERATIONLIMIT: '월 생성 한도',
  MONTHLYREQUESTLIMIT: '월 요청 한도',
};

export const formatTechnicalSpecs = (specs = {}) => {
  if (!specs || typeof specs !== 'object') {
    return [];
  }

  return Object.entries(specs)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const normalizedKey = normalizeKey(key);
      return {
        key,
        label: TECH_SPEC_LABELS[normalizedKey] || key,
        value,
      };
    });
};

const detectSampleType = (sample) => {
  if (!sample) return 'text';
  if (typeof sample === 'string') return 'text';

  const keys = Object.keys(sample).map(normalizeKey);

  if (keys.some((key) => key.includes('IMAGE'))) {
    return 'image';
  }

  if (keys.some((key) => key.includes('AUDIO'))) {
    return 'audio';
  }

  return 'text';
};

const normalizeSampleObject = (sample) => {
  if (typeof sample === 'string') {
    return {
      type: 'text',
      output: sample,
      raw: sample,
    };
  }

  if (!sample || typeof sample !== 'object') {
    return null;
  }

  const type = detectSampleType(sample);

  return {
    type,
    prompt: sample.prompt || sample.input || sample.question || '',
    inputImage: sample.inputImage || sample.image || '',
    outputImage: sample.outputImage || sample.imageOutput || '',
    inputAudio: sample.inputAudio || '',
    outputAudio: sample.outputAudio || '',
    output: sample.output || sample.answer || sample.response || sample.outputText || '',
    raw: sample,
  };
};

export const normalizeSampleEntries = (model, modalityLabel = '') => {
  const samples = [];

  if (!model) {
    return samples;
  }

  const candidates = [];

  if (model.sample) {
    candidates.push(model.sample);
  }

  if (model.samples) {
    if (Array.isArray(model.samples)) {
      candidates.push(...model.samples);
    } else {
      candidates.push(model.samples);
    }
  }

  candidates
    .map(normalizeSampleObject)
    .filter(Boolean)
    .forEach((sample, index) => {
      samples.push({
        ...sample,
        id: `${modalityLabel || 'sample'}-${index}`,
      });
    });

  return samples;
};
