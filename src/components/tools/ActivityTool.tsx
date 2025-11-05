import React, { useState, useEffect } from 'react';
import {
  TauriService,
  BalanceChangeEvent,
  PortfolioMetrics,
} from '../../services/tauriService';
import MainLayout from '../layouts/MainLayout';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import ActivityHeatmap from '../ActivityHeatmap';
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from '../MetricsGrid';

const ActivityTool: React.FC = () => {
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

  // Data state
  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventData, setNewEventData] = useState<any>(null);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Load portfolio metrics
  async function loadPortfolioMetrics(showLoading = false) {
    if (showLoading) {
      setMetricsLoading(true);
    }
    try {
      const metrics = await TauriService.getPortfolioMetrics();
      setPortfolioMetrics(metrics);
    } catch (error) {
      console.error("Error loading portfolio metrics:", error);
    } finally {
      if (showLoading) {
        setMetricsLoading(false);
      }
    }
  }

  // Load initial events
  async function loadInitialEvents() {
    setLoading(true);
    try {
      let allEvents: BalanceChangeEvent[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const result = await TauriService.getBalanceChangeEvents(
          currentPage,
          1000
        );
        allEvents = [...allEvents, ...result.events];
        hasMore = result.has_more;
        totalCount = result.total_count;
        currentPage++;
      }

      setEvents(allEvents);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Error loading initial events:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadInitialEvents();
    loadPortfolioMetrics(true);
  }, []);

  // Event handling functions (same as overview)
  const handleEditEvent = (event: BalanceChangeEvent) => {
    setIsCreatingNew(false);
    setNewEventData(null);
    setEditingEventId(event.id);
    setEditData({
      event_type: event.event_type,
      amount_sats: event.amount_sats,
      value_cents: event.value_cents,
      memo: event.memo,
      timestamp: event.timestamp,
    });
  };

  const handleSaveEvent = async () => {
    if (!editingEventId || !editData) return;

    try {
      const updateRequest = {
        amount_sats: editData.amount_sats,
        value_cents: editData.value_cents,
        event_type: editData.event_type as "Buy" | "Sell" | "Fee",
        memo: editData.memo,
        timestamp: editData.timestamp,
      };

      const updatedEvent = await TauriService.updateBalanceChangeEvent(
        editingEventId,
        updateRequest
      );

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === editingEventId ? updatedEvent : event
        )
      );

      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEventId) return;

    try {
      await TauriService.deleteBalanceChangeEvent(editingEventId);

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== editingEventId)
      );

      setTotalCount((prevCount) => prevCount - 1);
      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditData(null);
  };

  const handleEditDataChange = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNewEvent = () => {
    setIsCreatingNew(true);
    setNewEventData({
      event_type: "Buy",
      amount_sats: 0,
      value_cents: null,
      memo: null,
      timestamp: new Date().toISOString(),
    });
    setEditingEventId(null);
    setEditData(null);
  };

  const handleSaveNewEvent = async () => {
    if (!newEventData) return;

    try {
      const createRequest = {
        amount_sats: newEventData.amount_sats,
        value_cents: newEventData.value_cents,
        event_type: newEventData.event_type as "Buy" | "Sell" | "Fee",
        memo: newEventData.memo,
        timestamp: newEventData.timestamp,
      };

      const createdEvent = await TauriService.createBalanceChangeEvent(
        createRequest
      );

      setEvents((prevEvents) => [createdEvent, ...prevEvents]);
      setTotalCount((prevCount) => prevCount + 1);
      loadPortfolioMetrics();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingNew(false);
      setNewEventData(null);
    }
  };

  const handleCancelNewEvent = () => {
    setIsCreatingNew(false);
    setNewEventData(null);
  };

  const handleNewEventDataChange = (field: string, value: any) => {
    setNewEventData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  // Keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingEventId) {
          handleCancelEdit();
        } else if (isCreatingNew) {
          handleCancelNewEvent();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingEventId, isCreatingNew]);

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
      value: '7 days',
      color: 'orange'
    },
    {
      label: 'Longest Streak',
      value: '23 days',
      color: 'orange'
    },
    {
      label: 'Active Days',
      value: '156 / 365',
      color: 'orange'
    },
    {
      label: 'Habit Score',
      value: '8.2/10',
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

  // Activity-specific analytics
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
      onAddNewEvent={handleAddNewEvent}
      onEditEvent={handleEditEvent}
      onSaveEvent={handleSaveEvent}
      onDeleteEvent={handleDeleteEvent}
      onCancelEdit={handleCancelEdit}
      onEditDataChange={handleEditDataChange}
      onSaveNewEvent={handleSaveNewEvent}
      onCancelNewEvent={handleCancelNewEvent}
      onNewEventDataChange={handleNewEventDataChange}
    />
  );
};

export default ActivityTool;
