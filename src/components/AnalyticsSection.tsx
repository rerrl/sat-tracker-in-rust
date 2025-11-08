import React from "react";

interface AnalyticsSectionProps {
  portfolioMetrics: any;
  metricsLoading: boolean;
  toolType?: 'overview' | 'activity';
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  portfolioMetrics,
  metricsLoading,
  toolType = 'overview',
}) => {
  const getPremiumTeaseCards = () => {
    if (toolType === 'activity') {
      return [
        {
          title: "Historical Streaks",
          value: "47 weeks",
          subtitle: "Best streak in 2023",
          description: "Track your longest stacking streaks by year"
        },
        {
          title: "Yearly Comparison",
          value: "+127%",
          subtitle: "vs last year",
          description: "Compare stacking performance across years"
        },
        {
          title: "Monthly Patterns",
          value: "December",
          subtitle: "Best month",
          description: "Discover your most productive stacking months"
        }
      ];
    } else {
      return [
        {
          title: "Historical Performance",
          value: "+342%",
          subtitle: "All-time ROI",
          description: "Track portfolio performance over time"
        },
        {
          title: "Price Analysis",
          value: "$42,150",
          subtitle: "Best buy timing",
          description: "Analyze your buy timing vs market peaks"
        },
        {
          title: "Profit Timeline",
          value: "18 months",
          subtitle: "Time to profit",
          description: "Historical breakeven analysis"
        }
      ];
    }
  };

  const premiumCards = getPremiumTeaseCards();
  return (
    <div className="p-4">
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

      {/* Premium Tease Section */}
      <div className="mt-6 pt-4 border-t border-[rgba(247,243,227,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#F7F3E3]">
            Historical Analytics
          </h3>
          <span className="text-xs bg-gradient-to-r from-[#f7931a] to-[#61dafb] text-black px-2 py-1 rounded font-medium">
            PREMIUM
          </span>
        </div>

        <div className="space-y-3">
          {premiumCards.map((card, index) => (
            <div
              key={index}
              className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]"
            >
              <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                {card.title}
              </div>
              <div className="relative">
                <div className="text-sm text-lightgreen mb-1 blur-sm select-none">
                  {card.value}
                </div>
                <div className="absolute inset-0 flex items-center">
                  <span className="text-xs bg-gradient-to-r from-[#f7931a] to-[#61dafb] text-black px-2 py-0.5 rounded font-medium">
                    PREMIUM
                  </span>
                </div>
              </div>
              <div className="text-xs text-[rgba(247,243,227,0.5)] mb-2 blur-sm select-none">
                {card.subtitle}
              </div>
              <div className="text-xs text-[rgba(247,243,227,0.4)]">
                {card.description}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-[rgba(97,218,251,0.05)] rounded border border-[rgba(97,218,251,0.2)]">
          <div className="text-xs text-[#61dafb] mb-2">
            💡 Premium features coming soon!
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.7)]">
            Let me know what analytics you'd like to see. I'm building these features based on user feedback.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
