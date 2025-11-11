import React, { useState } from "react";
import { BitcoinTransaction } from "../services/tauriService";
import DateTimeInput from "./DateTimeInput";

const EventItem = React.memo(
  ({
    event,
    isEditing,
    isCreating,
    onEdit,
    onSave,
    onDelete,
    onCancel,
    editData,
    onEditDataChange,
  }: {
    event: BitcoinTransaction | null;
    isEditing: boolean;
    isCreating?: boolean;
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCancel: () => void;
    editData: any;
    onEditDataChange: (field: string, value: any) => void;
  }) => {
    if (isEditing || isCreating) {
      return (
        <div className="border-b border-[rgba(247,243,227,0.2)] bg-[rgba(247,243,227,0.08)]">
          {/* Show original event data in collapsed form */}
          {!isCreating && event && (
            <div className="px-4 py-1 text-xs border-b border-[rgba(247,243,227,0.1)] bg-[rgba(247,243,227,0.03)]">
              <div
                className="grid gap-2 items-center opacity-60"
                style={{
                  gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
                }}
              >
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {new Date(event.timestamp)
                    .toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", "")}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.type}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.amount_sats.toLocaleString()} sats
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.fiat_amount_cents
                    ? `$${(event.fiat_amount_cents / 100).toFixed(2)}`
                    : "-"}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">-</div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs truncate">
                  {event.memo || "-"}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  Editing...
                </div>
              </div>
            </div>
          )}

          {/* Compact edit form */}
          <div className="px-4 py-2 bg-[rgba(247,243,227,0.03)] border-l-2 border-blue-500">
            {/* Main edit row */}
            <div
              className="grid gap-2 items-end mb-2"
              style={{ gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1.5fr" }}
            >
              {/* Date & Time */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Date & Time
                </label>
                <DateTimeInput
                  value={editData.timestamp || new Date().toISOString()}
                  onChange={(isoTimestamp) => {
                    onEditDataChange("timestamp", isoTimestamp);
                  }}
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Type
                </label>
                <select
                  value={editData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    onEditDataChange("type", newType);
                    if (newType === "Fee") {
                      onEditDataChange("fiat_amount_cents", null);
                    }
                  }}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: "#090C08",
                    color: "#F7F3E3",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option
                    value="Buy"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Buy
                  </option>
                  <option
                    value="Sell"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Sell
                  </option>
                  <option
                    value="Fee"
                    style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}
                  >
                    Fee
                  </option>
                </select>
              </div>

              {/* Amount in Sats */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Amount (Sats)
                </label>
                <input
                  type="text"
                  value={
                    editData.amount_sats === ""
                      ? ""
                      : editData.amount_sats?.toString() || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[1-9]\d*$/.test(value)) {
                      onEditDataChange(
                        "amount_sats",
                        value === "" ? "" : parseInt(value)
                      );
                    }
                  }}
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  placeholder="1000000"
                />
              </div>

              {/* USD Value */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  USD{" "}
                  {editData.type === "Fee" && (
                    <span className="text-[rgba(247,243,227,0.4)]">(N/A)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={
                    editData.type === "Fee"
                      ? "N/A"
                      : editData.fiat_amount_cents === null ||
                        editData.fiat_amount_cents === undefined
                      ? ""
                      : editData.fiat_amount_cents === ""
                      ? ""
                      : typeof editData.fiat_amount_cents === "string"
                      ? editData.fiat_amount_cents
                      : (editData.fiat_amount_cents / 100).toString()
                  }
                  onChange={(e) => {
                    if (editData.type === "Fee") return;
                    const value = e.target.value;
                    if (value === "" || /^[0-9]+(\.[0-9]{0,2})?$/.test(value)) {
                      if (value === "") {
                        onEditDataChange("fiat_amount_cents", "");
                      } else {
                        onEditDataChange("fiat_amount_cents", value);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (editData.type === "Fee") return;
                    if (
                      editData.fiat_amount_cents &&
                      typeof editData.fiat_amount_cents === "string"
                    ) {
                      const numValue = parseFloat(editData.fiat_amount_cents);
                      if (!isNaN(numValue)) {
                        onEditDataChange(
                          "fiat_amount_cents",
                          Math.round(numValue * 100)
                        );
                      }
                    }
                  }}
                  disabled={editData.type === "Fee"}
                  className={`w-full border px-2 py-1 text-xs rounded ${
                    editData.type === "Fee"
                      ? "bg-[rgba(9,12,8,0.5)] border-[rgba(247,243,227,0.1)] text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                      : "bg-[#090C08] border-[rgba(247,243,227,0.3)] text-[#F7F3E3]"
                  }`}
                  placeholder={editData.type === "Fee" ? "N/A" : "500.00"}
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-[rgba(247,243,227,0.6)] text-xs mb-1">
                  Memo
                </label>
                <input
                  type="text"
                  value={editData.memo || ""}
                  onChange={(e) =>
                    onEditDataChange("memo", e.target.value || null)
                  }
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded"
                  placeholder="Optional memo"
                />
              </div>
            </div>

            {/* Bottom row with calculated rate and actions */}
            <div className="flex justify-between items-center">
              {/* Calculated BTC/USD Rate */}
              <div className="text-xs text-[rgba(247,243,227,0.6)]">
                {(editData.type === "Buy" ||
                  editData.type === "Sell") &&
                  editData.amount_sats &&
                  editData.fiat_amount_cents &&
                  editData.fiat_amount_cents !== "" && (
                    <span>
                      Rate: $
                      {(
                        Math.abs(editData.fiat_amount_cents) /
                        100 /
                        (Math.abs(editData.amount_sats) / 100_000_000)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
                >
                  {isCreating ? "Create" : "Save"}
                </button>
                {!isCreating && (
                  <button
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular display mode (only for existing events)
    if (!event) return null;

    return (
      <div className="border-b border-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.1)] px-4 py-1 text-xs group">
        <div
          className="grid gap-2 items-center"
          style={{
            gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
          }}
        >
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {new Date(event.timestamp)
              .toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", "")}
          </div>
          <div
            className={
              `text-[rgba(247,243,227,1)] text-xs border-l-2 border-[rgba(247,243,227,0.3)] pl-2 ` +
              (event.type === "Buy"
                ? "border-green-400"
                : event.type === "Sell"
                ? "border-red-400"
                : "border-yellow-400")
            }
          >
            {event.type}
          </div>
          <div className="text-[rgba(247,243,227,1)] text-xs">
            {event.amount_sats.toLocaleString()} sats
          </div>
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {event.fiat_amount_cents
              ? `$${(event.fiat_amount_cents / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "-"}
          </div>
          <div className="text-[rgba(247,243,227,0.5)] text-xs">
            {(event.type === "Buy" || event.type === "Sell") &&
            event.amount_sats &&
            event.fiat_amount_cents
              ? `$${(
                  Math.abs(event.fiat_amount_cents) /
                  100 /
                  (Math.abs(event.amount_sats) / 100_000_000)
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              : "-"}
          </div>
          <div
            className="text-[rgba(247,243,227,0.5)] truncate text-xs"
            title={event.memo || ""}
          >
            {event.memo || "-"}
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
  }
);

interface EventsListProps {
  events: BitcoinTransaction[];
  totalCount: number;
  editingEventId: string | null;
  editData: any;
  isCreatingNew: boolean;
  newEventData: any;
  onAddNewEvent: () => void;
  onEditEvent: (event: BitcoinTransaction) => void;
  onSaveEvent: () => void;
  onDeleteEvent: () => void;
  onCancelEdit: () => void;
  onEditDataChange: (field: string, value: any) => void;
  onSaveNewEvent: () => void;
  onCancelNewEvent: () => void;
  onNewEventDataChange: (field: string, value: any) => void;
}

const EventsList: React.FC<EventsListProps> = ({
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;
  
  // Calculate pagination
  const totalPages = Math.ceil(events.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, events.length);
  const visibleEvents = events.slice(startIndex, endIndex);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
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
                Showing {startIndex + 1}-{endIndex} of {events.length} loaded events
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
              onClick={onAddNewEvent}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
            >
              Add Event
            </button>
          </div>
        </div>
        {/* Column Headers */}
        <div
          className="grid gap-2 mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]"
          style={{
            gridTemplateColumns: "2fr 0.8fr 1.5fr 1.3fr 1fr 1.5fr 0.8fr",
          }}
        >
          <div>Date</div>
          <div>Type</div>
          <div>Amount</div>
          <div>USD</div>
          <div>BTC/USD</div>
          <div>Memo</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Events List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* New Event Row using EventItem */}
        {isCreatingNew && (
          <EventItem
            event={null}
            isEditing={false}
            isCreating={true}
            onEdit={() => {}}
            onSave={onSaveNewEvent}
            onDelete={() => {}}
            onCancel={onCancelNewEvent}
            editData={newEventData}
            onEditDataChange={onNewEventDataChange}
          />
        )}

        {visibleEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            isEditing={editingEventId === event.id}
            isCreating={false}
            onEdit={() => onEditEvent(event)}
            onSave={onSaveEvent}
            onDelete={onDeleteEvent}
            onCancel={onCancelEdit}
            editData={editData}
            onEditDataChange={onEditDataChange}
          />
        ))}

        {visibleEvents.length > 0 && (
          <div className="text-center py-4">
            <div className="text-xs text-[rgba(247,243,227,0.5)]">
              {events.length > pageSize 
                ? `Page ${currentPage + 1} of ${totalPages} • ${events.length} total events loaded`
                : "All events loaded"
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
