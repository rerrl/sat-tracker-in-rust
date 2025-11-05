import React, { useState } from 'react';
import { BalanceChangeEvent } from '../services/tauriService';
import SatsHoldingsChart from './SatsHoldingsChart';

interface SatsHoldingsChartSectionProps {
  events: BalanceChangeEvent[];
}

const SatsHoldingsChartSection: React.FC<SatsHoldingsChartSectionProps> = ({ events }) => {
  const [selectedChartPage, setSelectedChartPage] = useState<'sat-balance' | 'coming-soon'>('sat-balance');
  const [showChartDropdown, setShowChartDropdown] = useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChartDropdown) {
        const target = event.target as Element;
        if (!target.closest('.chart-dropdown')) {
          setShowChartDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChartDropdown]);

  return (
    <>
      {/* Chart Header */}
      <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#F7F3E3]">
            Sats Holdings Over Time
          </h2>
          <div className="relative chart-dropdown">
            <button
              onClick={() => setShowChartDropdown(!showChartDropdown)}
              className="text-xs text-[rgba(247,243,227,0.5)] bg-[rgba(247,243,227,0.1)] px-2 py-1 rounded hover:bg-[rgba(247,243,227,0.15)] flex items-center gap-1"
            >
              {selectedChartPage === 'sat-balance' ? 'Sat Balance' : 'Coming Soon'}
              <span className="text-[10px]">▼</span>
            </button>
            {showChartDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setSelectedChartPage('sat-balance');
                    setShowChartDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                    selectedChartPage === 'sat-balance' ? 'text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]' : 'text-[rgba(247,243,227,0.7)]'
                  }`}
                >
                  Sat Balance
                </button>
                <button
                  disabled
                  className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed opacity-50"
                >
                  Coming Soon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4 min-h-0 overflow-hidden">
        <div className="w-full h-full">
          <SatsHoldingsChart events={events} />
        </div>
      </div>
    </>
  );
};

export default SatsHoldingsChartSection;
