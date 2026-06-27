import React, { useState, useEffect, useMemo } from "react";
import MetricsGrid, { MetricItem, BitcoinPriceMetric } from "../MetricsGrid";
import SatsHoldingsChartSection from "../SatsHoldingsChartSection";
import { useBitcoinPrice } from "../../hooks/useBitcoinPrice";
import { usePortfolioMetrics } from "../../hooks/usePortfolioMetrics";

const OverviewToolMain: React.FC = () => {
  const { portfolioMetrics, loading: metricsLoading } =
    usePortfolioMetrics(true);

  const [isEditingBitcoinPrice, setIsEditingBitcoinPrice] = useState(false);
  const [customBitcoinPrice, setCustomBitcoinPrice] = useState<number | null>(
    null
  );
  const [bitcoinPriceInput, setBitcoinPriceInput] = useState("");

  const {
    price: liveBitcoinPrice,
    percentChange24hr,
    loading: bitcoinPriceLoading,
    error: _bitcoinPriceError,
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

  const calculateUnrealizedGain = () => {
    if (
      metricsLoading ||
      !portfolioMetrics?.current_sats ||
      !portfolioMetrics?.total_invested_cents
    ) {
      return null;
    }
    const currentValue =
      ((portfolioMetrics.current_sats || 0) / 100_000_000) * bitcoinPrice;
    const totalInvested = (portfolioMetrics.total_invested_cents || 0) / 100;
    return currentValue - totalInvested;
  };

  const unrealizedGain = calculateUnrealizedGain();

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
    ]
  );

  const overviewMetrics: MetricItem[] = useMemo(
    () => [
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
        hint: "Current portfolio value with 24-hour change based on Bitcoin price movement alone",
        subValue: (() => {
          if (
            metricsLoading ||
            !portfolioMetrics?.current_sats ||
            percentChange24hr === null
          ) {
            return undefined;
          }
          const currentPortfolioValue =
            ((portfolioMetrics.current_sats || 0) / 100_000_000) * bitcoinPrice;
          const dailyDollarChange =
            currentPortfolioValue * (percentChange24hr / 100);
          const sign = dailyDollarChange >= 0 ? "+" : "";
          return `${sign}$${Math.abs(dailyDollarChange).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }
          )} (24hr)`;
        })(),
        subValueColor:
          percentChange24hr !== null && percentChange24hr >= 0
            ? "green"
            : "red",
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
        value:
          unrealizedGain === null
            ? "..."
            : unrealizedGain >= 0
            ? `+$${unrealizedGain.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            : `-$${Math.abs(unrealizedGain).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`,
        color:
          unrealizedGain === null
            ? "green"
            : unrealizedGain >= 0
            ? "green"
            : "red",
        hint:
          unrealizedGain === null
            ? "Unrealized gain/loss"
            : unrealizedGain >= 0
            ? "Stay humble stack sats"
            : "HODL",
      },
    ],
    [metricsLoading, portfolioMetrics, bitcoinPrice, percentChange24hr]
  );

  return (
    <>
      <MetricsGrid bitcoinPrice={bitcoinPriceMetric} metrics={overviewMetrics} />
      <SatsHoldingsChartSection />
    </>
  );
};

export default React.memo(OverviewToolMain);