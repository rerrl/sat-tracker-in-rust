import React, { useState, useEffect, useRef, useCallback } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

const EventItem = React.memo(({ 
  event, 
  isEditing, 
  isCreating,
  onEdit, 
  onSave, 
  onDelete, 
  onCancel,
  editData,
  onEditDataChange 
}: { 
  event: BalanceChangeEvent | null; // Allow null for new events
  isEditing: boolean;
  isCreating?: boolean; // New prop to indicate creation mode
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  editData: any;
  onEditDataChange: (field: string, value: any) => void;
}) => {
  if (isEditing || isCreating) {
    return (
      <div className="border-b border-[rgba(247,243,227,0.1)] bg-[rgba(247,243,227,0.05)] px-4 py-2 text-xs">
        <div className="grid grid-cols-6 gap-2 items-center">
          <div className="text-[rgba(247,243,227,0.6)]">
            {isCreating ? 'New Event' : (
              new Date(event!.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }).replace(',', '')
            )}
          </div>
          <div>
            <select 
              value={editData.event_type}
              onChange={(e) => onEditDataChange('event_type', e.target.value)}
              className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
              style={{ 
                backgroundColor: '#090C08', 
                color: '#F7F3E3',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              <option value="Buy" style={{ backgroundColor: '#090C08', color: '#F7F3E3' }}>Buy</option>
              <option value="Sell" style={{ backgroundColor: '#090C08', color: '#F7F3E3' }}>Sell</option>
              <option value="Fee" style={{ backgroundColor: '#090C08', color: '#F7F3E3' }}>Fee</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              value={editData.amount_sats === '' ? '' : (editData.amount_sats?.toString() || '')}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string or positive integers only
                if (value === '' || /^[1-9]\d*$/.test(value)) {
                  onEditDataChange('amount_sats', value === '' ? '' : parseInt(value));
                }
              }}
              className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
            />
          </div>
          <div>
            <input
              type="text"
              value={editData.value_cents === null || editData.value_cents === undefined ? '' : 
                     editData.value_cents === '' ? '' : 
                     (typeof editData.value_cents === 'string' ? editData.value_cents : (editData.value_cents / 100).toString())}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string or positive numbers with up to 2 decimal places
                if (value === '' || /^[0-9]+(\.[0-9]{0,2})?$/.test(value)) {
                  if (value === '') {
                    onEditDataChange('value_cents', '');
                  } else {
                    // Store the string value during typing, convert to cents only when complete
                    onEditDataChange('value_cents', value);
                  }
                }
              }}
              onBlur={() => {
                if (editData.value_cents && typeof editData.value_cents === 'string') {
                  const numValue = parseFloat(editData.value_cents);
                  if (!isNaN(numValue)) {
                    onEditDataChange('value_cents', Math.round(numValue * 100));
                  }
                }
              }}
              className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
              placeholder="0.00"
            />
          </div>
          <div>
            <input
              type="text"
              value={editData.memo || ''}
              onChange={(e) => onEditDataChange('memo', e.target.value || null)}
              className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
              placeholder="Memo"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={onSave}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded"
            >
              Save
            </button>
            {!isCreating && ( // Only show delete button when editing existing events
              <button
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded"
              >
                Del
              </button>
            )}
            <button
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular display mode (only for existing events)
  if (!event) return null;
  
  return (
    <div className="border-b border-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.1)] px-4 py-2 text-xs group">
      <div className="grid grid-cols-6 gap-2 items-center">
        <div className="text-[rgba(247,243,227,0.6)]">
          {new Date(event.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).replace(',', '')}
        </div>
        <div className="font-medium text-[#F7F3E3]">
          {event.event_type}
        </div>
        <div className="text-[rgba(247,243,227,0.8)]">
          {event.amount_sats.toLocaleString()} sats
        </div>
        <div className="text-[rgba(247,243,227,0.8)]">
          {event.value_cents ? `$${(event.value_cents / 100).toFixed(2)}` : '-'}
        </div>
        <div className="text-[rgba(247,243,227,0.6)] truncate">
          {event.memo || '-'}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded transition-opacity"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
});

