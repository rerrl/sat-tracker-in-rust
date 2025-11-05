import React, { useState, useEffect } from 'react';
import {
  BalanceChangeEvent,
  PortfolioMetrics,
} from '../../services/tauriService';
import MainLayout from '../layouts/MainLayout';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
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
  portfolioMetrics: PortfolioMetrics | null;
  metricsLoading: boolean;
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
  portfolioMetrics,
  metricsLoading,
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
  // Bitcoin price state (same as overview for consistency)
  const [isEditingBitcoinPrice, setIsEditingBitcoinPrice] = useState(false);
  const [customBitcoinPrice, setCustomBitcoinPrice] = useState<number | null>(null);
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

  const activityMetrics: MetricItem[] = [
    {
      label: 'Current Streak',
      value: '2 weeks',
      color: 'orange'
    },
    {
      label: 'Longest Streak',
      value: '7 weeks',
      color: 'orange'
    },
    {
      label: 'Recommendation',
      value: 'Stack on Fridays',
      color: 'blue'
    },
    {
      label: 'Consistency Score',
      value: '82%',
      color: 'green'
    }
  ];

  const activityMetricsComponent = (
    <MetricsGrid 
      bitcoinPrice={bitcoinPriceMetric}
      metrics={activityMetrics}
    />
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
      <h3 className="text-sm font-medium text-[#F7F3E3] mb-3">Activity Insights</h3>
      
      <div className="space-y-3">
        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">Best Stacking Day</div>
          <div className="text-sm text-[#F7F3E3]">Tuesday</div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">42% of your purchases</div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">Consistency Rating</div>
          <div className="text-sm text-lightgreen">Excellent</div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">Top 15% of stackers</div>
        </div>

        <div className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">Next Milestone</div>
          <div className="text-sm text-[#f7931a]">30-day streak</div>
          <div className="text-xs text-[rgba(247,243,227,0.5)]">7 days to go</div>
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
