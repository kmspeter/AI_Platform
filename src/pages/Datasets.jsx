import React, { useState, useMemo } from 'react';
import { Database, Download, Eye, ShoppingCart, Filter, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { convertSolToLamports, formatLamports, lamportsToSol } from '../utils/currency';

export const Datasets = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: [],
    format: [],
    license: [],
    priceRange: [0, convertSolToLamports(1000)],
    minSize: 0
  });
  const [sortBy, setSortBy] = useState('popular');

  const mockDatasets = [
    {
      id: '1',
      name: 'Korean Conversation Dataset',
      creator: '한국AI연구소',
      description: '한국어 일상 대화 데이터셋으로 챗봇 훈련에 최적화되어 있습니다.',
      category: '대화',
      format: 'JSON',
      license: '상업용',
      size: '2.5GB',
      samples: 150000,
      pricing: { type: 'paid', amount: convertSolToLamports(50), currency: 'LAMPORTS' },
      rating: 4.8,
      downloads: 1250,
      thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300',
      tags: ['한국어', '대화', '챗봇'],
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Medical Image Dataset',
      creator: '의료AI팀',
      description: '의료 영상 진단을 위한 고품질 이미지 데이터셋입니다.',
      category: '이미지',
      format: 'PNG',
      license: '연구용',
      size: '15GB',
      samples: 50000,
      pricing: { type: 'paid', amount: convertSolToLamports(200), currency: 'LAMPORTS' },
      rating: 4.9,
      downloads: 850,
      thumbnail: 'https://images.pexels.com/photos/6153354/pexels-photo-6153354.jpeg?auto=compress&cs=tinysrgb&w=300',
      tags: ['의료', '이미지', '진단'],
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      name: 'Code Generation Dataset',
      creator: '개발자커뮤니티',
      description: '다양한 프로그래밍 언어의 코드 생성 데이터셋입니다.',
      category: '코드',
      format: 'JSONL',
      license: '오픈소스',
      size: '5.2GB',
      samples: 300000,
      pricing: { type: 'free' },
      rating: 4.6,
      downloads: 2100,
      thumbnail: 'https://images.pexels.com/photos/8728380/pexels-photo-8728380.jpeg?auto=compress&cs=tinysrgb&w=300',
      tags: ['코딩', '프로그래밍', '무료'],
      createdAt: '2024-01-10'
    },
    {
      id: '4',
      name: 'Financial News Dataset',
      creator: '금융데이터랩',
      description: '금융 뉴스 분석을 위한 텍스트 데이터셋입니다.',
      category: '텍스트',
      format: 'CSV',
      license: '상업용',
      size: '1.8GB',
      samples: 80000,
      pricing: { type: 'paid', amount: convertSolToLamports(75), currency: 'LAMPORTS' },
      rating: 4.7,
      downloads: 650,
      thumbnail: 'https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=300',
      tags: ['금융', '뉴스', '분석'],
      createdAt: '2024-01-08'
    }
  ];

  const categories = ['대화', '이미지', '코드', '텍스트', '음성'];
  const formats = ['JSON', 'CSV', 'JSONL', 'PNG', 'WAV'];
  const licenses = ['상업용', '연구용', '오픈소스'];

  const filteredDatasets = useMemo(() => {
    return mockDatasets.filter(dataset => {
      if (filters.search && !dataset.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !dataset.creator.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category.length > 0 && !filters.category.includes(dataset.category)) {
        return false;
      }
      if (filters.format.length > 0 && !filters.format.includes(dataset.format)) {
        return false;
      }
      if (filters.license.length > 0 && !filters.license.includes(dataset.license)) {
        return false;
      }
      if (dataset.pricing.type === 'paid' && dataset.pricing.amount > filters.priceRange[1]) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.downloads - a.downloads;
        case 'rating': return b.rating - a.rating;
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'price': return (a.pricing.amount || 0) - (b.pricing.amount || 0);
        default: return 0;
      }
    });
  }, [filters, sortBy]);

  const toggleFilter = (type, value) => {
    const currentArray = filters[type];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFilters({
      ...filters,
      [type]: newArray
    });
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">데이터셋 마켓</h1>
            <p className="text-gray-600 mt-2">AI 모델 훈련을 위한 고품질 데이터셋을 찾아보세요</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                placeholder="데이터셋 검색..."
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="popular">인기순</option>
              <option value="rating">평점순</option>
              <option value="newest">최신순</option>
              <option value="price">가격순</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Filters Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">필터</h3>
          
          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">카테고리</label>
              <div className="space-y-2">
                {categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.category.includes(category)}
                      onChange={() => toggleFilter('category', category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">포맷</label>
              <div className="space-y-2">
                {formats.map(format => (
                  <label key={format} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.format.includes(format)}
                      onChange={() => toggleFilter('format', format)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">라이선스</label>
              <div className="space-y-2">
                {licenses.map(license => (
                  <label key={license} className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.license.includes(license)}
                      onChange={() => toggleFilter('license', license)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">{license}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                가격 범위: ~{formatLamports(filters.priceRange[1])}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                value={lamportsToSol(filters.priceRange[1])}
                onChange={(e) => setFilters({
                  ...filters,
                  priceRange: [0, convertSolToLamports(Number(e.target.value))]
                })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <p className="text-gray-600">{filteredDatasets.length}개의 데이터셋이 있습니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDatasets.map(dataset => (
              <div key={dataset.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
                {/* Header */}
                <div className="flex items-start space-x-3 mb-4">
                  <img 
                    src={dataset.thumbnail} 
                    alt={dataset.name}
                    className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{dataset.name}</h3>
                    <p className="text-sm text-gray-600">{dataset.creator}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{dataset.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-bold text-gray-900">{dataset.samples.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">샘플</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-bold text-gray-900">{dataset.size}</div>
                    <div className="text-xs text-gray-600">크기</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {dataset.category}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {dataset.format}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    {dataset.license}
                  </span>
                </div>

                {/* Rating & Downloads */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900">{dataset.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{dataset.downloads}</span>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {dataset.pricing.type === 'free' ? (
                      <span className="font-semibold text-green-600">무료</span>
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {formatLamports(dataset.pricing.amount)}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                      <Eye className="h-4 w-4 inline mr-1" />
                      미리보기
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                      <ShoppingCart className="h-4 w-4 inline mr-1" />
                      구매
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDatasets.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-4">조건에 맞는 데이터셋이 없습니다</p>
              <button
                onClick={() => setFilters({
                  search: '',
                  category: [],
                  format: [],
                  license: [],
                  priceRange: [0, 1000],
                  minSize: 0
                })}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};