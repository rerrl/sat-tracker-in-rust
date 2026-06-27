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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface SatsHoldingsChartProps {
  /** Number of days to show, or null for all data */
  days?: number | null;
}

export default function SatsHoldingsChart({
  days = 90,
}: SatsHoldingsChartProps) {
  const chartRef = useRef<any>(null);

  // Get events data using the hook
  const { events } = useUnifiedEvents(true);

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
    if (!events || events.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort events by date (oldest first)
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate running sats balance
    let runningBalance = 0;
    const dataPoints: Array<{ date: Date; balance: number }> =
      sortedEvents.map((event) => {
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
        return { date: new Date(event.timestamp), balance: runningBalance };
      });

    // Add current point (today) with same balance so line reaches the edge
    if (dataPoints.length > 0) {
      dataPoints.push({
        date: new Date(),
        balance: runningBalance,
      });
    }

    // Apply time range filter
    const cutoff =
      days != null
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : null;

    let filtered = dataPoints;
    if (cutoff) {
      // Include the point just before the cutoff so the line starts anchored
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

    const data = filtered.map((point) => point.balance);

    return {
      labels,
      datasets: [
        {
          label: "Sats Holdings",
          data,
          borderColor: "#f7931a",
          backgroundColor: (ctx: any) => {
            if (!ctx.chart.chartArea) return "rgba(247, 147, 26, 0.08)";
            const { ctx: canvasCtx, chartArea } = ctx.chart;
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, "rgba(247, 147, 26, 0.18)");
            gradient.addColorStop(0.5, "rgba(247, 147, 26, 0.06)");
            gradient.addColorStop(1, "rgba(247, 147, 26, 0.01)");
            return gradient;
          },
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#f7931a",
          pointHoverBorderColor: "#F7F3E3",
          pointHoverBorderWidth: 2.5,
        },
      ],
    };
  }, [events, days]);

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
        bodyColor: "#f7931a",
        borderColor: "rgba(247, 147, 26, 0.25)",
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
            return `${val.toLocaleString()} sats`;
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
            return value.toLocaleString();
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
        hoverBackgroundColor: "#f7931a",
        hoverBorderColor: "#F7F3E3",
        hoverBorderWidth: 2.5,
      },
    },
    // Draw a vertical crosshair line on hover
    onHover: (_event: any, chartElements: any[], chart: any) => {
      const canvas = chart.canvas;
      canvas.style.cursor = chartElements.length > 0 ? "crosshair" : "default";
    },
  };

  if (!events || events.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center">
        <p className="text-[rgba(247,243,227,0.6)] text-sm">
          No transaction data to display.
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
        key={`sats-chart-${days ?? "all"}-${events.length}`}
        data={chartData}
        options={chartOptions}
      />
    </div>
  );
}