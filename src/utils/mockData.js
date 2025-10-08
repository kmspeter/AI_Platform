export const mockModels = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    creator: 'OpenAI',
    version: '1.0.0',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '최신 대화형 AI 모델',
    modality: 'LLM',
    license: '상업용',
    pricing: { type: 'paid', amount: 20, currency: 'SOL' },
    metrics: { mmlu: 87, hellaswag: 92, arc: 85, truthfulqa: 78 },
    tags: ['대화', '추론', '코딩'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Claude 3 Opus',
    creator: 'Anthropic',
    version: '3.0.0',
    thumbnail: 'https://images.pexels.com/photos/6153354/pexels-photo-6153354.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '안전하고 도움이 되는 AI',
    modality: 'LLM',
    license: '연구용',
    pricing: { type: 'paid', amount: 15, currency: 'SOL' },
    metrics: { mmlu: 85, hellaswag: 88, arc: 82, truthfulqa: 85 },
    tags: ['안전성', '추론', '창작'],
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    name: 'DALL-E 3',
    creator: 'OpenAI',
    version: '3.0.0',
    thumbnail: 'https://images.pexels.com/photos/8728380/pexels-photo-8728380.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '고품질 이미지 생성 AI',
    modality: '이미지',
    license: '상업용',
    pricing: { type: 'paid', amount: 25, currency: 'SOL' },
    metrics: { fid: 95, inception_score: 89, clip_score: 92 },
    tags: ['이미지', '생성', '예술'],
    createdAt: '2024-01-10'
  },
  {
    id: '4',
    name: 'Llama 2 Chat',
    creator: 'Meta',
    version: '2.1.0',
    thumbnail: 'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '오픈소스 대화 모델',
    modality: 'LLM',
    license: '연구용',
    pricing: { type: 'free' },
    metrics: { mmlu: 78, hellaswag: 82, arc: 75, truthfulqa: 72 },
    tags: ['오픈소스', '대화', '무료'],
    createdAt: '2024-01-08'
  },
  {
    id: '5',
    name: 'Stable Diffusion XL',
    creator: 'Stability AI',
    version: '1.0.0',
    thumbnail: 'https://images.pexels.com/photos/8728562/pexels-photo-8728562.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '고해상도 이미지 생성',
    modality: '이미지',
    license: '상업용',
    pricing: { type: 'paid', amount: 10, currency: 'SOL' },
    metrics: { fid: 88, inception_score: 85, clip_score: 87 },
    tags: ['이미지', '고해상도', '예술'],
    createdAt: '2024-01-05'
  },
  {
    id: '6',
    name: 'GPT-4 Vision',
    creator: 'OpenAI',
    version: '1.0.0',
    thumbnail: 'https://images.pexels.com/photos/8728562/pexels-photo-8728562.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '이미지 이해 및 분석',
    modality: 'VLM',
    license: '상업용',
    pricing: { type: 'paid', amount: 30, currency: 'SOL' },
    metrics: { mmlu: 85, visual_qa: 92, vqav2: 89 },
    tags: ['멀티모달', '이미지분석', '텍스트'],
    createdAt: '2024-01-12'
  },
  {
    id: '7',
    name: 'Whisper Large v3',
    creator: 'OpenAI',
    version: '3.0.0',
    thumbnail: 'https://images.pexels.com/photos/6153354/pexels-photo-6153354.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '다국어 음성 인식',
    modality: 'LLM',
    license: '연구용',
    pricing: { type: 'free' },
    metrics: { wer: 8.5, bleu: 89, accuracy: 94 },
    tags: ['음성인식', '다국어', '무료'],
    createdAt: '2024-01-03'
  },
  {
    id: '8',
    name: 'CodeLlama 34B',
    creator: 'Meta',
    version: '1.0.0',
    thumbnail: 'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=300',
    description: '코드 생성 전문 모델',
    modality: 'LLM',
    license: '상업용',
    pricing: { type: 'paid', amount: 18, currency: 'SOL' },
    metrics: { humaneval: 91, mbpp: 88, codexeval: 85 },
    tags: ['코딩', '프로그래밍', '개발'],
    createdAt: '2024-01-01'
  }
];

export const mockUsers = [
  {
    id: '1',
    name: '김개발',
    email: 'dev@company.com',
    role: 'owner',
    status: '활성',
    lastActive: '방금 전',
    avatar: null
  },
  {
    id: '2',
    name: '이연구',
    email: 'research@company.com',
    role: 'admin',
    status: '활성',
    lastActive: '2시간 전',
    avatar: null
  },
  {
    id: '3',
    name: '박분석',
    email: 'analyst@company.com',
    role: 'member',
    status: '초대됨',
    lastActive: '-',
    avatar: null
  }
];

export const mockAuditEvents = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T14:30:00'),
    user: '김개발',
    wallet: '0x1234...5678',
    eventType: 'session',
    action: '세션 생성',
    details: { modelId: 'gpt-4-turbo', sessionId: 'sess_123' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    txHash: null
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T14:25:00'),
    user: '이연구',
    wallet: '0x5678...9012',
    eventType: 'payment',
    action: '모델 구매',
    details: { modelId: 'claude-3-opus', amount: 15, currency: 'SOL' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    txHash: '0xabc123def456...'
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T14:20:00'),
    user: '박분석',
    wallet: '0x9012...3456',
    eventType: 'key',
    action: 'API 키 생성',
    details: { keyId: 'key_456', permissions: ['read', 'write'] },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    txHash: null
  },
  {
    id: '4',
    timestamp: new Date('2024-01-15T14:15:00'),
    user: '관리자',
    wallet: null,
    eventType: 'policy',
    action: '정책 변경',
    details: { policy: 'data_retention', oldValue: 60, newValue: 90 },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    txHash: null
  }
];