import React, { useState } from "react";
import { BitcoinTransaction } from "../services/tauriService";
import DateTimeInput from "./DateTimeInput";

// Grid layout constant for consistent column sizing
const GRID_LAYOUT = "0.7fr_0.4fr_0.7fr_0.5fr_1.4fr";

const EventItem = React.memo(
  ({
    event,
    isEditing,
    isCreating,
    isSelected,
    onEdit,
    onSave,
    onDelete,
    onCancel,
    onSelect,
    editData,
    onEditDataChange,
  }: {
    event: BitcoinTransaction | null;
    isEditing: boolean;
    isCreating?: boolean;
    isSelected?: boolean;
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCancel: () => void;
    onSelect?: () => void;
    editData: any;
    onEditDataChange: (field: string, value: any) => void;
  }) => {
    if (isEditing || isCreating) {
      return (
        <div className="border-b border-[rgba(247,243,227,0.2)] bg-[rgba(247,243,227,0.08)]">
          {/* Show original event data in collapsed form */}
          {!isCreating && event && (
            <div className="px-4 py-1 text-xs border-b border-[rgba(247,243,227,0.1)] bg-[rgba(247,243,227,0.03)]">
              <div className={`grid grid-cols-[${GRID_LAYOUT}] gap-2 items-center opacity-60`}>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  <div>{new Date(event.timestamp).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}</div>
                  <div>{new Date(event.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}</div>
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.type === "Fee" ? (
                    <span title="On-chain fee">Fee</span>
                  ) : (
                    event.type
                  )}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  <span title={event.amount_sats >= 1000000 
                    ? `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                    : `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                  }>
                    {event.amount_sats >= 1000000 
                      ? `${Math.floor(event.amount_sats / 100000000 * 1000000) / 1000000} BTC`
                      : `${event.amount_sats.toLocaleString()} sats`
                    }
                  </span>
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.type === "Fee" ? "N/A" : event.fiat_amount_cents
                    ? <span title={`$${(event.fiat_amount_cents / 100).toFixed(2)}`}>
                        ${event.fiat_amount_cents >= 99900 
                          ? Math.round(event.fiat_amount_cents / 100).toLocaleString()
                          : (event.fiat_amount_cents / 100).toFixed(2)
                        }
                      </span>
                    : "-"}
                </div>
                <div className="text-[rgba(247,243,227,0.5)] text-xs">
                  {event.type === "Fee" ? "N/A" : event.fiat_amount_cents && event.amount_sats
                    ? `$${Math.round((event.fiat_amount_cents / 100) / (event.amount_sats / 100000000)).toLocaleString()}`
                    : "-"}
                </div>
              </div>
            </div>
          )}

          {/* Compact edit form */}
          <div className="px-4 py-2 bg-[rgba(247,243,227,0.03)] border-l-2 border-blue-500">
            {/* Main edit row - split into two rows for better spacing */}
            <div className="space-y-2">
              {/* First row: Basic transaction info */}
              <div className="grid grid-cols-[2fr_0.8fr_1.5fr_1.3fr_1.5fr] gap-2 items-end">
                {/* Date & Time */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
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
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
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
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="Buy" style={{ backgroundColor: '#1a1a1a', color: '#F7F3E3' }}>Buy</option>
                    <option value="Sell" style={{ backgroundColor: '#1a1a1a', color: '#F7F3E3' }}>Sell</option>
                    <option value="Fee" style={{ backgroundColor: '#1a1a1a', color: '#F7F3E3' }}>Fee</option>
                  </select>
                </div>

                {/* Amount in Sats */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
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
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    placeholder="1000000"
                  />
                </div>

                {/* USD Value */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
                    USD Value{" "}
                    {editData.type === "Fee" && (
                      <span className="text-[rgba(247,243,227,0.4)]">(N/A)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={
                      editData.type === "Fee"
                        ? ""
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
                    className={`w-full border px-2 py-1 text-xs rounded focus:outline-none ${
                      editData.type === "Fee"
                        ? "bg-[rgba(26,26,26,0.5)] border-[rgba(247,243,227,0.2)] text-[rgba(247,243,227,0.4)] cursor-not-allowed"
                        : "bg-[#1a1a1a] border-[rgba(247,243,227,0.3)] text-[#F7F3E3] focus:border-blue-400"
                    }`}
                    placeholder={editData.type === "Fee" ? "N/A" : "500.00"}
                  />
                </div>

                {/* Memo */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
                    Memo
                  </label>
                  <input
                    type="text"
                    value={editData.memo || ""}
                    onChange={(e) =>
                      onEditDataChange("memo", e.target.value || null)
                    }
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    placeholder="Optional memo"
                  />
                </div>
              </div>

              {/* Second row: Fee information - only show for Fee transactions */}
              {editData.type === "Fee" && (
                <div className="grid grid-cols-[1fr_1fr_2fr] gap-2 items-end">
                  {/* On-chain Fee Sats */}
                  <div>
                    <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
                      On-chain Fee (Sats)
                    </label>
                    <input
                      type="text"
                      value={
                        editData.fee_sats === null || editData.fee_sats === undefined
                          ? ""
                          : editData.fee_sats === ""
                          ? ""
                          : editData.fee_sats?.toString() || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[0-9]\d*$/.test(value)) {
                          onEditDataChange(
                            "fee_sats",
                            value === "" ? null : parseInt(value)
                          );
                        }
                      }}
                      className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>

                  {/* On-chain Fee USD */}
                  <div>
                    <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-0.5 font-medium">
                      On-chain Fee (USD)
                    </label>
                    <input
                      type="text"
                      value={
                        editData.fee_fiat_cents === null ||
                        editData.fee_fiat_cents === undefined
                          ? ""
                          : editData.fee_fiat_cents === ""
                          ? ""
                          : typeof editData.fee_fiat_cents === "string"
                          ? editData.fee_fiat_cents
                          : (editData.fee_fiat_cents / 100).toString()
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[0-9]+(\.[0-9]{0,2})?$/.test(value)) {
                          if (value === "") {
                            onEditDataChange("fee_fiat_cents", "");
                          } else {
                            onEditDataChange("fee_fiat_cents", value);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (
                          editData.fee_fiat_cents &&
                          typeof editData.fee_fiat_cents === "string"
                        ) {
                          const numValue = parseFloat(editData.fee_fiat_cents);
                          if (!isNaN(numValue)) {
                            onEditDataChange(
                              "fee_fiat_cents",
                              Math.round(numValue * 100)
                            );
                          } else {
                            onEditDataChange("fee_fiat_cents", null);
                          }
                        }
                      }}
                      className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Empty space for alignment */}
                  <div></div>
                </div>
              )}

              {/* Calculated rates info - only show for Buy/Sell */}
              {editData.type !== "Fee" && (
                <div className="text-xs text-[rgba(247,243,227,0.7)] pl-4 flex items-end pb-1">
                  {(editData.type === "Buy" || editData.type === "Sell") &&
                    editData.amount_sats &&
                    editData.fiat_amount_cents &&
                    editData.fiat_amount_cents !== "" && (
                      <div>
                        Rate: $
                        {(
                          Math.abs(editData.fiat_amount_cents) /
                          100 /
                          (Math.abs(editData.amount_sats) / 100_000_000)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(247,243,227,0.1)] mt-2">
              <button
                onClick={onCancel}
                className="bg-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.2)] text-[#F7F3E3] px-3 py-1 text-xs rounded transition-colors"
              >
                Cancel
              </button>
              {!isCreating && (
                <button
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded transition-colors"
              >
                {isCreating ? "Create Event" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Regular display mode (only for existing events)
    if (!event) return null;

    return (
      <div className="border-b border-[rgba(247,243,227,0.1)]">
        <div 
          className="hover:bg-[rgba(247,243,227,0.1)] px-4 py-1 text-xs group cursor-pointer"
          onClick={onSelect}
        >
          <div className={`grid grid-cols-[${GRID_LAYOUT}] gap-2 items-center`}>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              <div>{new Date(event.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}</div>
              <div>{new Date(event.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}</div>
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
              {event.type === "Fee" ? (
                <span title="On-chain fee">Fee</span>
              ) : (
                event.type
              )}
            </div>
            <div className="text-[rgba(247,243,227,1)] text-xs">
              <span title={event.amount_sats >= 1000000 
                ? `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                : `${(event.amount_sats / 100000000).toFixed(8)} BTC`
              }>
                {event.amount_sats >= 1000000 
                  ? `${Math.floor(event.amount_sats / 100000000 * 1000000) / 1000000} BTC`
                  : `${event.amount_sats.toLocaleString()} sats`
                }
              </span>
            </div>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              {event.type === "Fee" ? "N/A" : event.fiat_amount_cents
                ? <span title={`$${(event.fiat_amount_cents / 100).toFixed(2)}`}>
                    ${event.fiat_amount_cents >= 99900 
                      ? Math.round(event.fiat_amount_cents / 100).toLocaleString()
                      : (event.fiat_amount_cents / 100).toFixed(2)
                    }
                  </span>
                : "-"}
            </div>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              {event.type === "Fee" ? "N/A" : event.fiat_amount_cents && event.amount_sats
                ? `$${Math.round((event.fiat_amount_cents / 100) / (event.amount_sats / 100000000)).toLocaleString()}`
                : "-"}
            </div>
          </div>
        </div>
        
        {/* Expanded details when selected */}
        {isSelected && (
          <div className="bg-[rgba(247,243,227,0.05)] px-4 py-2 border-t border-[rgba(247,243,227,0.1)]">
            <div className="flex justify-between items-center">
              <div className="text-xs text-[rgba(247,243,227,0.7)]">
                <span className="font-medium">Memo:</span> {event.memo || "No memo"}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

interface EventsListProps {
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
        <div className={`grid grid-cols-[${GRID_LAYOUT}] gap-2 mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]`}>
          <div>Date</div>
          <div>Type</div>
          <div>Amount</div>
          <div>USD</div>
          <div>Rate</div>
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
            isSelected={selectedEventId === event.id}
            isCreating={false}
            onEdit={() => onEditEvent(event)}
            onSelect={() => onSelectEvent(selectedEventId === event.id ? null : event.id)}
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
