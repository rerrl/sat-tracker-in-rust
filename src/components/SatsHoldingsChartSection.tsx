import React, { useState } from 'react';
import { BalanceChangeEvent } from '../services/tauriService';
import SatsHoldingsChart from './SatsHoldingsChart';

interface SatsHoldingsChartSectionProps {
  events: BalanceChangeEvent[];
}

const SatsHoldingsChartSection: React.FC<SatsHoldingsChartSectionProps> = ({ events }) => {
  const [showPremiumTag, setShowPremiumTag] = useState(false);

  return (
    <>
      {/* Chart Header */}
      <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#F7F3E3]">
            Sats Holdings Over Time
          </h2>
          <div className="relative group">
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-xs bg-gradient-to-r from-[#f7931a] to-[#61dafb] text-black px-2 py-0.5 rounded font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              PREMIUM
            </span>
            <button
              disabled
              className="text-xs text-[rgba(247,243,227,0.6)] bg-[rgba(247,243,227,0.1)] border border-[rgba(247,243,227,0.2)] px-3 py-1 rounded cursor-not-allowed opacity-60 flex items-center gap-2"
            >
              <div className="w-3 h-3 border border-[rgba(247,243,227,0.4)] rounded-sm bg-[rgba(247,243,227,0.05)] flex items-center justify-center">
                {/* Empty checkbox - would show checkmark when enabled */}
              </div>
              <span>Show USD Overlay</span>
            </button>
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
