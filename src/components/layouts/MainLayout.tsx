import React from "react";
import EventsList from "../EventsList";

interface MainLayoutProps {
  // Left side content
  leftContent: React.ReactNode;

  // Right side analytics content
  analyticsContent: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  leftContent,
  analyticsContent,
}) => {
  return (
    <div className="flex h-full min-h-0 max-h-full overflow-hidden">
      {/* Left Column - Main Content (65%) */}
      <div className="w-[65%] bg-[rgba(9,12,8,0.8)] flex flex-col">
        {leftContent}
      </div>

      {/* Right Column - Analytics + Events (35%) */}
      <div className="w-[35%] border-l border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
        {/* Analytics Section - Fixed 50% height with scroll */}
        <div className="h-1/2 overflow-y-auto shrink-0">
          {analyticsContent}
        </div>

        {/* Events List - Remaining 50% height */}
        <EventsList />
      </div>
    </div>
  );
};

export default MainLayout;
