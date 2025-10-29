import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BalanceChangeEvent } from "../services/tauriService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SatsHoldingsChartProps {
  events: BalanceChangeEvent[];
}

export default function SatsHoldingsChart({ events }: SatsHoldingsChartProps) {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Sort events by date (oldest first)
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate running sats balance
    let runningBalance = 0;
    const dataPoints: Array<{
      date: Date;
      balance: number;
      event: BalanceChangeEvent | null;
    }> = sortedEvents.map((event) => {
      // Apply the correct sign based on event type
      let balanceChange = 0;
      if (event.event_type === "Buy") {
        balanceChange = event.amount_sats; // Positive - adds to balance
      } else if (event.event_type === "Sell" || event.event_type === "Fee") {
        balanceChange = -event.amount_sats; // Negative - subtracts from balance
      }

      runningBalance += balanceChange;
      return {
        date: new Date(event.timestamp),
        balance: runningBalance,
        event: event,
      };
    });

    // Add current point (today) with same balance
    if (dataPoints.length > 0) {
      dataPoints.push({
        date: new Date(),
        balance: runningBalance,
        event: null,
      });
    }

    const labels = dataPoints.map((point) =>
      point.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
    );

    const data = dataPoints.map((point) => point.balance);

    return {
      labels,
      datasets: [
        {
          label: "Sats Holdings",
          data,
          borderColor: "#f7931a",
          backgroundColor: "rgba(247, 147, 26, 0.05)",
          borderWidth: 1.5,
          fill: true,
          tension: 0.2,
          pointBackgroundColor: "#f7931a",
          pointBorderColor: "#2A2633",
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [events]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(42, 38, 51, 0.95)",
        titleColor: "#F7F3E3",
        bodyColor: "#F7F3E3",
        borderColor: "rgba(247, 243, 227, 0.3)",
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `Sats: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(247, 243, 227, 0.08)",
          lineWidth: 1,
        },
        border: {
          color: "rgba(247, 243, 227, 0.2)",
        },
        ticks: {
          color: "rgba(247, 243, 227, 0.5)",
          maxTicksLimit: 6,
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: "rgba(247, 243, 227, 0.08)",
          lineWidth: 1,
        },
        border: {
          color: "rgba(247, 243, 227, 0.2)",
        },
        ticks: {
          color: "rgba(247, 243, 227, 0.5)",
          font: {
            size: 10,
          },
          callback: function (value: any) {
            return value.toLocaleString() + " sats";
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    elements: {
      point: {
        hoverBackgroundColor: "#f7931a",
        hoverBorderColor: "#F7F3E3",
        hoverBorderWidth: 2,
      },
    },
  };

  if (!events || events.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[rgba(247,243,227,0.6)] text-sm">
          No transaction data to display
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Line 
        key={events.length + events.map(e => e.id).join(',')} 
        data={chartData} 
        options={chartOptions} 
      />
    </div>
  );
}
