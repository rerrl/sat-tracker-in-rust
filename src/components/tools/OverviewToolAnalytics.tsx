import React from "react";
import AnalyticsSection from "../AnalyticsSection";
import { usePortfolioMetrics } from "../../hooks/usePortfolioMetrics";

const OverviewToolAnalytics: React.FC = () => {
  const { portfolioMetrics, loading: metricsLoading } =
    usePortfolioMetrics(true);

  const overviewAnalyticsMetrics = [
    {
      title: "Average Buy Price",
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.avg_buy_price
        ? `$${portfolioMetrics.avg_buy_price.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : "No buys yet",
      subtitle: metricsLoading
        ? "..."
        : `${(
            portfolioMetrics?.total_sats_stacked || 0
          ).toLocaleString()} sats stacked`,
      color: "green" as const,
    },
    {
      title: "Total Invested",
      value: metricsLoading
        ? "..."
        : `$${(
            (portfolioMetrics?.total_invested_cents || 0) / 100
          ).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
      subtitle: metricsLoading
        ? "..."
        : portfolioMetrics?.avg_sell_price
        ? `Avg sell: $${portfolioMetrics.avg_sell_price.toLocaleString(
            undefined,
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }
          )}`
        : "No sells yet",
      color: "orange" as const,
    },
    {
      title: "Recent Activity",
      value: metricsLoading
        ? "..."
        : `${(portfolioMetrics?.sats_stacked_7d || 0).toLocaleString()} sats`,
      subtitle: "Last 7 days",
      color: "blue" as const,
    },
  ];

  return (
    <AnalyticsSection
      sectionTitle="Portfolio Insights"
      metrics={overviewAnalyticsMetrics}
    />
  );
};

export default React.memo(OverviewToolAnalytics);