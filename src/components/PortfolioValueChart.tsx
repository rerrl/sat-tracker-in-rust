import { useMemo, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useUnifiedEvents } from "../hooks/useUnifiedEvents";
import { useBitcoinHistoricalPrices } from "../hooks/useBitcoinHistoricalPrices";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface PortfolioValueChartProps {
  /** Number of days to show, or null for all data */
  days?: number | null;
}

export default function PortfolioValueChart({
  days = 90,
}: PortfolioValueChartProps) {
  const chartRef = useRef<any>(null);

  const { events } = useUnifiedEvents(true);
  const { prices, loading: pricesLoading } = useBitcoinHistoricalPrices();

  // Force chart resize when container changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    });

    const chartContainer = chartRef.current?.canvas?.parentElement;
    if (chartContainer) {
      resizeObserver.observe(chartContainer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const chartData: ChartData<"line"> = useMemo(() => {
    if (!events || events.length === 0 || !prices || prices.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort events by date (oldest first)
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstEventDate = new Date(sortedEvents[0].timestamp).getTime();

    // Two-pointer: walk through events to track running balance,
    // walk through prices to generate weekly data points.
    let runningBalance = 0;
    let eventIdx = 0;
    const dataPoints: Array<{ date: Date; value: number; sats: number }> = [];

    for (const price of prices) {
      const priceDate = new Date(price.datetime).getTime();

      // Skip prices before our first event — no sats to value
      if (priceDate < firstEventDate) continue;

      // Advance through events up to this price date
      while (
        eventIdx < sortedEvents.length &&
        new Date(sortedEvents[eventIdx].timestamp).getTime() <= priceDate
      ) {
        const event = sortedEvents[eventIdx];
        let balanceChange = 0;
        if (event.transaction_type === "buy") {
          balanceChange = event.amount_sats;
        } else if (
          event.transaction_type === "sell" ||
          event.transaction_type === "fee"
        ) {
          balanceChange = -event.amount_sats;
        }
        runningBalance += balanceChange;
        eventIdx++;
      }

      // Compute USD value for this week
      const usdValue = (runningBalance / 100_000_000) * price.price_usd;
      dataPoints.push({
        date: new Date(price.datetime),
        value: usdValue,
        sats: runningBalance,
      });
    }

    if (dataPoints.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Apply time range filter
    const cutoff =
      days != null
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : null;

    let filtered = dataPoints;
    if (cutoff) {
      const beforeCutoff = dataPoints.filter((p) => p.date < cutoff);
      const inWindow = dataPoints.filter((p) => p.date >= cutoff);
      if (beforeCutoff.length > 0) {
        filtered = [beforeCutoff[beforeCutoff.length - 1], ...inWindow];
      } else {
        filtered = inWindow;
      }
    }

    const labels = filtered.map((point) =>
      point.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
    );

    const data = filtered.map((point) => point.value);

    return {
      labels,
      datasets: [
        {
          label: "Portfolio Value",
          data,
          borderColor: "#22c55e",
          backgroundColor: (ctx: any) => {
            if (!ctx.chart.chartArea) return "rgba(34, 197, 94, 0.08)";
            const { ctx: canvasCtx, chartArea } = ctx.chart;
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, "rgba(34, 197, 94, 0.18)");
            gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.06)");
            gradient.addColorStop(1, "rgba(34, 197, 94, 0.01)");
            return gradient;
          },
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#22c55e",
          pointHoverBorderColor: "#F7F3E3",
          pointHoverBorderWidth: 2.5,
        },
      ],
    };
  }, [events, prices, days]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1C1A26",
        titleColor: "rgba(247, 243, 227, 0.7)",
        bodyColor: "#22c55e",
        borderColor: "rgba(34, 197, 94, 0.25)",
        borderWidth: 1,
        cornerRadius: 6,
        padding: { x: 12, y: 8 },
        displayColors: false,
        titleFont: {
          size: 11,
          family: "'Inter', system-ui, sans-serif",
        },
        bodyFont: {
          size: 14,
          family: "'Inter', system-ui, sans-serif",
          weight: "bold",
        },
        callbacks: {
          title: (items) => {
            if (items.length === 0) return "";
            return items[0].label;
          },
          label: (context) => {
            const val = context.parsed.y;
            if (val == null) return "";
            return `$${val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(247, 243, 227, 0.05)",
          drawOnChartArea: true,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "rgba(247, 243, 227, 0.3)",
          maxTicksLimit: 6,
          font: {
            size: 10,
            family: "'Inter', system-ui, sans-serif",
          },
          padding: 8,
        },
      },
      y: {
        display: true,
        position: "right",
        grid: {
          color: "rgba(247, 243, 227, 0.05)",
          drawOnChartArea: true,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "rgba(247, 243, 227, 0.3)",
          font: {
            size: 10,
            family: "'Inter', system-ui, sans-serif",
          },
          padding: 8,
          maxTicksLimit: 5,
          callback: function (value: any) {
            return `$${value.toLocaleString()}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      point: {
        hoverBackgroundColor: "#22c55e",
        hoverBorderColor: "#F7F3E3",
        hoverBorderWidth: 2.5,
      },
    },
    onHover: (_event: any, chartElements: any[], chart: any) => {
      const canvas = chart.canvas;
      canvas.style.cursor = chartElements.length > 0 ? "crosshair" : "default";
    },
  };

  if (pricesLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center">
        <p className="text-[rgba(247,243,227,0.6)] text-sm">
          Loading Bitcoin price data...
        </p>
      </div>
    );
  }

  if (!events || events.length === 0 || !prices || prices.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center">
        <p className="text-[rgba(247,243,227,0.6)] text-sm">
          {!events || events.length === 0
            ? "No transaction data to display."
            : "No Bitcoin price data available."}
          <br />
          <br />
          Add events to the right, or use File &gt; Import CSV Data to get
          started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Line
        ref={chartRef}
        key={`portfolio-chart-${days ?? "all"}-${events.length}`}
        data={chartData}
        options={chartOptions}
      />
    </div>
  );
}
