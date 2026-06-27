import React from "react";

export interface AnalyticsMetric {
  title: string;
  value: string;
  subtitle: string;
  color?: "default" | "green" | "orange" | "blue";
}

interface AnalyticsSectionProps {
  sectionTitle: string;
  metrics: AnalyticsMetric[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  sectionTitle,
  metrics,
}) => {
  const getValueColor = (color?: string) => {
    switch (color) {
      case "green":
        return "text-lightgreen";
      case "orange":
        return "text-[#f7931a]";
      case "blue":
        return "text-[#61dafb]";
      default:
        return "text-[#F7F3E3]";
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-[#F7F3E3] mb-3">
        {sectionTitle}
      </h3>

      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]"
          >
            <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
              {metric.title}
            </div>
            <div className={`text-sm ${getValueColor(metric.color)}`}>
              {metric.value}
            </div>
            <div className="text-xs text-[rgba(247,243,227,0.5)]">
              {metric.subtitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsSection;
