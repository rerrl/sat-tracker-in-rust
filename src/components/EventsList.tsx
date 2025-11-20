import React, { useState, useEffect, useCallback } from "react";
import {
  EditBitcoinTransactionData,
  TauriService,
  UnifiedEvent,
} from "../services/tauriService";
import { useUnifiedEvents } from "../hooks/useUnifiedEvents";
import { invalidateAfterUnifiedEventDataChange } from "../utils/queryInvalidation";
import { useQueryClient } from "@tanstack/react-query";
import EventItem from "./EventItem";

interface EventsListProps {
  // No more prop drilling - EventsList manages its own state!
}

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

  // Get events data and mutations
  const { events, totalCount, loading: eventsLoading } = useUnifiedEvents(true);
  const queryClient = useQueryClient();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // Internal event handlers
  const handleEditEvent = useCallback(
    (event: UnifiedEvent) => {
      if (selectedEventId !== event.id) return;

      setIsCreatingNew(false);
      setNewEventData(null);
      setEditingEventId(event.id);

      // Handle different event types
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
      // Find the event being edited to determine its type
      const eventToEdit = events.find((event) => event.id === editingEventId);
      if (!eventToEdit) {
        console.error("Event not found for editing");
        return;
      }

      if (eventToEdit.record_type === "onchain_fee") {
        // Update onchain fee
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
        // Update exchange transaction
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

      console.log(
        `Successfully updated ${eventToEdit.record_type} with ID: ${editingEventId}`
      );
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

    // Find the event being deleted
    const eventToDelete = events.find((event) => event.id === editingEventId);
    if (!eventToDelete) {
      console.error("Event not found for deletion");
      return;
    }

    try {
      // Check the event type and use appropriate delete function
      if (eventToDelete.record_type === "exchange_transaction") {
        // For buy/sell transactions, use exchange transaction delete
        await TauriService.deleteExchangeTransaction(editingEventId);
      } else if (eventToDelete.record_type === "onchain_fee") {
        // For fee transactions, use onchain fee delete
        await TauriService.deleteOnchainFee(editingEventId);
      } else {
        console.error("Unknown event type:", eventToDelete.record_type);
        return;
      }

      console.log(
        `Successfully deleted ${eventToDelete.record_type} with ID: ${editingEventId}`
      );
      invalidateAfterUnifiedEventDataChange(queryClient);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setEditingEventId(null);
      setEditData(null);
    }
  }, [editingEventId, events]);

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
        // Create onchain fee
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
        console.log("Successfully created onchain fee");
      } else {
        // Create exchange transaction
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
        console.log("Successfully created exchange transaction");
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

  // Handle escape key to close edit/deselect
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

  // Calculate pagination
  const totalPages = Math.ceil(events.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, events.length);
  const visibleEvents = events.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
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
            {events.length > pageSize && (
              <div className="text-xs text-[rgba(247,243,227,0.6)] mt-1">
                Showing {startIndex + 1}-{endIndex} of {events.length} loaded
                events
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {events.length > pageSize && (
              <div className="flex items-center gap-1 mr-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="bg-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.2)] disabled:opacity-50 disabled:cursor-not-allowed text-[#F7F3E3] px-2 py-1 text-xs rounded"
                >
                  ←
                </button>
                <span className="text-xs text-[rgba(247,243,227,0.6)] px-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="bg-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.2)] disabled:opacity-50 disabled:cursor-not-allowed text-[#F7F3E3] px-2 py-1 text-xs rounded"
                >
                  →
                </button>
              </div>
            )}
            <button
              onClick={handleAddNewEvent}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
            >
              Add Event
            </button>
          </div>
        </div>
        {/* Column Headers */}
        <div
          className={`events-grid mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]`}
        >
          <div>Date</div>
          <div>Type</div>
          <div>Amount</div>
          <div>USD</div>
          <div>Rate</div>
          <div>Memo</div>
        </div>
      </div>

      {/* Events List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* New Event Row using EventItem */}
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

        {visibleEvents.map((event) => (
          <EventItem
            key={event.id}
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
              editData ||
              newEventData || {
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
        ))}

        {visibleEvents.length > 0 && (
          <div className="text-center py-4">
            <div className="text-xs text-[rgba(247,243,227,0.5)]">
              {events.length > pageSize
                ? `Page ${currentPage + 1} of ${totalPages} • ${
                    events.length
                  } total events loaded`
                : "All events loaded"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
