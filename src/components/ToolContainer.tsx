import React from "react";
import OverviewTool from "./tools/OverviewTool";
import ActivityTool from "./tools/ActivityTool";
import { BalanceChangeEvent } from "../services/tauriService";

interface ToolContainerProps {
  selectedTool: string;
  events: BalanceChangeEvent[];
  eventsLoading: boolean;
  totalCount: number;
  editingEventId: string | null;
  editData: any;
  isCreatingNew: boolean;
  newEventData: any;
  onAddNewEvent: () => void;
  onEditEvent: (event: BalanceChangeEvent) => void;
  onSaveEvent: () => Promise<void>;
  onDeleteEvent: () => Promise<void>;
  onCancelEdit: () => void;
  onEditDataChange: (field: string, value: any) => void;
  onSaveNewEvent: () => Promise<void>;
  onCancelNewEvent: () => void;
  onNewEventDataChange: (field: string, value: any) => void;
}

const ToolContainer: React.FC<ToolContainerProps> = ({
  selectedTool,
  events,
  eventsLoading,
  totalCount,
  editingEventId,
  editData,
  isCreatingNew,
  newEventData,
  onAddNewEvent,
  onEditEvent,
  onSaveEvent,
  onDeleteEvent,
  onCancelEdit,
  onEditDataChange,
  onSaveNewEvent,
  onCancelNewEvent,
  onNewEventDataChange,
}) => {
  const sharedProps = {
    events,
    eventsLoading,
    totalCount,
    editingEventId,
    editData,
    isCreatingNew,
    newEventData,
    onAddNewEvent,
    onEditEvent,
    onSaveEvent,
    onDeleteEvent,
    onCancelEdit,
    onEditDataChange,
    onSaveNewEvent,
    onCancelNewEvent,
    onNewEventDataChange,
  };

  const renderTool = () => {
    switch (selectedTool) {
      case "overview":
        return <OverviewTool {...sharedProps} />;
      case "activity":
        return <ActivityTool {...sharedProps} />;
      default:
        return <OverviewTool {...sharedProps} />;
    }
  };

  return (
    <div className="flex-1 min-h-0 max-h-full overflow-hidden">
      {renderTool()}
    </div>
  );
};

export default ToolContainer;
