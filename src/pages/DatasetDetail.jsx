import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  Star,
  Database,
  FileText,
  Shield,
  Calendar,
  User,
  Eye,
  ShoppingCart,
  Tag,
  TrendingUp,
  BarChart3,
  Heart,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { convertSolToLamports, formatLamports } from '../utils/currency';

export const DatasetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const mockDatasets = [
    {
      id: '1',
      name: 'Korean Conversation Dataset',
      creator: '한국AI연구소',
      creatorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: '한국어 일상 대화 데이터셋으로 챗봇 훈련에 최적화되어 있습니다. 다양한 상황과 맥락에서의 자연스러운 대화를 포함하고 있으며, 감정 레이블과 의도 분류가 포함되어 있습니다.',
      category: '대화',
      format: 'JSON',
      license: '상업용',
      size: '2.5GB',
      samples: 150000,
      pricing: { type: 'paid', amount: convertSolToLamports(50), currency: 'LAMPORTS' },
      rating: 4.8,
      downloads: 1250,
      reviews: 89,
      thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['한국어', '대화', '챗봇', '감정분석', '의도분류'],
      createdAt: '2024-01-15',
      updatedAt: '2024-02-20',
      useCases: ['챗봇 개발', '대화형 AI', '감정 분석', '자연어 이해'],
      languages: ['한국어'],
      fileStructure: [
        { name: 'conversations.json', size: '1.8GB', rows: 150000 },
        { name: 'metadata.json', size: '50MB', rows: 150000 },
        { name: 'labels.json', size: '100MB', rows: 150000 },
        { name: 'README.md', size: '10KB', rows: null }
      ],
      sampleData: [
        {
          input: '오늘 날씨 어때?',
          output: '오늘은 맑고 화창한 날씨입니다. 기온은 20도 정도로 따뜻해요.',
          emotion: '중립',
          intent: '날씨문의'
        },
        {
          input: '맛있는 식당 추천해줘',
          output: '근처에 좋은 한식당이 있어요. 불고기가 특히 맛있답니다.',
          emotion: '긍정',
          intent: '추천요청'
        },
        {
          input: '기분이 안 좋아',
          output: '무슨 일이 있으셨나요? 이야기하고 싶으시면 들어드릴게요.',
          emotion: '부정',
          intent: '감정표현'
        }
      ],
      statistics: {
        avgLength: 45,
        maxLength: 250,
        minLength: 5,
        uniqueIntents: 28,
        emotionDistribution: {
          positive: 45,
          neutral: 35,
          negative: 20
        }
      }
    },
    {
      id: '2',
      name: 'Medical Image Dataset',
      creator: '의료AI팀',
      creatorAvatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: '의료 영상 진단을 위한 고품질 이미지 데이터셋입니다. X-ray, CT, MRI 등 다양한 의료 영상을 포함하고 있으며, 전문의가 검증한 레이블이 포함되어 있습니다.',
      category: '이미지',
      format: 'PNG',
      license: '연구용',
      size: '15GB',
      samples: 50000,
      pricing: { type: 'paid', amount: convertSolToLamports(200), currency: 'LAMPORTS' },
      rating: 4.9,
      downloads: 850,
      reviews: 124,
      thumbnail: 'https://images.pexels.com/photos/6153354/pexels-photo-6153354.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['의료', '이미지', '진단', 'X-ray', 'CT'],
      createdAt: '2024-01-20',
      updatedAt: '2024-03-10',
      useCases: ['질병 진단', '이상 탐지', '의료 AI 연구'],
      languages: ['English', 'Korean'],
      fileStructure: [
        { name: 'images/', size: '14GB', rows: 50000 },
        { name: 'annotations.json', size: '500MB', rows: 50000 },
        { name: 'metadata.csv', size: '50MB', rows: 50000 }
      ],
      sampleData: [],
      statistics: {
        resolution: '512x512',
        colorMode: 'Grayscale',
        formats: ['PNG', 'DICOM'],
        conditions: 15
      }
    },
    {
      id: '3',
      name: 'Code Generation Dataset',
      creator: '개발자커뮤니티',
      creatorAvatar: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: '다양한 프로그래밍 언어의 코드 생성 데이터셋입니다. 실제 GitHub 프로젝트에서 수집한 고품질 코드와 설명이 포함되어 있습니다.',
      category: '코드',
      format: 'JSONL',
      license: '오픈소스',
      size: '5.2GB',
      samples: 300000,
      pricing: { type: 'free' },
      rating: 4.6,
      downloads: 2100,
      reviews: 156,
      thumbnail: 'https://images.pexels.com/photos/8728380/pexels-photo-8728380.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['코딩', '프로그래밍', '무료', 'Python', 'JavaScript'],
      createdAt: '2024-01-10',
      updatedAt: '2024-03-15',
      useCases: ['코드 생성', '자동 완성', 'AI 코딩 어시스턴트'],
      languages: ['Python', 'JavaScript', 'Java', 'C++', 'Go'],
      fileStructure: [
        { name: 'python.jsonl', size: '2GB', rows: 120000 },
        { name: 'javascript.jsonl', size: '1.5GB', rows: 100000 },
        { name: 'java.jsonl', size: '1GB', rows: 50000 },
        { name: 'other.jsonl', size: '700MB', rows: 30000 }
      ],
      sampleData: [
        {
          description: 'Sort a list of numbers in ascending order',
          code: 'def sort_numbers(nums):\n    return sorted(nums)',
          language: 'Python'
        }
      ],
      statistics: {
        avgCodeLength: 85,
        programmingLanguages: 8,
        totalFunctions: 300000
      }
    },
    {
      id: '4',
      name: 'Financial News Dataset',
      creator: '금융데이터랩',
      creatorAvatar: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=100',
      description: '금융 뉴스 분석을 위한 텍스트 데이터셋입니다.',
      category: '텍스트',
      format: 'CSV',
      license: '상업용',
      size: '1.8GB',
      samples: 80000,
      pricing: { type: 'paid', amount: convertSolToLamports(75), currency: 'LAMPORTS' },
      rating: 4.7,
      downloads: 650,
      reviews: 45,
      thumbnail: 'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['금융', '뉴스', '분석'],
      createdAt: '2024-01-08',
      updatedAt: '2024-02-15',
      useCases: ['시장 분석', '감성 분석', '트렌드 예측'],
      languages: ['Korean', 'English'],
      fileStructure: [
        { name: 'news.csv', size: '1.5GB', rows: 80000 },
        { name: 'categories.json', size: '200MB', rows: 80000 },
        { name: 'metadata.json', size: '100MB', rows: 80000 }
      ],
      sampleData: [],
      statistics: {
        avgLength: 350,
        categories: 12,
        timeRange: '2020-2024'
      }
    }
  ];

  const dataset = mockDatasets.find(d => d.id === id) || mockDatasets[0];

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate('/datasets')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>데이터셋 목록으로</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img
                src={dataset.thumbnail}
                alt={dataset.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{dataset.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{dataset.creator}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>업데이트: {dataset.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">{dataset.rating}</span>
                    <span className="text-gray-600">({dataset.reviews} 리뷰)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Download className="h-4 w-4" />
                    <span>{dataset.downloads.toLocaleString()} 다운로드</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dataset.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="border-b border-gray-200 mb-6">
                  <div className="flex space-x-6">
                    {['overview', 'structure', 'samples', 'stats'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 font-medium transition-colors ${
                          activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab === 'overview' && '개요'}
                        {tab === 'structure' && '파일 구조'}
                        {tab === 'samples' && '샘플 데이터'}
                        {tab === 'stats' && '통계'}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">설명</h2>
                      <p className="text-gray-700 leading-relaxed">{dataset.description}</p>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">사용 사례</h2>
                      <ul className="space-y-2">
                        {dataset.useCases.map((useCase, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">지원 언어</h2>
                      <div className="flex flex-wrap gap-2">
                        {dataset.languages.map(lang => (
                          <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'structure' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">파일 구조</h2>
                    <div className="space-y-2">
                      {dataset.fileStructure.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{file.name}</div>
                              {file.rows && (
                                <div className="text-sm text-gray-600">{file.rows.toLocaleString()} 행</div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">{file.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'samples' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">샘플 데이터</h2>
                    {dataset.sampleData.length > 0 ? (
                      <div className="space-y-4">
                        {dataset.sampleData.map((sample, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(sample, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">구매 후 샘플 데이터를 확인할 수 있습니다.</p>
                    )}
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">통계</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(dataset.statistics).map(([key, value]) => (
                        <div key={key} className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {typeof value === 'object' ? (
                              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                            ) : (
                              value
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {dataset.pricing.type === 'free' ? (
                    <span className="text-green-600">무료</span>
                  ) : (
                    formatLamports(dataset.pricing.amount)
                  )}
                </div>
                <div className="text-sm text-gray-600">일회성 구매</div>
              </div>

              <div className="space-y-3 mb-6">
                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>구매하기</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>미리보기</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Database className="h-5 w-5" />
                    <span className="text-sm">샘플 수</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dataset.samples.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm">크기</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dataset.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">포맷</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dataset.format}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm">라이선스</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dataset.license}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Tag className="h-5 w-5" />
                    <span className="text-sm">카테고리</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dataset.category}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={dataset.creatorAvatar}
                  alt={dataset.creator}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">{dataset.creator}</div>
                  <div className="text-sm text-gray-600">제작자</div>
                </div>
              </div>
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                프로필 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
