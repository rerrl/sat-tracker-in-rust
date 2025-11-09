import React, { useState, useEffect, useMemo } from "react";
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
  console.log(
    "[OverviewTool] Component rendering, events count:",
    events.length,
    "eventsLoading:",
    eventsLoading
  );

  // Add the hook call right after the component function signature
  const { portfolioMetrics, loading: metricsLoading } =
    usePortfolioMetrics(true);
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
    // @ts-ignore
    error: bitcoinPriceError,
  } = useBitcoinPrice();

  // Auto-switch to manual mode if live price is null
  useEffect(() => {
    console.log("[OverviewTool] Bitcoin price effect triggered:", {
      liveBitcoinPrice,
      customBitcoinPrice,
      bitcoinPriceLoading,
    });
    if (
      liveBitcoinPrice === null &&
      customBitcoinPrice === null &&
      !bitcoinPriceLoading
    ) {
      console.log("[OverviewTool] Setting default bitcoin price to 100000");
      setCustomBitcoinPrice(100000); // Default fallback price
    }
  }, [liveBitcoinPrice, customBitcoinPrice, bitcoinPriceLoading]);

  // Log portfolio metrics changes
  useEffect(() => {
    console.log("[OverviewTool] Portfolio metrics effect:", {
      portfolioMetrics,
      metricsLoading,
    });
  }, [portfolioMetrics, metricsLoading]);

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

  const bitcoinPriceMetric: BitcoinPriceMetric = useMemo(
    () => ({
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
    }),
    [
      bitcoinPrice,
      percentChange24hr,
      bitcoinPriceLoading,
      customBitcoinPrice,
      isEditingBitcoinPrice,
      bitcoinPriceInput,
      handleModeToggle,
      handleBitcoinPriceClick,
      handleBitcoinPriceBlur,
      handleBitcoinPriceKeyDown,
    ]
  );

  const overviewMetrics: MetricItem[] = useMemo(() => {
    console.log("[OverviewTool] Computing overview metrics with:", {
      metricsLoading,
      portfolioMetrics,
      bitcoinPrice,
    });

    return [
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
  }, [metricsLoading, portfolioMetrics, bitcoinPrice]);

  const overviewMetricsComponent = useMemo(() => {
    console.log("[OverviewTool] Creating metrics component");
    return (
      <MetricsGrid
        bitcoinPrice={bitcoinPriceMetric}
        metrics={overviewMetrics}
      />
    );
  }, [bitcoinPriceMetric, overviewMetrics]);

  const overviewChart = useMemo(() => {
    console.log(
      "[OverviewTool] Creating chart component with events:",
      events.length
    );
    return <SatsHoldingsChartSection events={events} />;
  }, [events]);

  const overviewLeftContent = (
    <>
      {overviewMetricsComponent}
      {overviewChart}
    </>
  );

  const overviewAnalyticsMetrics = [
    {
      title: "Average Buy Price",
      value: metricsLoading
        ? "..."
        : portfolioMetrics?.avg_buy_price
        ? `$${portfolioMetrics.avg_buy_price.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : "No buys yet",
      subtitle: metricsLoading
        ? "..."
        : `${(
            portfolioMetrics?.total_sats_stacked || 0
          ).toLocaleString()} sats stacked`,
      color: "green" as const,
    },
    {
      title: "Total Invested",
      value: metricsLoading
        ? "..."
        : `$${(
            (portfolioMetrics?.total_invested_cents || 0) / 100
          ).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
      subtitle: metricsLoading
        ? "..."
        : portfolioMetrics?.avg_sell_price
        ? `Avg sell: $${portfolioMetrics.avg_sell_price.toLocaleString(
            undefined,
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }
          )}`
        : "No sells yet",
      color: "orange" as const,
    },
    {
      title: "Recent Activity",
      value: metricsLoading
        ? "..."
        : `${(portfolioMetrics?.sats_stacked_7d || 0).toLocaleString()} sats`,
      subtitle: "Last 7 days",
      color: "blue" as const,
    },
  ];

  const overviewPremiumCards = [
    {
      title: "Peak Performance",
      value: "$127,340",
      subtitle: "portfolio ATH value",
      description:
        "Your portfolio's highest USD value using historical Bitcoin prices",
    },
    {
      title: "Market Timing Score",
      value: "73/100",
      subtitle: "vs perfect timing",
      description:
        "How well you timed the market compared to buying at historical lows",
    },
    {
      title: "Dollar Cost Average Score",
      value: "8.4/10",
      subtitle: "vs lump sum timing",
      description:
        "How your DCA strategy performed vs investing everything at historical optimal times",
    },
  ];

  const overviewAnalytics = (
    <AnalyticsSection
      sectionTitle="Portfolio Insights"
      metrics={overviewAnalyticsMetrics}
      premiumCards={overviewPremiumCards}
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

export default React.memo(OverviewTool);
