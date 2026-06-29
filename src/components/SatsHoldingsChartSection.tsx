import React, { useState } from "react";
import SatsHoldingsChart from "./SatsHoldingsChart";
import PortfolioValueChart from "./PortfolioValueChart";

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";
type ChartView = "sats" | "usd";

const TIME_RANGES: { label: string; value: TimeRange; days: number | null }[] =
  [
    { label: "1M", value: "1M", days: 30 },
    { label: "3M", value: "3M", days: 90 },
    { label: "6M", value: "6M", days: 180 },
    { label: "1Y", value: "1Y", days: 365 },
    { label: "ALL", value: "ALL", days: null },
  ];

interface SatsHoldingsChartSectionProps {}

const SatsHoldingsChartSection: React.FC<SatsHoldingsChartSectionProps> =
  () => {
    const [timeRange, setTimeRange] = useState<TimeRange>("3M");
    const [chartView, setChartView] = useState<ChartView>("sats");

    const activeRange = TIME_RANGES.find((r) => r.value === timeRange)!;

    return (
      <>
        {/* Chart Header */}
        <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#F7F3E3]">
              {chartView === "sats"
                ? "Sats Holdings Over Time"
                : "Portfolio Value Over Time"}
            </h2>
            {/* View toggle + Time range pills */}
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex bg-[rgba(247,243,227,0.04)] rounded-lg p-0.5">
                <button
                  onClick={() => setChartView("sats")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                    chartView === "sats"
                      ? "bg-[#f7931a] text-black shadow-sm"
                      : "text-[rgba(247,243,227,0.5)] hover:text-[#F7F3E3] hover:bg-[rgba(247,243,227,0.08)]"
                  }`}
                >
                  Sats
                </button>
                <button
                  onClick={() => setChartView("usd")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                    chartView === "usd"
                      ? "bg-[#22c55e] text-black shadow-sm"
                      : "text-[rgba(247,243,227,0.5)] hover:text-[#F7F3E3] hover:bg-[rgba(247,243,227,0.08)]"
                  }`}
                >
                  USD
                </button>
              </div>
              {/* Time range pills */}
              <div className="flex bg-[rgba(247,243,227,0.04)] rounded-lg p-0.5">
                {TIME_RANGES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setTimeRange(value)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                      timeRange === value
                        ? "bg-[#f7931a] text-black shadow-sm"
                        : "text-[rgba(247,243,227,0.5)] hover:text-[#F7F3E3] hover:bg-[rgba(247,243,227,0.08)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <div className="w-full h-full">
            {chartView === "sats" ? (
              <SatsHoldingsChart days={activeRange.days} />
            ) : (
              <PortfolioValueChart days={activeRange.days} />
            )}
          </div>
        </div>
      </>
    );
  };

export default SatsHoldingsChartSection;