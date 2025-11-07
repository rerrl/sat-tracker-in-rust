import React, { useState, useEffect } from "react";
import { BalanceChangeEvent } from "../../services/tauriService";
import SatsHoldingsChartSection from "../SatsHoldingsChartSection";
import AnalyticsSection from "../AnalyticsSection";
import MainLayout from "../layouts/MainLayout";
import { useBitcoinPrice } from "../../hooks/useBitcoinPrice";
import { usePortfolioMetrics } from "../../hooks/usePortfolioMetrics";
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from "../MetricsGrid";

interface OverviewToolProps {
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

const OverviewTool: React.FC<OverviewToolProps> = ({
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
  // Add the hook call right after the component function signature
  const { portfolioMetrics, loading: metricsLoading } = usePortfolioMetrics(
    true
  );
  // Bitcoin price state
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
      setCustomBitcoinPrice(100000); // Default fallback price
    }
  }, [liveBitcoinPrice, customBitcoinPrice, bitcoinPriceLoading]);

  // Use custom price if set, otherwise use live price (with fallback)
  const bitcoinPrice =
    customBitcoinPrice !== null
      ? customBitcoinPrice
      : liveBitcoinPrice || 100000;

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
      label: "Portfolio Value",
      value: metricsLoading
        ? "..."
        : `$${(
            ((portfolioMetrics?.current_sats || 0) / 100_000_000) *
            bitcoinPrice
          ).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
      color: "orange",
    },
    {
      label: "Current Sats",
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.current_sats.toLocaleString() || "0",
      color: "orange",
    },
    {
      label: "Current BTC",
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.current_sats
        ? (portfolioMetrics.current_sats / 100_000_000).toFixed(8)
        : "0.00000000",
      color: "orange",
    },
    {
      label: "Unrealized Gain",
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
        const totalInvested =
          (portfolioMetrics.total_invested_cents || 0) / 100;
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
      color: "green",
    },
  ];

  const overviewMetricsComponent = (
    <MetricsGrid bitcoinPrice={bitcoinPriceMetric} metrics={overviewMetrics} />
  );

  const overviewChart = <SatsHoldingsChartSection events={events} />;

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

export default OverviewTool;
