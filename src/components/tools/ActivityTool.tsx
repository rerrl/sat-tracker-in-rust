import React, { useState, useEffect } from 'react';
import {
  BalanceChangeEvent,
  PortfolioMetrics,
} from '../../services/tauriService';
import MainLayout from '../layouts/MainLayout';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { useActivityMetrics } from '../../hooks/useActivityMetrics';
import ActivityHeatmap from '../ActivityHeatmap';
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from '../MetricsGrid';

interface ActivityToolProps {
  events: BalanceChangeEvent[];
  eventsLoading: boolean;
  totalCount: number;
  editingEventId: string | null;
  editData: any;
  isCreatingNew: boolean;
  newEventData: any;
  onAddNewEvent: () => void;
  onEditEvent: (event: BalanceChangeEvent) => void;
  onSaveEvent: () => Promise<void>;
  onDeleteEvent: () => Promise<void>;
  onCancelEdit: () => void;
  onEditDataChange: (field: string, value: any) => void;
  onSaveNewEvent: () => Promise<void>;
  onCancelNewEvent: () => void;
  onNewEventDataChange: (field: string, value: any) => void;
}

const ActivityTool: React.FC<ActivityToolProps> = ({
  events,
  eventsLoading,
  totalCount,
  editingEventId,
  editData,
  isCreatingNew,
  newEventData,
  onAddNewEvent,
  onEditEvent,
  onSaveEvent,
  onDeleteEvent,
  onCancelEdit,
  onEditDataChange,
  onSaveNewEvent,
  onCancelNewEvent,
  onNewEventDataChange,
}) => {
  // Load activity metrics
  const { activityMetrics, loading: activityLoading } = useActivityMetrics(true);

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
          ? `${activityMetrics.current_streak_weeks} week${activityMetrics.current_streak_weeks !== 1 ? 's' : ''}`
          : "0 weeks",
      color: "orange",
      hint: "Number of consecutive weeks with Bitcoin purchases",
    },
    {
      label: "Longest Streak", 
      value: activityLoading
        ? "..."
        : activityMetrics?.longest_streak_weeks
          ? `${activityMetrics.longest_streak_weeks} week${activityMetrics.longest_streak_weeks !== 1 ? 's' : ''}`
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

  const activityMetricsComponent = (
    <MetricsGrid bitcoinPrice={bitcoinPriceMetric} metrics={activityMetricsItems} />
  );

  // Activity heatmap
  const activityHeatmap = (
    <div className="flex-1 overflow-y-auto bg-[rgba(9,12,8,0.8)]">
      <ActivityHeatmap events={events} />
    </div>
  );

  const activityLeftContent = (
    <>
      {activityMetricsComponent}
      {activityHeatmap}
    </>
  );

  const activityAnalytics = (
    <div className="p-4 border-b border-[rgba(247,243,227,0.1)] flex-shrink-0">
      <h3 className="text-sm font-medium text-[#F7F3E3] mb-3">
        Activity Insights
      </h3>

      <div className="space-y-3">
        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Best Stacking Day
          </div>
          <div className="text-sm text-[#F7F3E3]">
            {activityLoading 
              ? "..." 
              : activityMetrics?.best_stacking_day || "No data"}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            {activityLoading
              ? "..."
              : activityMetrics?.best_day_percentage
                ? `${activityMetrics.best_day_percentage.toFixed(0)}% of your purchases`
                : "No purchases yet"}
          </div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Consistency Rating
          </div>
          <div className="text-sm text-lightgreen">
            {activityLoading
              ? "..."
              : activityMetrics?.consistency_rating || "No data"}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            Based on recent activity
          </div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Next Milestone
          </div>
          <div className="text-sm text-[#f7931a]">
            {activityLoading
              ? "..."
              : activityMetrics?.next_milestone_description || "Keep stacking!"}
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">
            {activityLoading
              ? "..."
              : activityMetrics?.weeks_to_next_milestone
                ? `${activityMetrics.weeks_to_next_milestone} week${activityMetrics.weeks_to_next_milestone !== 1 ? 's' : ''} to go`
                : "You're doing great!"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout
      leftContent={activityLeftContent}
      analyticsContent={activityAnalytics}
      events={events}
      totalCount={totalCount}
      editingEventId={editingEventId}
      editData={editData}
      isCreatingNew={isCreatingNew}
      newEventData={newEventData}
      onAddNewEvent={onAddNewEvent}
      onEditEvent={onEditEvent}
      onSaveEvent={onSaveEvent}
      onDeleteEvent={onDeleteEvent}
      onCancelEdit={onCancelEdit}
      onEditDataChange={onEditDataChange}
      onSaveNewEvent={onSaveNewEvent}
      onCancelNewEvent={onCancelNewEvent}
      onNewEventDataChange={onNewEventDataChange}
    />
  );
};

export default ActivityTool;
