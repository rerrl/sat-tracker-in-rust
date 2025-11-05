import React from 'react';
import OverviewTool from './tools/OverviewTool';
import ActivityTool from './tools/ActivityTool';

interface ToolContainerProps {
  selectedTool: string;
  // Add any shared props that tools might need
}

const ToolContainer: React.FC<ToolContainerProps> = ({ selectedTool }) => {
  const renderTool = () => {
    switch (selectedTool) {
      case 'overview':
        return <OverviewTool />;
      case 'activity':
        return <ActivityTool />;
      case 'focus':
        return <div className="p-4 text-[#F7F3E3]">Focus tool coming soon...</div>;
      case 'trends':
        return <div className="p-4 text-[#F7F3E3]">Trends tool coming soon...</div>;
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
