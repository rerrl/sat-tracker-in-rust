import React from "react";

interface AnalyticsSectionProps {
  portfolioMetrics: any;
  metricsLoading: boolean;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  portfolioMetrics,
  metricsLoading,
}) => {
  console.log(portfolioMetrics);
  return (
    <div className="p-4 border-b border-[rgba(247,243,227,0.1)] flex-shrink-0">
      <h3 className="text-sm font-medium text-[#F7F3E3] mb-3">
        Portfolio Insights
      </h3>

      <div className="space-y-3">
        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Average Buy Price
          </div>
          <div className="text-sm text-lightgreen">
            {metricsLoading
              ? "..."
              : portfolioMetrics?.avg_buy_price
              ? `$${portfolioMetrics.avg_buy_price.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              : "No buys yet"}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            {metricsLoading
              ? "..."
              : `${(
                  portfolioMetrics?.total_sats_stacked || 0
                ).toLocaleString()} sats stacked`}
          </div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Total Invested
          </div>
          <div className="text-sm text-[#f7931a]">
            {metricsLoading
              ? "..."
              : `$${(
                  (portfolioMetrics?.total_invested_cents || 0) / 100
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            {metricsLoading
              ? "..."
              : portfolioMetrics?.avg_sell_price
              ? `Avg sell: $${portfolioMetrics.avg_sell_price.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }
                )}`
              : "No sells yet"}
          </div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Recent Activity
          </div>
          <div className="text-sm text-[#61dafb]">
            {metricsLoading
              ? "..."
              : `${(
                  portfolioMetrics?.sats_stacked_7d || 0
                ).toLocaleString()} sats`}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            Last 7 days
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
