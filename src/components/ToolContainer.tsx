import React from "react";
import OverviewTool from "./tools/OverviewTool";
import ActivityTool from "./tools/ActivityTool";
import { ExchangeTransaction } from "../services/tauriService";

interface ToolContainerProps {
  selectedTool: string;
}

const ToolContainer: React.FC<ToolContainerProps> = ({
  selectedTool,
}) => {
  const renderTool = () => {
    switch (selectedTool) {
      case "overview":
        return <OverviewTool />;
      case "activity":
        return <ActivityTool />;
      default:
        return <OverviewTool />;
    }
  };

  return (
    <div className="flex-1 min-h-0 max-h-full overflow-hidden">
      {renderTool()}
    </div>
  );
};

export default ToolContainer;
