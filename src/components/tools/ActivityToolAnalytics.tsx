import React from "react";
import AnalyticsSection from "../AnalyticsSection";
import { useActivityMetrics } from "../../hooks/useActivityMetrics";

const ActivityToolAnalytics: React.FC = () => {
  const { activityMetrics, loading: activityLoading } =
    useActivityMetrics(true);

  const activityAnalyticsMetrics = [
    {
      title: "Best Stacking Day",
      value: activityLoading
        ? "..."
        : activityMetrics?.best_stacking_day || "No data",
      subtitle: activityLoading
        ? "..."
        : activityMetrics?.best_day_percentage
        ? `${activityMetrics.best_day_percentage.toFixed(0)}% of your purchases`
        : "No purchases yet",
      color: "default" as const,
    },
    {
      title: "Consistency Rating",
      value: activityLoading
        ? "..."
        : activityMetrics?.consistency_rating || "No data",
      subtitle: "Based on recent activity",
      color: "green" as const,
    },
    {
      title: "Next Milestone",
      value: activityLoading
        ? "..."
        : activityMetrics?.next_milestone_description || "Keep stacking!",
      subtitle: activityLoading
        ? "..."
        : activityMetrics?.weeks_to_next_milestone
        ? `${activityMetrics.weeks_to_next_milestone} week${
            activityMetrics.weeks_to_next_milestone !== 1 ? "s" : ""
          } to go`
        : "You're doing great!",
      color: "orange" as const,
    },
  ];

  const activityPremiumCards = [
    {
      title: "Satoshi Maximizer",
      value: "+18.7%",
      subtitle: "more sats possible",
      description:
        "Discover which days you could have bought to maximize your stack using historical price data",
    },
    {
      title: "Cycle Position Analysis",
      value: "Early Bull",
      subtitle: "market phase timing",
      description:
        "Where your buys fall within Bitcoin's 4-year halving cycles using historical price patterns",
    },
    {
      title: "Opportunity Cost",
      value: "$3,247",
      subtitle: "vs weekly DCA",
      description:
        "How much more value you could have gained with consistent weekly buys at historical prices",
    },
  ];

  return (
    <AnalyticsSection
      sectionTitle="Activity Insights"
      metrics={activityAnalyticsMetrics}
      premiumCards={activityPremiumCards}
    />
  );
};

export default React.memo(ActivityToolAnalytics);