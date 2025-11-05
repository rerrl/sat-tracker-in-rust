import React from 'react';
import EventsList from '../EventsList';
import { BalanceChangeEvent } from '../../services/tauriService';

interface MainLayoutProps {
  // Left side content
  leftContent: React.ReactNode;
  
  // Right side analytics content
  analyticsContent: React.ReactNode;
  
  // Events list props (since this seems consistent across tools)
  events: BalanceChangeEvent[];
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

const MainLayout: React.FC<MainLayoutProps> = ({
  leftContent,
  analyticsContent,
  events,
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
  return (
    <div className="flex h-full min-h-0 max-h-full overflow-hidden">
      {/* Left Column - Main Content (65%) */}
      <div className="w-[65%] bg-[rgba(9,12,8,0.8)] flex flex-col">
        {leftContent}
      </div>

      {/* Right Column - Analytics + Events (35%) */}
      <div className="w-[35%] border-l border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
        {analyticsContent}

        <EventsList
          events={events}
          totalCount={totalCount}
          editingEventId={editingEventId}
          editData={editData}
          isCreatingNew={isCreatingNew}
          newEventData={newEventData}
          onAddNewEvent={onAddNewEvent}
          onEditEvent={onEditEvent}
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
