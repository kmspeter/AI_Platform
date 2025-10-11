import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLamports } from '../../utils/currency';

export const ComparisonOverlay = ({ models, onClose, onRemove }) => {
  if (models.length === 0) return null;

  const allMetrics = [
    ...new Set(
      models.flatMap(model =>
        (model.metricDisplay || model.metricHighlights || []).map(metric => metric.key || metric.label)
      )
    )
  ];

  const resolveMetricInfo = (metricKey) => {
    for (const model of models) {
      const metric = (model.metricDisplay || model.metricHighlights || []).find(
        item => item.key === metricKey || item.label === metricKey
      );

      if (metric) {
        return metric;
      }
    }

    return { label: metricKey, formattedValue: '-', description: '' };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">모델 비교</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${models.length}, 1fr)` }}>
              {/* Headers */}
              <div className="font-medium text-gray-900"></div>
              {models.map(model => (
                <div key={model.id} className="text-center">
                  <div className="flex items-center justify-between mb-2">
                    <img src={model.thumbnail} alt={model.name} className="w-8 h-8 rounded object-cover" />
                    <button
                      onClick={() => onRemove(model.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{model.name}</h3>
                  <p className="text-xs text-gray-600">{model.creator}</p>
                </div>
              ))}

              {/* Basic Info */}
              <div className="font-medium text-gray-700 py-3">기본 정보</div>
              {models.map(model => (
                <div key={`${model.id}-basic`} className="py-3 space-y-1">
                  <div className="text-sm text-gray-900">{model.version}</div>
                  <div className="text-xs text-gray-600">{model.modality}</div>
                </div>
              ))}

              {/* Pricing */}
              <div className="font-medium text-gray-700 py-3">가격</div>
              {models.map(model => (
                <div key={`${model.id}-price`} className="py-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {model.pricing.type === 'free' ? '무료' : formatLamports(model.pricing.amount)}
                  </div>
                  <div className="text-xs text-gray-600">{model.license}</div>
                </div>
              ))}

              {/* Metrics */}
              {allMetrics.map(metricKey => {
                const info = resolveMetricInfo(metricKey);

                return (
                  <React.Fragment key={metricKey}>
                    <div className="font-medium text-gray-700 py-3">
                      <div className="text-sm text-gray-900">{info.label}</div>
                      {info.description && (
                        <div className="text-xs text-gray-500 mt-1">{info.description}</div>
                      )}
                    </div>
                    {models.map(model => {
                      const metric = (model.metricDisplay || model.metricHighlights || []).find(
                        item => item.key === metricKey || item.label === metricKey
                      );

                      return (
                        <div key={`${model.id}-${metricKey}`} className="py-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {metric ? metric.formattedValue : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Actions */}
              <div className="font-medium text-gray-700 py-3">액션</div>
              {models.map(model => (
                <div key={`${model.id}-actions`} className="py-3 space-y-2">
                  <Link
                    to={`/playground?model=${model.id}`}
                    className="block w-full px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                  >
                    체험
                  </Link>
                  <Link
                    to={`/model/${model.id}`}
                    className="block w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    자세히
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};