function App() {
  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventData, setNewEventData] = useState<any>(null);

  const observer = useRef<IntersectionObserver>();
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMoreEvents();
          }
        },
        {
          rootMargin: "200px", // Start loading 200px before reaching the element
        }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load more events - load big chunks for smooth experience
  async function loadMoreEvents() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await TauriService.getBalanceChangeEvents(
        currentPage,
        200
      ); // Load 200 at once

      setEvents((prevEvents) => [...prevEvents, ...result.events]);
      setHasMore(result.has_more);
      setCurrentPage((prevPage) => prevPage + 1);
      setTotalCount(result.total_count);

      console.log(`Loaded page ${result.page}, has more: ${result.has_more}`);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load initial events
  async function loadInitialEvents() {
    setLoading(true);
    try {
      const result = await TauriService.getBalanceChangeEvents(0, 200); // Load 200 initially
      setEvents(result.events);
      setHasMore(result.has_more);
      setCurrentPage(1);
      setTotalCount(result.total_count);
    } catch (error) {
      console.error("Error loading initial events:", error);
    } finally {
      setLoading(false);
    }
  }


  const handleEditEvent = (event: BalanceChangeEvent) => {
    // Cancel new event creation if in progress
    setIsCreatingNew(false);
    setNewEventData(null);
    
    setEditingEventId(event.id);
    setEditData({
      event_type: event.event_type,
      amount_sats: event.amount_sats,
      value_cents: event.value_cents,
      memo: event.memo
    });
  };

  const handleSaveEvent = async () => {
    if (!editingEventId || !editData) return;
    
    try {
      const updateRequest = {
        amount_sats: editData.amount_sats,
        value_cents: editData.value_cents,
        event_type: editData.event_type as 'Buy' | 'Sell' | 'Fee',
        memo: editData.memo
      };
      
      const updatedEvent = await TauriService.updateBalanceChangeEvent(editingEventId, updateRequest);
      
      // Update the event in the local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === editingEventId ? updatedEvent : event
        )
      );
      
      console.log('Event updated successfully:', updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEventId) return;
    
    try {
      await TauriService.deleteBalanceChangeEvent(editingEventId);
      
      // Remove the event from local state
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== editingEventId)
      );
      
      // Update total count
      setTotalCount(prevCount => prevCount - 1);
      
      console.log('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditData(null);
  };

  const handleEditDataChange = (field: string, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNewEvent = () => {
    setIsCreatingNew(true);
    setNewEventData({
      event_type: 'Buy',
      amount_sats: 0,
      value_cents: null,
      memo: null
    });
    // Cancel any existing edits
    setEditingEventId(null);
    setEditData(null);
  };

  const handleSaveNewEvent = async () => {
    if (!newEventData) return;
    
    try {
      const createRequest = {
        amount_sats: newEventData.amount_sats,
        value_cents: newEventData.value_cents,
        event_type: newEventData.event_type as 'Buy' | 'Sell' | 'Fee',
        memo: newEventData.memo
      };
      
      const createdEvent = await TauriService.createBalanceChangeEvent(createRequest);
      
      // Add the new event to the beginning of the list
      setEvents(prevEvents => [createdEvent, ...prevEvents]);
      
      // Update total count
      setTotalCount(prevCount => prevCount + 1);
      
      console.log('Event created successfully:', createdEvent);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsCreatingNew(false);
      setNewEventData(null);
    }
  };

  const handleCancelNewEvent = () => {
    setIsCreatingNew(false);
    setNewEventData(null);
  };

  const handleNewEventDataChange = (field: string, value: any) => {
    setNewEventData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Load initial events on component mount
  useEffect(() => {
    loadInitialEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#090C08]">
      {/* Title Header */}
      <div className="bg-[#2A2633] border-b border-[rgba(247,243,227,0.2)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[#F7F3E3]">
          Sat Tracker{" "}
          <span className="text-sm font-normal">
            by{" "}
            <span className="text-[#E16036]">dprogram</span>
            <span className="text-[#F7F3E3]">.me</span>
          </span>
        </h1>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex h-[calc(100vh-73px)]"> {/* Subtract header height */}
        {/* Left Column - Portfolio Metrics (40%) */}
        <div className="w-2/5 border-r border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
          <div className="p-5 pb-3 shrink-0">
            <h2 className="text-lg font-semibold text-[#F7F3E3]">
              Portfolio Metrics
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Overview Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Overview
              </h3>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 text-center border border-[#61dafb] bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-[#61dafb] mb-1">Bitcoin Price</p>
                  <p className="text-lg text-[#61dafb]">$97,234</p>
                  <p className="text-xs text-[#61dafb]">+2.4%</p>
                </div>
                <div className="flex-1 text-center border border-[#f7931a] bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Portfolio Value</p>
                  <p className="text-lg text-[#f7931a]">$12,847.32</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-[#f7931a] bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Current Sats</p>
                  <p className="text-lg text-[#f7931a]">13,214,567</p>
                  <p className="text-xs text-[#f7931a]">0.13214567 BTC</p>
                </div>
                <div className="flex-1 text-center border border-[#f7931a] bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Total Sats Stacked</p>
                  <p className="text-lg text-[#f7931a]">15,234,567</p>
                </div>
              </div>
            </div>

            {/* Buys Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Buys
              </h3>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 text-center border border-lightgreen bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightgreen mb-1">Avg Buy Price</p>
                  <p className="text-lg text-lightgreen">$89,456</p>
                </div>
                <div className="flex-1 text-center border border-lightgreen bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightgreen mb-1">Total Invested</p>
                  <p className="text-lg text-lightgreen">$11,823.45</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-lightgreen bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightgreen mb-1">Unrealized Gain</p>
                  <p className="text-lg text-lightgreen">+$1,023.87</p>
                  <p className="text-xs text-lightgreen">+8.66%</p>
                </div>
              </div>
            </div>

            {/* Sells Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Sells
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-lightcoral bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Avg Sell Price</p>
                  <p className="text-lg text-lightcoral">$95,234</p>
                </div>
                <div className="flex-1 text-center border border-lightcoral bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Fiat Extracted</p>
                  <p className="text-lg text-lightcoral">$2,156.78</p>
                </div>
                <div className="flex-1 text-center border border-lightcoral bg-[rgba(9,12,8,0.5)] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Total Sats Spent</p>
                  <p className="text-lg text-lightcoral">2,020,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Split into top and bottom (60%) */}
        <div className="flex-1 flex flex-col">
          {/* Top Section (50%) */}
          <div className="h-1/2 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(9,12,8,0.8)]">
            <div className="p-6">
              <div className="text-[rgba(247,243,227,0.5)] text-center">
                Top section content coming soon...
              </div>
            </div>
          </div>
          
          {/* Bottom Section (50%) - Events */}
          <div className="h-1/2 bg-[#2A2633] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(42,38,51,0.8)] shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[#F7F3E3]">
                  Events ({events.length} of {totalCount})
                </h3>
                <button
                  onClick={handleAddNewEvent}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
                >
                  Add Event
                </button>
              </div>
              {/* Column Headers */}
              <div className="grid grid-cols-6 gap-2 mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]">
                <div>Date</div>
                <div>Type</div>
                <div>Amount</div>
                <div>Value</div>
                <div>Memo</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Events List - Scrollable within this section only */}
            <div className="flex-1 overflow-y-auto">
              {/* New Event Row using EventItem */}
              {isCreatingNew && (
                <EventItem 
                  event={null}
                  isEditing={false}
                  isCreating={true}
                  onEdit={() => {}}
                  onSave={handleSaveNewEvent}
                  onDelete={() => {}}
                  onCancel={handleCancelNewEvent}
                  editData={newEventData}
                  onEditDataChange={handleNewEventDataChange}
                />
              )}
              
              {events.map((event, index) => (
                <div
                  key={event.id}
                  ref={index === events.length - 10 ? lastEventElementRef : undefined}
                >
                  <EventItem 
                    event={event}
                    isEditing={editingEventId === event.id}
                    isCreating={false}
                    onEdit={() => handleEditEvent(event)}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onCancel={handleCancelEdit}
                    editData={editData}
                    onEditDataChange={handleEditDataChange}
                  />
                </div>
              ))}
              
              {loading && (
                <div className="text-center py-4">
                  <div className="text-xs text-[rgba(247,243,227,0.6)]">
                    Loading more events...
                  </div>
                </div>
              )}
              {!hasMore && events.length > 0 && (
                <div className="text-center py-4">
                  <div className="text-xs text-[rgba(247,243,227,0.5)]">
                    No more events to load
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
