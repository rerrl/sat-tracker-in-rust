import React from "react";
import EventsList from "../EventsList";
import { BitcoinTransaction } from "../../services/tauriService";

interface MainLayoutProps {
  // Left side content
  leftContent: React.ReactNode;

  // Right side analytics content
  analyticsContent: React.ReactNode;

  // Events list props (since this seems consistent across tools)
  events: BitcoinTransaction[];
  totalCount: number;
  editingEventId: string | null;
  selectedEventId: string | null;
  editData: any;
  isCreatingNew: boolean;
  newEventData: any;
  onAddNewEvent: () => void;
  onEditEvent: (event: BitcoinTransaction) => void;
  onSelectEvent: (eventId: string | null) => void;
  onSaveEvent: () => Promise<void>;
  onDeleteEvent: () => Promise<void>;
  onCancelEdit: () => void;
  onEditDataChange: (field: string, value: any) => void;
  onSaveNewEvent: () => Promise<void>;
  onCancelNewEvent: () => void;
  onNewEventDataChange: (field: string, value: any) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  leftContent,
  analyticsContent,
  events,
  totalCount,
  editingEventId,
  selectedEventId,
  editData,
  isCreatingNew,
  newEventData,
  onAddNewEvent,
  onEditEvent,
  onSelectEvent,
  onSaveEvent,
  onDeleteEvent,
  onCancelEdit,
  onEditDataChange,
  onSaveNewEvent,
  onCancelNewEvent,
  onNewEventDataChange,
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
        <EventsList
          events={events}
          totalCount={totalCount}
          editingEventId={editingEventId}
          selectedEventId={selectedEventId}
          editData={editData}
          isCreatingNew={isCreatingNew}
          newEventData={newEventData}
          onAddNewEvent={onAddNewEvent}
          onEditEvent={onEditEvent}
          onSelectEvent={onSelectEvent}
          onSaveEvent={onSaveEvent}
          onDeleteEvent={onDeleteEvent}
          onCancelEdit={onCancelEdit}
          onEditDataChange={onEditDataChange}
          onSaveNewEvent={onSaveNewEvent}
          onCancelNewEvent={onCancelNewEvent}
          onNewEventDataChange={onNewEventDataChange}
        />
      </div>
    </div>
  );
};

export default MainLayout;
