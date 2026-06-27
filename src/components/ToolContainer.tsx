import React from "react";
import EventsList from "./EventsList";
import OverviewToolMain from "./tools/OverviewToolMain";
import OverviewToolAnalytics from "./tools/OverviewToolAnalytics";
import ActivityToolMain from "./tools/ActivityToolMain";
import ActivityToolAnalytics from "./tools/ActivityToolAnalytics";

interface ToolContainerProps {
  selectedTool: string;
}

const ToolContainer: React.FC<ToolContainerProps> = ({ selectedTool }) => {
  const isOverview = selectedTool === "overview";

  return (
    <div className="flex h-full min-h-0 max-h-full overflow-hidden">
      {/* Left Column — Tool Content (65%) */}
      <div className="w-[65%] bg-[rgba(9,12,8,0.8)] flex flex-col min-h-0">
        {isOverview ? <OverviewToolMain /> : <ActivityToolMain />}
      </div>

      {/* Right Column — Analytics + Events (35%) */}
      <div className="w-[35%] border-l border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col min-h-0">
        {/* Analytics Section — fixed 50% height */}
        <div className="h-1/2 overflow-y-auto shrink-0">
          {isOverview ? <OverviewToolAnalytics /> : <ActivityToolAnalytics />}
        </div>

        {/* Events List — remaining 50%, ALWAYS MOUNTED */}
        <EventsList />
      </div>
    </div>
  );
};

export default ToolContainer;