import React, { useMemo } from "react";
import { YearHeatmapData } from "../services/tauriService";

interface ActivityHeatmapProps {
  heatmapData: YearHeatmapData[] | undefined;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ heatmapData }) => {
  console.log("[ActivityHeatmap] Component rendering with data:", heatmapData?.length, "years");
  console.log("[ActivityHeatmap] heatmapData reference:", heatmapData);
  console.log("[ActivityHeatmap] heatmapData stringified:", JSON.stringify(heatmapData?.map(y => ({ year: y.year, weekCount: y.weeks?.length })) || []));
  
  // Simple utility functions - no need to memoize these
  const getIntensityClass = (level: number): string => {
    switch (level) {
      case 0:
        return "bg-[rgba(247,243,227,0.1)]"; // No activity
      case 1:
        return "bg-[rgba(247,147,26,0.3)]"; // Low
      case 2:
        return "bg-[rgba(247,147,26,0.5)]"; // Medium-low
      case 3:
        return "bg-[rgba(247,147,26,0.7)]"; // Medium-high
      case 4:
        return "bg-[rgba(247,147,26,0.9)]"; // High
      default:
        return "bg-[rgba(247,243,227,0.1)]";
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Static arrays - no need to memoize
  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  // Only memoize the expensive computation - the actual heatmap rendering
  const heatmapContent = useMemo(() => {
    console.log("[ActivityHeatmap] Rendering heatmap content for", heatmapData?.length, "years");
    console.log("[ActivityHeatmap] useMemo triggered - heatmapData changed");
    console.log("[ActivityHeatmap] Data content hash:", JSON.stringify(heatmapData?.map(y => ({ year: y.year, weekCount: y.weeks?.length })) || []));
    
    if (!heatmapData || heatmapData.length === 0) {
      console.log("[ActivityHeatmap] No heatmap data available");
      return null;
    }

    // Create legend inline
    const legend = (
      <div className="flex items-center gap-2 text-xs text-[rgba(247,243,227,0.5)]">
        <span>Less</span>
        <div className="flex">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 border border-[rgba(247,243,227,0.2)] ${getIntensityClass(level)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    );

    return (
      <div className="space-y-6">
        {heatmapData.map((yearData, yearIndex) => {
          console.log("[ActivityHeatmap] Rendering year", yearData.year, "with", yearData.weeks?.length, "weeks");
          
          return (
            <div key={yearData.year} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#F7F3E3]">{yearData.year}</h4>

                {/* Show legend only for the first (most recent) year */}
                {yearIndex === 0 && legend}
              </div>

              {/* Month labels */}
              <div className="flex text-xs text-[rgba(247,243,227,0.5)] mb-2 relative h-4">
                <div className="w-8 mr-2"></div>
                <div className="flex-1 relative">
                  {monthLabels.map((month, index) => (
                    <div
                      key={month}
                      className="absolute text-center transform -translate-x-1/2"
                      style={{ left: `${(index + 0.5) * (100 / 12)}%` }}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col text-xs text-[rgba(247,243,227,0.5)] mr-2 w-8">
                  {dayLabels.map((label, index) => (
                    <div key={index} className="h-3 flex items-center justify-end">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex-1 flex">
                  {yearData.weeks?.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col flex-1">
                      {week.days?.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`h-3 border border-[rgba(247,243,227,0.2)] ${getIntensityClass(day.level)} cursor-pointer hover:border-[rgba(247,243,227,0.4)] transition-colors`}
                          title={`${formatDate(day.date)}: ${day.sats.toLocaleString()} sats`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [heatmapData]); // Only depend on heatmapData

  console.log("[ActivityHeatmap] Returning memoized content");
  
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[rgba(247,243,227,0.6)] text-sm">
          No activity data available
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Chart Header */}
      <div className="p-4 pb-2 shrink-0 border-b border-[rgba(247,243,227,0.1)]">
        <h2 className="text-lg font-semibold text-[#F7F3E3]">
          Activity Heatmap
        </h2>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 w-full h-full">
          {heatmapContent}
        </div>
      </div>
    </>
  );
};

export default React.memo(ActivityHeatmap);
