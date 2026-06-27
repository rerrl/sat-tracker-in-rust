import React, { useState, useEffect, useMemo } from "react";
import MetricsGrid, { BitcoinPriceMetric } from "../MetricsGrid";
import ActivityHeatmap from "../ActivityHeatmap";
import { useBitcoinPrice } from "../../hooks/useBitcoinPrice";
import { useActivityMetrics } from "../../hooks/useActivityMetrics";

const ActivityToolMain: React.FC = () => {
  const { activityMetrics, loading: activityLoading } =
    useActivityMetrics(true);

  const [isEditingBitcoinPrice, setIsEditingBitcoinPrice] = useState(false);
  const [customBitcoinPrice, setCustomBitcoinPrice] = useState<number | null>(
    null
  );
  const [bitcoinPriceInput, setBitcoinPriceInput] = useState("");

  const {
    price: liveBitcoinPrice,
    percentChange24hr,
    loading: bitcoinPriceLoading,
  } = useBitcoinPrice();

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

  const activityMetricsItems = [
    {
      label: "Current Streak",
      value: activityLoading
        ? "..."
        : activityMetrics?.current_streak_weeks
        ? `${activityMetrics.current_streak_weeks} week${
            activityMetrics.current_streak_weeks !== 1 ? "s" : ""
          }`
        : "0 weeks",
      color: "orange" as const,
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
      color: "orange" as const,
      hint: "Your longest streak of consecutive stacking weeks",
    },
    {
      label: "Stacked This Year",
      value: activityLoading
        ? "..."
        : activityMetrics?.sats_stacked_this_year
        ? `${activityMetrics.sats_stacked_this_year.toLocaleString()} sats`
        : "0 sats",
      color: "orange" as const,
      hint: "Total satoshis accumulated in the current year",
    },
    {
      label: "Consistency Score",
      value: activityLoading
        ? "..."
        : activityMetrics?.consistency_score_percent
        ? `${activityMetrics.consistency_score_percent.toFixed(0)}%`
        : "0%",
      color: "green" as const,
      hint: "Weighted consistency score over rolling 52-week period (recent weeks count more)",
    },
  ];

  const stableHeatmapData = useMemo(
    () => activityMetrics?.heatmap_data,
    [JSON.stringify(activityMetrics?.heatmap_data)]
  );

  return (
    <>
      <MetricsGrid
        bitcoinPrice={bitcoinPriceMetric}
        metrics={activityMetricsItems}
      />
      <div className="flex-1 overflow-y-auto bg-[rgba(9,12,8,0.8)]">
        <ActivityHeatmap heatmapData={stableHeatmapData} />
      </div>
    </>
  );
};

export default React.memo(ActivityToolMain);