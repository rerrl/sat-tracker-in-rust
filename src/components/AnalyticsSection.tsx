import React, { useState, useEffect } from "react";
import { PortfolioMetrics } from "../services/tauriService";

interface AnalyticsSectionProps {
  portfolioMetrics: PortfolioMetrics | null;
  metricsLoading: boolean;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  portfolioMetrics,
  metricsLoading,
}) => {
  const [selectedAnalyticsPage, setSelectedAnalyticsPage] = useState<
    "buys-sells" | "more-metrics"
  >("buys-sells");
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);

  // Close analytics dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAnalyticsDropdown) {
        const target = event.target as Element;
        if (!target.closest(".analytics-dropdown")) {
          setShowAnalyticsDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAnalyticsDropdown]);

  return (
    <div className="h-1/2 border-b border-[rgba(247,243,227,0.2)] flex flex-col">
      <div className="p-4 pb-2 shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-md font-semibold text-[#F7F3E3]">Analytics</h2>
          <div className="relative analytics-dropdown">
            <button
              onClick={() => setShowAnalyticsDropdown(!showAnalyticsDropdown)}
              className="text-xs text-[rgba(247,243,227,0.5)] bg-[rgba(247,243,227,0.1)] px-2 py-1 rounded hover:bg-[rgba(247,243,227,0.15)] flex items-center gap-1"
            >
              {selectedAnalyticsPage === "buys-sells"
                ? "Buys/Sells"
                : "More Metrics"}
              <span className="text-[10px]">▼</span>
            </button>
            {showAnalyticsDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setSelectedAnalyticsPage("buys-sells");
                    setShowAnalyticsDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                    selectedAnalyticsPage === "buys-sells"
                      ? "text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]"
                      : "text-[rgba(247,243,227,0.7)]"
                  }`}
                >
                  Buys/Sells
                </button>
                <button
                  onClick={() => {
                    setSelectedAnalyticsPage("more-metrics");
                    setShowAnalyticsDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                    selectedAnalyticsPage === "more-metrics"
                      ? "text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]"
                      : "text-[rgba(247,243,227,0.7)]"
                  }`}
                >
                  More Metrics
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 pb-2 overflow-y-auto">
        {selectedAnalyticsPage === "buys-sells" ? (
          <div className="space-y-3">
            {/* Existing Buys Section */}
            <div>
              <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Buys
              </h3>
              <div className="space-y-1">
                {/* Row 1: Avg Buy Price & Total Invested */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Avg Buy Price
                    </div>
                    <div className="text-xs text-lightgreen font-medium">
                      {metricsLoading
                        ? "..."
                        : portfolioMetrics?.avg_buy_price
                        ? `$${portfolioMetrics.avg_buy_price.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}`
                        : "-"}
                    </div>
                  </div>
                  <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Total Invested
                    </div>
                    <div className="text-xs text-lightgreen font-medium">
                      {metricsLoading
                        ? "..."
                        : `$${(
                            (portfolioMetrics?.total_invested_cents || 0) / 100
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </div>
                  </div>
                </div>
                {/* Row 2: Total Sats Stacked (single column) */}
                <div className="text-center p-1.5 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
                  <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                    Total Sats Stacked
                  </div>
                  <div className="text-xs text-lightgreen font-medium">
                    {metricsLoading
                      ? "..."
                      : portfolioMetrics?.total_sats_stacked.toLocaleString() ||
                        "0"}
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Sells Section */}
            <div>
              <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Sells
              </h3>
              <div className="space-y-1">
                {/* Row 1: Avg Sell Price & Fiat Extracted */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Avg Sell Price
                    </div>
                    <div className="text-xs text-lightcoral font-medium">
                      {metricsLoading
                        ? "..."
                        : portfolioMetrics?.avg_sell_price
                        ? `$${portfolioMetrics.avg_sell_price.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}`
                        : "-"}
                    </div>
                  </div>
                  <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Fiat Extracted
                    </div>
                    <div className="text-xs text-lightcoral font-medium">
                      {metricsLoading
                        ? "..."
                        : `$${(
                            (portfolioMetrics?.fiat_extracted_cents || 0) / 100
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </div>
                  </div>
                </div>
                {/* Row 2: Total Sats Spent (single column) */}
                <div className="text-center p-1.5 bg-[rgba(240,128,128,0.1)] border border-[rgba(240,128,128,0.2)] rounded">
                  <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                    Total Sats Spent
                  </div>
                  <div className="text-xs text-lightcoral font-medium">
                    {metricsLoading
                      ? "..."
                      : portfolioMetrics?.total_sats_spent.toLocaleString() ||
                        "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 7-Day Metrics Section */}
            <div>
              <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                7-Day Activity
              </h3>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Sats Stacked
                    </div>
                    <div className="text-xs text-[#61dafb] font-medium">
                      {metricsLoading
                        ? "..."
                        : portfolioMetrics?.sats_stacked_7d?.toLocaleString() ||
                          "0"}
                    </div>
                  </div>
                  <div className="text-center p-1.5 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      USD Invested
                    </div>
                    <div className="text-xs text-[#61dafb] font-medium">
                      {metricsLoading
                        ? "..."
                        : `$${(
                            (portfolioMetrics?.usd_invested_7d_cents || 0) / 100
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 31-Day Metrics Section */}
            <div>
              <h3 className="text-xs font-semibold text-[#F7F3E3] mb-1 border-b border-[rgba(247,243,227,0.2)] pb-1">
                31-Day Activity
              </h3>
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      Sats Stacked
                    </div>
                    <div className="text-xs text-[gold] font-medium">
                      {metricsLoading
                        ? "..."
                        : portfolioMetrics?.sats_stacked_31d?.toLocaleString() ||
                          "0"}
                    </div>
                  </div>
                  <div className="text-center p-1.5 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] rounded">
                    <div className="text-xs text-[rgba(247,243,227,0.6)] mb-0.5">
                      USD Invested
                    </div>
                    <div className="text-xs text-[gold] font-medium">
                      {metricsLoading
                        ? "..."
                        : `$${(
                            (portfolioMetrics?.usd_invested_31d_cents || 0) / 100
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSection;
