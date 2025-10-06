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

const normalizeKey = (value) =>
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
