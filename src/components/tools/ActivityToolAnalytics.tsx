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

  return (
    <AnalyticsSection
      sectionTitle="Activity Insights"
      metrics={activityAnalyticsMetrics}
    />
  );
};

export default React.memo(ActivityToolAnalytics);