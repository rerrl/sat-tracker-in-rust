import React, { useState, useEffect, useMemo } from "react";
import { ExchangeTransaction } from "../../services/tauriService";
import MainLayout from "../layouts/MainLayout";
import { useBitcoinPrice } from "../../hooks/useBitcoinPrice";
import { useActivityMetrics } from "../../hooks/useActivityMetrics";
import ActivityHeatmap from "../ActivityHeatmap";
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from "../MetricsGrid";
import AnalyticsSection from "../AnalyticsSection";

interface ActivityToolProps {
  // All event-related props removed!
}

const ActivityTool: React.FC<ActivityToolProps> = () => {
  // Load activity metrics
  const { activityMetrics, loading: activityLoading } =
    useActivityMetrics(true);

  // Bitcoin price state (same as overview for consistency)
  const [isEditingBitcoinPrice, setIsEditingBitcoinPrice] = useState(false);
  const [customBitcoinPrice, setCustomBitcoinPrice] = useState<number | null>(
    null
  );
  const [bitcoinPriceInput, setBitcoinPriceInput] = useState("");

  const {
    price: liveBitcoinPrice,
    percentChange24hr,
    loading: bitcoinPriceLoading,
    // @ts-ignore
    error: bitcoinPriceError,
  } = useBitcoinPrice();

  // Auto-switch to manual mode if live price is null
  useEffect(() => {
    if (
      liveBitcoinPrice === null &&
      customBitcoinPrice === null &&
      !bitcoinPriceLoading
    ) {
      setCustomBitcoinPrice(100000);
    }
  }, [liveBitcoinPrice, customBitcoinPrice, bitcoinPriceLoading]);

  const bitcoinPrice =
    customBitcoinPrice !== null
      ? customBitcoinPrice
      : liveBitcoinPrice || 100000;

  // Bitcoin price handling functions (same as overview)
  const handleBitcoinPriceClick = () => {
    if (customBitcoinPrice !== null) {
      setIsEditingBitcoinPrice(true);
      setBitcoinPriceInput(bitcoinPrice.toString());
    }
  };

  const handleBitcoinPriceBlur = () => {
    const numValue = parseFloat(bitcoinPriceInput);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomBitcoinPrice(numValue);
    }
    setIsEditingBitcoinPrice(false);
  };

  const handleBitcoinPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBitcoinPriceBlur();
    } else if (e.key === "Escape") {
      setIsEditingBitcoinPrice(false);
      setBitcoinPriceInput(bitcoinPrice.toString());
    }
  };

  const handleModeToggle = () => {
    if (customBitcoinPrice === null) {
      const priceToUse = liveBitcoinPrice || 100000;
      setCustomBitcoinPrice(priceToUse);
      setIsEditingBitcoinPrice(true);
      setBitcoinPriceInput(priceToUse.toString());
    } else {
      setCustomBitcoinPrice(null);
      setIsEditingBitcoinPrice(false);
    }
  };

  const bitcoinPriceMetric: BitcoinPriceMetric = {
    price: bitcoinPrice,
    percentChange24hr,
    isLoading: bitcoinPriceLoading,
    isManualMode: customBitcoinPrice !== null,
    isEditing: isEditingBitcoinPrice,
    inputValue: bitcoinPriceInput,
    onModeToggle: handleModeToggle,
    onPriceClick: handleBitcoinPriceClick,
    onInputChange: setBitcoinPriceInput,
    onInputBlur: handleBitcoinPriceBlur,
    onInputKeyDown: handleBitcoinPriceKeyDown,
  };

  const activityMetricsItems: MetricItem[] = [
    {
      label: "Current Streak",
      value: activityLoading
        ? "..."
        : activityMetrics?.current_streak_weeks
        ? `${activityMetrics.current_streak_weeks} week${
            activityMetrics.current_streak_weeks !== 1 ? "s" : ""
          }`
        : "0 weeks",
      color: "orange",
      hint: "Number of consecutive weeks with Bitcoin purchases",
    },
    {
      label: "Longest Streak",
      value: activityLoading
        ? "..."
        : activityMetrics?.longest_streak_weeks
        ? `${activityMetrics.longest_streak_weeks} week${
            activityMetrics.longest_streak_weeks !== 1 ? "s" : ""
          }`
        : "0 weeks",
      color: "orange",
      hint: "Your longest streak of consecutive stacking weeks",
    },
    {
      label: "Stacked This Year",
      value: activityLoading
        ? "..."
        : activityMetrics?.sats_stacked_this_year
        ? `${activityMetrics.sats_stacked_this_year.toLocaleString()} sats`
        : "0 sats",
      color: "orange",
      hint: "Total satoshis accumulated in the current year",
    },
    {
      label: "Consistency Score",
      value: activityLoading
        ? "..."
        : activityMetrics?.consistency_score_percent
        ? `${activityMetrics.consistency_score_percent.toFixed(0)}%`
        : "0%",
      color: "green",
      hint: "Weighted consistency score over rolling 52-week period (recent weeks count more)",
    },
  ];

  // Create a stable reference using deep comparison of the actual data content
  const stableHeatmapData = useMemo(() => {
    console.log(
      "[ActivityTool] Stabilizing heatmap data, activityMetrics:",
      !!activityMetrics
    );
    console.log(
      "[ActivityTool] Raw heatmap_data reference:",
      activityMetrics?.heatmap_data
    );
    return activityMetrics?.heatmap_data;
  }, [JSON.stringify(activityMetrics?.heatmap_data)]);

  const activityHeatmap = useMemo(() => {
    console.log(
      "[ActivityTool] Creating activity heatmap with data:",
      stableHeatmapData?.length,
      "years"
    );
    console.log(
      "[ActivityTool] Stable heatmap data reference:",
      stableHeatmapData
    );
    return (
      <div className="flex-1 overflow-y-auto bg-[rgba(9,12,8,0.8)]">
        <ActivityHeatmap heatmapData={stableHeatmapData} />
      </div>
    );
  }, [stableHeatmapData]);

  const activityLeftContent = (
    <>
      <MetricsGrid
        bitcoinPrice={bitcoinPriceMetric}
        metrics={activityMetricsItems}
      />
      {activityHeatmap}
    </>
  );

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

  const activityAnalytics = (
    <AnalyticsSection
      sectionTitle="Activity Insights"
      metrics={activityAnalyticsMetrics}
      premiumCards={activityPremiumCards}
    />
  );

  return (
    <MainLayout
      leftContent={activityLeftContent}
      analyticsContent={activityAnalytics}
    />
  );
};

export default React.memo(ActivityTool);
