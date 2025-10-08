import React from 'react';
import { Filter, X } from 'lucide-react';

export const FilterBar = ({
  filters,
  onFiltersChange,
  onToggleAdvanced,
  showAdvanced
}) => {
  const modalityOptions = ['LLM', 'VLM', '이미지'];
  const licenseOptions = ['연구용', '상업용', '온프렘', 'FT'];

  const toggleFilter = (type, value) => {
    const currentArray = filters[type];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    onFiltersChange({
      ...filters,
      [type]: newArray
    });
  };

  const hasActiveFilters = filters.modality.length > 0 || filters.license.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">빠른 필터</h2>
        <button
          onClick={onToggleAdvanced}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>{showAdvanced ? '고급 필터 숨기기' : '고급 필터'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Modality */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">모달리티:</span>
          <div className="flex space-x-2">
            {modalityOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleFilter('modality', option)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.modality.includes(option)
                    ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* License */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">라이선스:</span>
          <div className="flex space-x-2">
            {licenseOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleFilter('license', option)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.license.includes(option)
                    ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">가격 범위:</span>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.priceRange[1]}
              onChange={(e) => onFiltersChange({
                ...filters,
                priceRange: [0, Number(e.target.value)]
              })}
              className="w-24 accent-blue-600"
            />
            <span className="text-xs text-gray-600 min-w-[60px]">~{filters.priceRange[1]} SOL</span>
          </div>
        </div>

        {/* Minimum Performance */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">최소 성능:</span>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minPerformance}
              onChange={(e) => onFiltersChange({
                ...filters,
                minPerformance: Number(e.target.value)
              })}
              className="w-24 accent-blue-600"
            />
            <span className="text-xs text-gray-600 min-w-[40px]">{filters.minPerformance}%</span>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => onFiltersChange({
              search: filters.search,
              modality: [],
              license: [],
              priceRange: [0, 1000],
              minPerformance: 0
            })}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-3 w-3" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>
    </div>
  );
};