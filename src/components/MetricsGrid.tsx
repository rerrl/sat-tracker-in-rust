import React, { useState } from 'react';

export interface MetricItem {
  label: string;
  value: string;
  color: 'orange' | 'green' | 'blue' | 'red';
  subValue?: string;
  subValueColor?: 'green' | 'red';
  hint?: string;
}

export interface BitcoinPriceMetric {
  price: number;
  percentChange24hr: number | null;
  isLoading: boolean;
  isManualMode: boolean;
  isEditing: boolean;
  inputValue: string;
  onModeToggle: () => void;
  onPriceClick: () => void;
  onInputChange: (value: string) => void;
  onInputBlur: () => void;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
}

interface MetricsGridProps {
  bitcoinPrice?: BitcoinPriceMetric;
  metrics: MetricItem[];
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ bitcoinPrice, metrics }) => {
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);
  const [hoveredBitcoinPrice, setHoveredBitcoinPrice] = useState(false);
  const getColorClasses = (color: 'orange' | 'green' | 'blue' | 'red') => {
    switch (color) {
      case 'orange':
        return {
          bg: 'bg-[rgba(247,147,26,0.1)]',
          border: 'border-[rgba(247,147,26,0.2)]',
          text: 'text-[#f7931a]'
        };
      case 'green':
        return {
          bg: 'bg-[rgba(144,238,144,0.1)]',
          border: 'border-[rgba(144,238,144,0.2)]',
          text: 'text-lightgreen'
        };
      case 'blue':
        return {
          bg: 'bg-[rgba(97,218,251,0.1)]',
          border: 'border-[rgba(97,218,251,0.2)]',
          text: 'text-[#61dafb]'
        };
      case 'red':
        return {
          bg: 'bg-[rgba(240,128,128,0.1)]',
          border: 'border-[rgba(240,128,128,0.2)]',
          text: 'text-lightcoral'
        };
      default:
        return {
          bg: 'bg-[rgba(247,147,26,0.1)]',
          border: 'border-[rgba(247,147,26,0.2)]',
          text: 'text-[#f7931a]'
        };
    }
  };

  return (
    <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
      <div className="flex gap-3 mb-3">
        {/* Bitcoin Price (if provided) */}
        {bitcoinPrice && (
          <div 
            className="flex-1 text-center p-2 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded relative"
            onMouseEnter={() => setHoveredBitcoinPrice(true)}
            onMouseLeave={() => setHoveredBitcoinPrice(false)}
          >
            <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1 flex items-center justify-center gap-1">
              Bitcoin Price
              <button
                onClick={bitcoinPrice.onModeToggle}
                className={`text-[10px] px-1 rounded ${
                  !bitcoinPrice.isManualMode
                    ? "bg-[rgba(144,238,144,0.2)] hover:bg-[rgba(144,238,144,0.3)] text-lightgreen"
                    : "bg-[rgba(255,165,0,0.2)] hover:bg-[rgba(255,165,0,0.3)] text-orange"
                }`}
                title={
                  !bitcoinPrice.isManualMode
                    ? "Switch to manual mode"
                    : "Switch to live mode"
                }
              >
                {!bitcoinPrice.isManualMode ? "Live" : "Manual"}
              </button>
            </div>
            {bitcoinPrice.isEditing ? (
              <input
                type="text"
                value={bitcoinPrice.inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    bitcoinPrice.onInputChange(value);
                  }
                }}
                onBlur={bitcoinPrice.onInputBlur}
                onKeyDown={bitcoinPrice.onInputKeyDown}
                className="w-full bg-[rgba(9,12,8,0.8)] border border-[rgba(97,218,251,0.5)] text-[#61dafb] text-sm font-medium text-center px-1 py-0 rounded"
                autoFocus
              />
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className={`text-sm text-[#61dafb] font-medium rounded px-1 py-0 ${
                    bitcoinPrice.isManualMode
                      ? "cursor-pointer hover:bg-[rgba(97,218,251,0.1)]"
                      : "cursor-default"
                  }`}
                  onClick={bitcoinPrice.onPriceClick}
                  title={
                    bitcoinPrice.isManualMode
                      ? "Click to edit price"
                      : "Click 'Live' to enter manual mode"
                  }
                >
                  {bitcoinPrice.isLoading && !bitcoinPrice.isManualMode
                    ? "..."
                    : `$${bitcoinPrice.price.toLocaleString()}`}
                </div>
                {!bitcoinPrice.isManualMode &&
                  bitcoinPrice.percentChange24hr !== null &&
                  !bitcoinPrice.isLoading && (
                    <div
                      className={`text-xs font-medium ${
                        bitcoinPrice.percentChange24hr >= 0
                          ? "text-lightgreen"
                          : "text-lightcoral"
                      }`}
                    >
                      {bitcoinPrice.percentChange24hr >= 0 ? "+" : ""}
                      {bitcoinPrice.percentChange24hr.toFixed(2)}% (24hr)
                    </div>
                  )}
              </div>
            )}
            {/* Custom Tooltip for Bitcoin Price */}
            {hoveredBitcoinPrice && (
              <div className="absolute top-full left-0 mt-2 px-2 py-1 bg-black text-[#f7f3e3] text-xs rounded whitespace-nowrap z-50 shadow-lg">
                Current Bitcoin price with 24-hour percentage change
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
              </div>
            )}
          </div>
        )}

        {/* Other Metrics */}
        {metrics.map((metric, index) => {
          const colorClasses = getColorClasses(metric.color);
          return (
            <div
              key={index}
              className={`flex-1 text-center p-2 ${colorClasses.bg} border ${colorClasses.border} rounded relative`}
              onMouseEnter={() => setHoveredMetric(index)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                {metric.label}
              </div>
              <div className={`text-sm ${colorClasses.text} font-medium`}>
                {metric.value}
              </div>
              {metric.subValue && (
                <div
                  className={`text-xs font-medium ${
                    metric.subValueColor === 'green'
                      ? 'text-lightgreen'
                      : metric.subValueColor === 'red'
                      ? 'text-lightcoral'
                      : 'text-[rgba(247,243,227,0.5)]'
                  }`}
                >
                  {metric.subValue}
                </div>
              )}
              {/* Custom Tooltip */}
              {metric.hint && hoveredMetric === index && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-[#f7f3e3] text-xs rounded whitespace-nowrap z-50 shadow-lg">
                  {metric.hint}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsGrid;
