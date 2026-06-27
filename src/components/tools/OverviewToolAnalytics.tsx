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

  const overviewPremiumCards = [
    {
      title: "Peak Performance",
      value: "$127,340",
      subtitle: "portfolio ATH value",
      description:
        "Your portfolio's highest USD value using historical Bitcoin prices",
    },
    {
      title: "Market Timing Score",
      value: "73/100",
      subtitle: "vs perfect timing",
      description:
        "How well you timed the market compared to buying at historical lows",
    },
    {
      title: "Dollar Cost Average Score",
      value: "8.4/10",
      subtitle: "vs lump sum timing",
      description:
        "How your DCA strategy performed vs investing everything at historical optimal times",
    },
  ];

  return (
    <AnalyticsSection
      sectionTitle="Portfolio Insights"
      metrics={overviewAnalyticsMetrics}
      premiumCards={overviewPremiumCards}
    />
  );
};

export default React.memo(OverviewToolAnalytics);