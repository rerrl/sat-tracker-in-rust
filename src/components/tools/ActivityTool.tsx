import React, { useState, useEffect } from 'react';
import {
  TauriService,
  BalanceChangeEvent,
  PortfolioMetrics,
} from '../../services/tauriService';
import MainLayout from '../layouts/MainLayout';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import ActivityHeatmap from '../ActivityHeatmap';

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

  // Activity-specific metrics (same layout as overview)
  const activityMetrics = (
    <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
      <div className="grid grid-cols-5 gap-3 mb-3">
        {/* Bitcoin Price - same as overview */}
        <div className="text-center p-2 bg-[rgba(97,218,251,0.1)] border border-[rgba(97,218,251,0.2)] rounded relative">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1 flex items-center justify-center gap-1">
            Bitcoin Price
            <button
              onClick={handleModeToggle}
              className={`text-[10px] px-1 rounded ${
                customBitcoinPrice === null
                  ? "bg-[rgba(144,238,144,0.2)] hover:bg-[rgba(144,238,144,0.3)] text-lightgreen"
                  : "bg-[rgba(255,165,0,0.2)] hover:bg-[rgba(255,165,0,0.3)] text-orange"
              }`}
              title={
                customBitcoinPrice === null
                  ? "Switch to manual mode"
                  : "Switch to live mode"
              }
            >
              {customBitcoinPrice === null ? "Live" : "Manual"}
            </button>
          </div>
          {isEditingBitcoinPrice ? (
            <input
              type="text"
              value={bitcoinPriceInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  setBitcoinPriceInput(value);
                }
              }}
              onBlur={handleBitcoinPriceBlur}
              onKeyDown={handleBitcoinPriceKeyDown}
              className="w-full bg-[rgba(9,12,8,0.8)] border border-[rgba(97,218,251,0.5)] text-[#61dafb] text-sm font-medium text-center px-1 py-0 rounded"
              autoFocus
            />
          ) : (
            <div className="flex flex-col items-center">
              <div
                className={`text-sm text-[#61dafb] font-medium rounded px-1 py-0 ${
                  customBitcoinPrice !== null
                    ? "cursor-pointer hover:bg-[rgba(97,218,251,0.1)]"
                    : "cursor-default"
                }`}
                onClick={handleBitcoinPriceClick}
                title={
                  customBitcoinPrice !== null
                    ? "Click to edit price"
                    : "Click 'Live' to enter manual mode"
                }
              >
                {bitcoinPriceLoading && customBitcoinPrice === null
                  ? "..."
                  : `$${bitcoinPrice.toLocaleString()}`}
              </div>
              {customBitcoinPrice === null &&
                percentChange24hr !== null &&
                !bitcoinPriceLoading && (
                  <div
                    className={`text-xs font-medium ${
                      percentChange24hr >= 0
                        ? "text-lightgreen"
                        : "text-lightcoral"
                    }`}
                  >
                    {percentChange24hr >= 0 ? "+" : ""}
                    {percentChange24hr.toFixed(2)}% (24h)
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Current Streak */}
        <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Current Streak
          </div>
          <div className="text-sm text-[#f7931a] font-medium">
            7 days
          </div>
        </div>

        {/* Longest Streak */}
        <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Longest Streak
          </div>
          <div className="text-sm text-[#f7931a] font-medium">
            23 days
          </div>
        </div>

        {/* Active Days */}
        <div className="text-center p-2 bg-[rgba(247,147,26,0.1)] border border-[rgba(247,147,26,0.2)] rounded">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Active Days
          </div>
          <div className="text-sm text-[#f7931a] font-medium">
            156 / 365
          </div>
        </div>

        {/* Habit Score */}
        <div className="text-center p-2 bg-[rgba(144,238,144,0.1)] border border-[rgba(144,238,144,0.2)] rounded">
          <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
            Habit Score
          </div>
          <div className="text-sm text-lightgreen font-medium">
            8.2/10
          </div>
        </div>
      </div>
    </div>
  );

  // Activity heatmap
  const activityHeatmap = (
    <div className="flex-1 overflow-y-auto bg-[rgba(9,12,8,0.8)]">
      <ActivityHeatmap events={events} />
    </div>
  );

  const activityLeftContent = (
    <>
      {activityMetrics}
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
