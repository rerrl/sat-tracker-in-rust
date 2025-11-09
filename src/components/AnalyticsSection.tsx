import React from "react";

export interface AnalyticsMetric {
  title: string;
  value: string;
  subtitle: string;
  color?: 'default' | 'green' | 'orange' | 'blue';
}

export interface PremiumTeaseCard {
  title: string;
  value: string;
  subtitle: string;
  description: string;
}

interface AnalyticsSectionProps {
  sectionTitle: string;
  metrics: AnalyticsMetric[];
  premiumCards: PremiumTeaseCard[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  sectionTitle,
  metrics,
  premiumCards,
}) => {
  const getValueColor = (color?: string) => {
    switch (color) {
      case 'green':
        return 'text-lightgreen';
      case 'orange':
        return 'text-[#f7931a]';
      case 'blue':
        return 'text-[#61dafb]';
      default:
        return 'text-[#F7F3E3]';
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

      {/* Premium Tease Section */}
      <div className="mt-6 pt-4 border-t border-[rgba(247,243,227,0.1)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#F7F3E3]">
            Premium Analytics
          </h3>
          <span className="text-xs bg-gradient-to-r from-[#f7931a] to-[#61dafb] text-black px-2 py-1 rounded font-medium">
            PREMIUM
          </span>
        </div>

        <div className="space-y-3">
          {premiumCards.map((card, index) => (
            <div
              key={index}
              className="bg-[rgba(247,243,227,0.05)] p-3 rounded border border-[rgba(247,243,227,0.1)]"
            >
              <div className="text-xs text-[rgba(247,243,227,0.6)] mb-1">
                {card.title}
              </div>
              <div className="relative">
                <div className="text-sm text-lightgreen mb-1 blur-sm select-none">
                  {card.value}
                </div>
                <div className="absolute inset-0 flex items-center">
                  <span className="text-xs bg-gradient-to-r from-[#f7931a] to-[#61dafb] text-black px-2 py-0.5 rounded font-medium">
                    PREMIUM
                  </span>
                </div>
              </div>
              <div className="text-xs text-[rgba(247,243,227,0.7)] mb-2">
                {card.subtitle}
              </div>
              <div className="text-xs text-[rgba(247,243,227,0.4)]">
                {card.description}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-[rgba(97,218,251,0.05)] rounded border border-[rgba(97,218,251,0.2)]">
          <div className="text-xs text-[#61dafb] mb-2">
            💡 Premium features coming soon!
          </div>
          <div className="text-xs text-[rgba(247,243,227,0.7)]">
            Let me know what analytics you'd like to see. I'm building these
            features based on user feedback.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
