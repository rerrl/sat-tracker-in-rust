import React, { useEffect } from "react";
import Announcements from "./Announcements";
import { openUrl } from "@tauri-apps/plugin-opener";

interface AppHeaderProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  showToolDropdown: boolean;
  setShowToolDropdown: (show: boolean) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  selectedTool,
  setSelectedTool,
  showToolDropdown,
  setShowToolDropdown,
}) => {
  // Close tool dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showToolDropdown) {
        const target = event.target as Element;
        if (!target.closest(".tool-dropdown")) {
          setShowToolDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showToolDropdown, setShowToolDropdown]);

  return (
    <div className="bg-[#2A2633] border-b border-[rgba(247,243,227,0.2)] shrink-0 flex">
      {/* Left side - Title and Announcements (65%) */}
      <div className="w-[65%] px-6 py-3 flex items-center gap-6">
        <h1 className="text-xl font-bold text-[#F7F3E3] whitespace-nowrap">
          Sat Tracker{" "}
          <span className="text-sm font-normal">
            by <span className="text-[#E16036]">dprogram</span>
            <span className="text-[#F7F3E3]">.me</span>
          </span>
        </h1>

        <div className="flex-1 min-w-0">
          <Announcements />
        </div>
      </div>

      {/* Right side - Tool Selector (35%) */}
      <div className="w-[35%] px-6 py-3 flex items-center justify-between">
        {/* Update Available Button */}
        <button 
          className="text-xs text-[#F7F3E3] bg-[rgba(247,147,26,0.2)] border border-[rgba(247,147,26,0.3)] px-2 py-1 rounded hover:bg-[rgba(247,147,26,0.3)] flex items-center gap-1 cursor-pointer"
          onClick={async () => {
            try {
              await openUrl("https://dprogram.me/tools/sat-tracker");
            } catch (error) {
              console.error("Failed to open link:", error);
            }
          }}
        >
          <span className="text-[10px]">🔄</span>
          Update Available
        </button>

        {/* Tool Selector Dropdown */}
        <div className="relative tool-dropdown">
          <button
            onClick={() => setShowToolDropdown(!showToolDropdown)}
            className="text-sm text-[#F7F3E3] bg-[rgba(97,218,251,0.15)] border border-[rgba(97,218,251,0.3)] px-3 py-1.5 rounded hover:bg-[rgba(97,218,251,0.2)] flex items-center gap-2 font-medium"
          >
            {selectedTool === "overview" && "Overview"}
            {selectedTool === "focus" && "Focus"}
            {selectedTool === "trends" && "Trends"}
            {selectedTool === "activity" && "Activity"}
            <span className="text-xs">▼</span>
          </button>
          {showToolDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded shadow-lg z-10 min-w-[120px]">
              <button
                onClick={() => {
                  setSelectedTool("overview");
                  setShowToolDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                  selectedTool === "overview"
                    ? "text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]"
                    : "text-[rgba(247,243,227,0.7)]"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setSelectedTool("activity");
                  setShowToolDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[rgba(247,243,227,0.1)] ${
                  selectedTool === "activity"
                    ? "text-[#F7F3E3] bg-[rgba(247,243,227,0.05)]"
                    : "text-[rgba(247,243,227,0.7)]"
                }`}
              >
                Activity
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                disabled
              >
                More coming soon...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
