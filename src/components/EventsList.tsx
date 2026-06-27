import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  EditBitcoinTransactionData,
  TauriService,
  UnifiedEvent,
} from "../services/tauriService";
import { invalidateAfterUnifiedEventDataChange } from "../utils/queryInvalidation";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { useInfiniteEvents } from "../hooks/useInfiniteEvents";
import EventItem from "./EventItem";

interface EventsListProps {}

const EventsList: React.FC<EventsListProps> = () => {
  // Internal state management
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditBitcoinTransactionData | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEventData, setNewEventData] =
    useState<EditBitcoinTransactionData | null>(null);

  // Infinite scroll data
  const {
    events,
    totalCount,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: _refetchEvents,
  } = useInfiniteEvents(true);
  const queryClient = useQueryClient();

  // Scroll container ref for virtualizer
  const scrollRef = useRef<HTMLDivElement>(null);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? events.length + 1 : events.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 5,
  });

  // Load more when approaching the end of loaded data
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastVirtualIndex =
    virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : 0;
  useEffect(() => {
    if (
      lastVirtualIndex >= events.length - 3 &&
      hasMore &&
      !isLoadingMore
    ) {
      loadMore();
    }
  }, [lastVirtualIndex, events.length, hasMore, isLoadingMore, loadMore]);

  // Internal event handlers (unchanged from original)
  const handleEditEvent = useCallback(
    (event: UnifiedEvent) => {
      if (selectedEventId !== event.id) return;

      setIsCreatingNew(false);
      setNewEventData(null);
      setEditingEventId(event.id);

      if (event.record_type === "onchain_fee") {
        setEditData({
          type: "Fee",
          amount_sats: event.amount_sats,
          subtotal_cents: null,
          fee_cents: null,
          memo: event.memo,
          timestamp: event.timestamp,
          provider_id: null,
          tx_hash: event.tx_hash,
        });
      } else {
        setEditData({
          type: event.transaction_type === "buy" ? "Buy" : "Sell",
          amount_sats: event.amount_sats,
          subtotal_cents: event.subtotal_cents,
          fee_cents: event.fee_cents,
          memo: event.memo,
          timestamp: event.timestamp,
          provider_id: null,
          tx_hash: null,
        });
      }
    },
    [selectedEventId]
  );

  const handleSelectEvent = useCallback(
    (eventId: string | null) => {
      if (editingEventId || isCreatingNew) return;
      setSelectedEventId(eventId);
    },
    [editingEventId, isCreatingNew]
  );

  const handleAddNewEvent = useCallback(() => {
    if (selectedEventId) {
      setSelectedEventId(null);
    }
    setIsCreatingNew(true);
    setNewEventData({
      type: "Buy",
      amount_sats: 0,
      subtotal_cents: null,
      fee_cents: 0,
      memo: null,
      timestamp: new Date().toISOString(),
      provider_id: null,
      tx_hash: null,
    });
    setEditingEventId(null);
    setEditData(null);
  }, [selectedEventId]);

  const handleSaveEvent = useCallback(async () => {
    if (!editingEventId || !editData) return;

    try {
      const eventToEdit = events.find((event) => event.id === editingEventId);
      if (!eventToEdit) {
        console.error("Event not found for editing");
        return;
      }

      if (eventToEdit.record_type === "onchain_fee") {
        const request = {
          amount_sats:
            typeof editData.amount_sats === "string"
              ? parseInt(editData.amount_sats)
              : editData.amount_sats,
          memo: editData.memo,
          timestamp: editData.timestamp,
          tx_hash: editData.tx_hash || null,
        };
        await TauriService.updateOnchainFee(editingEventId, request);
      } else {
        const request = {
          type: editData.type as "Buy" | "Sell",
          amount_sats:
            typeof editData.amount_sats === "string"
              ? parseInt(editData.amount_sats)
              : editData.amount_sats,
          subtotal_cents:
            typeof editData.subtotal_cents === "string"
              ? Math.round(parseFloat(editData.subtotal_cents) * 100)
              : editData.subtotal_cents,
          fee_cents:
            typeof editData.fee_cents === "string"
              ? Math.round(parseFloat(editData.fee_cents) * 100)
              : editData.fee_cents,
          memo: editData.memo,
          timestamp: editData.timestamp,
          provider_id: editData.provider_id,
        };
        await TauriService.updateExchangeTransaction(editingEventId, request);
      }

      invalidateAfterUnifiedEventDataChange(queryClient);
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  }, [editingEventId, editData, events, queryClient]);

  const handleDeleteEvent = useCallback(async () => {
    if (!editingEventId) return;

    const eventToDelete = events.find((event) => event.id === editingEventId);
    if (!eventToDelete) {
      console.error("Event not found for deletion");
      return;
    }

    try {
      if (eventToDelete.record_type === "exchange_transaction") {
        await TauriService.deleteExchangeTransaction(editingEventId);
      } else if (eventToDelete.record_type === "onchain_fee") {
        await TauriService.deleteOnchainFee(editingEventId);
      } else {
        console.error("Unknown event type:", eventToDelete.record_type);
        return;
      }

      invalidateAfterUnifiedEventDataChange(queryClient);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  }, [editingEventId, events, queryClient]);

  const handleCancelEdit = useCallback(() => {
    setEditingEventId(null);
    setEditData(null);
  }, []);

  const handleEditDataChange = useCallback(
    (field: keyof EditBitcoinTransactionData, value: any) => {
      setEditData((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : null
      );
    },
    []
  );

  const handleSaveNewEvent = useCallback(async () => {
    if (!newEventData) return;

    try {
      if (newEventData.type === "Fee") {
        const request = {
          amount_sats:
            typeof newEventData.amount_sats === "string"
              ? parseInt(newEventData.amount_sats)
              : newEventData.amount_sats,
          memo: newEventData.memo,
          timestamp: newEventData.timestamp,
          tx_hash: newEventData.tx_hash || null,
        };
        await TauriService.createOnchainFee(request);
      } else {
        const request = {
          type: newEventData.type as "Buy" | "Sell",
          amount_sats:
            typeof newEventData.amount_sats === "string"
              ? parseInt(newEventData.amount_sats)
              : newEventData.amount_sats,
          subtotal_cents:
            typeof newEventData.subtotal_cents === "string"
              ? Math.round(parseFloat(newEventData.subtotal_cents) * 100)
              : newEventData.subtotal_cents,
          fee_cents:
            typeof newEventData.fee_cents === "string"
              ? Math.round(parseFloat(newEventData.fee_cents) * 100)
              : newEventData.fee_cents,
          memo: newEventData.memo,
          timestamp: newEventData.timestamp,
          provider_id: newEventData.provider_id,
        };
        await TauriService.createExchangeTransaction(request);
      }

      invalidateAfterUnifiedEventDataChange(queryClient);
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreatingNew(false);
      setNewEventData(null);
    }
  }, [newEventData, queryClient]);

  const handleCancelNewEvent = useCallback(() => {
    setIsCreatingNew(false);
    setNewEventData(null);
  }, []);

  const handleNewEventDataChange = useCallback(
    (field: keyof EditBitcoinTransactionData, value: any) => {
      setNewEventData((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : null
      );
    },
    []
  );

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingEventId || isCreatingNew) {
          handleCancelEdit();
          handleCancelNewEvent();
        } else if (selectedEventId) {
          setSelectedEventId(null);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editingEventId,
    isCreatingNew,
    selectedEventId,
    handleCancelEdit,
    handleCancelNewEvent,
  ]);

  const renderRow = (virtualRow: VirtualItem) => {
    const isLoader = virtualRow.index >= events.length;

    if (isLoader) {
      return (
        <div
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center gap-2 text-xs text-[rgba(247,243,227,0.5)]">
              {isLoadingMore ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-[rgba(247,243,227,0.3)] border-t-[#f7931a] rounded-full animate-spin" />
                  Loading more events...
                </>
              ) : hasMore ? (
                "Scroll for more"
              ) : (
                "All events loaded"
              )}
            </div>
          </div>
        </div>
      );
    }

    const event = events[virtualRow.index];

    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={rowVirtualizer.measureElement}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <EventItem
          event={event}
          isEditing={editingEventId === event.id}
          isSelected={selectedEventId === event.id}
          isCreating={false}
          onEdit={() => handleEditEvent(event)}
          onSelect={() =>
            handleSelectEvent(selectedEventId === event.id ? null : event.id)
          }
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onCancel={handleCancelEdit}
          editData={
            editData || {
              type: "Buy",
              amount_sats: 0,
              subtotal_cents: null,
              fee_cents: null,
              memo: null,
              timestamp: new Date().toISOString(),
              provider_id: null,
              tx_hash: null,
            }
          }
          onEditDataChange={handleEditDataChange}
        />
      </div>
    );
  };

  return (
    <div className="h-1/2 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(42,38,51,0.8)] shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-md font-semibold text-[#F7F3E3]">
              Events ({events.length} of {totalCount})
            </h2>
            {totalCount > events.length && (
              <div className="text-xs text-[rgba(247,243,227,0.6)] mt-1">
                Scroll down to load more
              </div>
            )}
          </div>
          <button
            onClick={handleAddNewEvent}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
          >
            Add Event
          </button>
        </div>
        {/* Column Headers */}
        <div className="events-grid mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]">
          <div>Date</div>
          <div>Type</div>
          <div>Amount</div>
          <div>USD</div>
          <div>Rate</div>
          <div>Memo</div>
        </div>
      </div>

      {/* Virtualized Events List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* New Event Row */}
        {isCreatingNew && newEventData && (
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

        {/* Virtualized rows */}
        {events.length > 0 ? (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
              width: "100%",
            }}
          >
            {rowVirtualizer.getVirtualItems().map(renderRow)}
          </div>
        ) : !loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[rgba(247,243,227,0.6)] text-sm text-center">
              No Events
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-[rgba(247,243,227,0.5)]">
              <span className="inline-block w-3 h-3 border-2 border-[rgba(247,243,227,0.3)] border-t-[#f7931a] rounded-full animate-spin" />
              Loading events...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;