import React, { useState, useEffect } from 'react';
import { Search, Bot, Database, User, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cachedFetch } from '../../utils/apiCache';

export const SearchOverlay = ({ query, onClose, onSelect }) => {
  const [results, setResults] = useState({
    models: [],
    datasets: [],
    creators: [],
    loading: false
  });
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // 로컬 스토리지에서 최근 검색어 불러오기
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ models: [], datasets: [], creators: [], loading: false });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setResults(prev => ({ ...prev, loading: true }));
      
      try {
        // 실제 환경에서는 백엔드 검색 API 호출
        // 현재는 모델 데이터에서 검색
        const modelsData = await cachedFetch('/api/models', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }, 2 * 60 * 1000); // 2분 캐시

        const searchResults = performSearch(query, modelsData);
        setResults({
          ...searchResults,
          loading: false
        });
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ models: [], datasets: [], creators: [], loading: false });
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = (searchQuery, modelsData) => {
    const lowerQuery = searchQuery.toLowerCase();
    
    // 모델 검색
    const models = modelsData.filter(model => 
      model.name?.toLowerCase().includes(lowerQuery) ||
      model.uploader?.toLowerCase().includes(lowerQuery) ||
      model.modality?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    // 모의 데이터셋 검색 (실제로는 별도 API 호출)
    const datasets = [
      { id: '1', name: 'Korean Conversation Dataset', creator: '한국AI연구소', type: 'dataset' },
      { id: '2', name: 'Medical Image Dataset', creator: '의료AI팀', type: 'dataset' },
      { id: '3', name: 'Code Generation Dataset', creator: '개발자커뮤니티', type: 'dataset' }
    ].filter(dataset =>
      dataset.name.toLowerCase().includes(lowerQuery) ||
      dataset.creator.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    // 제작자 검색
    const creators = [...new Set(modelsData.map(m => m.uploader))]
      .filter(creator => creator?.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map(creator => ({ name: creator, type: 'creator' }));

    return { models, datasets, creators };
  };

  const saveRecentSearch = (searchTerm) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelect = (item, type) => {
    saveRecentSearch(query);
    onSelect(item);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      {query.trim() ? (
        <div className="p-4">
          {results.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              <span className="ml-2 text-gray-600">검색 중...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Models */}
              {results.models.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Bot className="h-4 w-4 mr-2 text-blue-600" />
                    모델 ({results.models.length})
                  </h3>
                  <div className="space-y-2">
                    {results.models.map(model => (
                      <Link
                        key={model.id}
                        to={`/model/${model.id}`}
                        onClick={() => handleSelect(model, 'model')}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {model.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {model.uploader} • {model.modality}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Datasets */}
              {results.datasets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2 text-green-600" />
                    데이터셋 ({results.datasets.length})
                  </h3>
                  <div className="space-y-2">
                    {results.datasets.map(dataset => (
                      <Link
                        key={dataset.id}
                        to={`/datasets/${dataset.id}`}
                        onClick={() => handleSelect(dataset, 'dataset')}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Database className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {dataset.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {dataset.creator}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Creators */}
              {results.creators.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-purple-600" />
                    제작자 ({results.creators.length})
                  </h3>
                  <div className="space-y-2">
                    {results.creators.map((creator, index) => (
                      <Link
                        key={index}
                        to={`/creator/${encodeURIComponent(creator.name)}`}
                        onClick={() => handleSelect(creator, 'creator')}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {creator.name}
                          </div>
                          <div className="text-xs text-gray-600">제작자</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.models.length === 0 && results.datasets.length === 0 && results.creators.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">"{query}"에 대한 검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-500 mt-1">다른 키워드로 검색해보세요</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Recent Searches
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-600" />
              최근 검색
            </h3>
            {recentSearches.length > 0 && (
              <button
                onClick={clearRecentSearches}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                전체 삭제
              </button>
            )}
          </div>
          
          {recentSearches.length > 0 ? (
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // 검색어를 입력 필드에 설정하고 검색 실행
                    const event = new Event('input', { bubbles: true });
                    const input = document.querySelector('input[placeholder*="모델 검색"]');
                    if (input) {
                      input.value = search;
                      input.dispatchEvent(event);
                    }
                  }}
                  className="flex items-center space-x-2 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">최근 검색 기록이 없습니다</p>
            </div>
          )}

          {/* Popular Searches */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-gray-600" />
              인기 검색어
            </h3>
            <div className="flex flex-wrap gap-2">
              {['GPT-4', 'Claude', 'Llama', '한국어', '이미지 생성', '코딩'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const event = new Event('input', { bubbles: true });
                    const input = document.querySelector('input[placeholder*="모델 검색"]');
                    if (input) {
                      input.value = tag;
                      input.dispatchEvent(event);
                    }
                  }}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};