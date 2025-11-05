import React, { useState, useEffect } from 'react';
import {
  TauriService,
  BalanceChangeEvent,
  PortfolioMetrics,
} from '../../services/tauriService';
import SatsHoldingsChartSection from '../SatsHoldingsChartSection';
import AnalyticsSection from '../AnalyticsSection';
import MainLayout from '../layouts/MainLayout';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from '../MetricsGrid';

const OverviewTool: React.FC = () => {
  // Bitcoin price state
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
      setCustomBitcoinPrice(100000); // Default fallback price
    }
  }, [liveBitcoinPrice, customBitcoinPrice, bitcoinPriceLoading]);

  // Use custom price if set, otherwise use live price (with fallback)
  const bitcoinPrice =
    customBitcoinPrice !== null
      ? customBitcoinPrice
      : liveBitcoinPrice || 100000;

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
      console.log("📊 Portfolio Metrics:", metrics);
      console.log("📈 7-day metrics:", {
        sats_stacked_7d: metrics.sats_stacked_7d,
        usd_invested_7d: metrics.usd_invested_7d_cents / 100,
      });
      console.log("📈 31-day metrics:", {
        sats_stacked_31d: metrics.sats_stacked_31d,
        usd_invested_31d: metrics.usd_invested_31d_cents / 100,
      });
      setPortfolioMetrics(metrics);
    } catch (error) {
      console.error("Error loading portfolio metrics:", error);
    } finally {
      if (showLoading) {
        setMetricsLoading(false);
      }
    }
  }

  // Load initial events - load ALL events for accurate chart data
  async function loadInitialEvents() {
    setLoading(true);
    try {
      let allEvents: BalanceChangeEvent[] = [];
      let currentPage = 0;
      let hasMore = true;
      let totalCount = 0;

      // Keep loading until we have all events
      while (hasMore) {
        const result = await TauriService.getBalanceChangeEvents(
          currentPage,
          1000
        ); // Load 1000 at a time
        allEvents = [...allEvents, ...result.events];
        hasMore = result.has_more;
        totalCount = result.total_count;
        currentPage++;

        console.log(
          `Loaded page ${currentPage - 1}, total events so far: ${
            allEvents.length
          }, has more: ${hasMore}`
        );
      }

      setEvents(allEvents);
      setTotalCount(totalCount);

      console.log(
        `✅ Loaded all ${allEvents.length} events for complete chart data`
      );
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

  // All the event handling functions
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

      console.log("Event updated successfully:", updatedEvent);
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
      console.log("Event deleted successfully");
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
      console.log("Event created successfully:", createdEvent);
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

  // Bitcoin price handling functions
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

  const overviewMetrics: MetricItem[] = [
    {
      label: 'Portfolio Value',
      value: metricsLoading
        ? "..."
        : `$${(
            ((portfolioMetrics?.current_sats || 0) / 100_000_000) *
            bitcoinPrice
          ).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
      color: 'orange'
    },
    {
      label: 'Current Sats',
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.current_sats.toLocaleString() || "0",
      color: 'orange'
    },
    {
      label: 'Current BTC',
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.current_sats
        ? (portfolioMetrics.current_sats / 100_000_000).toFixed(8)
        : "0.00000000",
      color: 'orange'
    },
    {
      label: 'Unrealized Gain',
      value: (() => {
        if (
          metricsLoading ||
          !portfolioMetrics?.current_sats ||
          !portfolioMetrics?.total_invested_cents
        ) {
          return "...";
        }
        const currentValue =
          ((portfolioMetrics.current_sats || 0) / 100_000_000) * bitcoinPrice;
        const totalInvested = (portfolioMetrics.total_invested_cents || 0) / 100;
        const unrealizedGain = currentValue - totalInvested;
        return unrealizedGain >= 0
          ? `+$${unrealizedGain.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`
          : `-$${Math.abs(unrealizedGain).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`;
      })(),
      color: 'green'
    }
  ];

  const overviewMetricsComponent = (
    <MetricsGrid 
      bitcoinPrice={bitcoinPriceMetric}
      metrics={overviewMetrics}
    />
  );

  const overviewChart = (
    <SatsHoldingsChartSection events={events} />
  );

  const overviewLeftContent = (
    <>
      {overviewMetricsComponent}
      {overviewChart}
    </>
  );

  const overviewAnalytics = (
    <AnalyticsSection
      portfolioMetrics={portfolioMetrics}
      metricsLoading={metricsLoading}
    />
  );

  return (
    <MainLayout
      leftContent={overviewLeftContent}
      analyticsContent={overviewAnalytics}
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

export default OverviewTool;
