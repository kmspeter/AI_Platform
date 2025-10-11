import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLamports } from '../../utils/currency';

export const ModelCard = ({ 
  model, 
  onAddToComparison, 
  isComparing 
}) => {
  const getModalityColor = (modality) => {
    switch (modality) {
      case 'LLM': return 'bg-blue-100 text-blue-800';
      case 'VLM': return 'bg-purple-100 text-purple-800';
      case '이미지': return 'bg-green-100 text-green-800';
      case '오디오': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLicenseColor = (license) => {
    switch (license) {
      case '연구용': return 'bg-amber-100 text-amber-800';
      case '상업용': return 'bg-emerald-100 text-emerald-800';
      case '온프렘': return 'bg-indigo-100 text-indigo-800';
      case 'FT': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const metricHighlights = Array.isArray(model.metricHighlights) && model.metricHighlights.length > 0
    ? model.metricHighlights
    : Object.entries(model.metrics).slice(0, 2).map(([key, value]) => ({
        key,
        label: key,
        formattedValue: typeof value === 'number' ? value.toString() : String(value),
      }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <img 
          src={model.thumbnail} 
          alt={model.name}
          className="w-12 h-12 rounded-lg object-cover ring-1 ring-gray-200"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
            {model.name}
          </h3>
          <p className="text-sm text-gray-600">{model.creator}</p>
        </div>
        <button
          onClick={() => onAddToComparison(model)}
          className={`p-2 rounded-lg transition-all ${
            isComparing 
              ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="비교에 추가"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Top 2 Metrics Only */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {metricHighlights.map((metric) => (
          <div key={metric.key || metric.label} className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 uppercase font-medium truncate">{metric.label}</div>
            <div className="text-lg font-bold text-gray-900">{metric.formattedValue}</div>
          </div>
        ))}
      </div>

      {/* Tags - Only 2 chips for modality and license */}
      <div className="flex space-x-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModalityColor(model.modality)}`}>
          {model.modality}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLicenseColor(model.license)}`}>
          {model.license}
        </span>
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {model.pricing.type === 'free' ? (
            <span className="font-semibold text-green-600">무료</span>
          ) : (
            <span className="font-semibold text-gray-900">
              {formatLamports(model.pricing.amount)}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/playground?model=${model.id}`}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            체험
          </Link>
          <Link
            to={`/model/${model.id}`}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            자세히
          </Link>
        </div>
      </div>
    </div>
  );
};