import React, { useState, useEffect } from "react";
import {
  ExchangeTransaction,
  EditBitcoinTransactionData,
} from "../services/tauriService";
import DateTimeInput from "./DateTimeInput";

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
    event: ExchangeTransaction | null;
    isEditing: boolean;
    isCreating?: boolean;
    isSelected?: boolean;
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCancel: () => void;
    onSelect?: () => void;
    editData: EditBitcoinTransactionData;
    onEditDataChange: (
      field: keyof EditBitcoinTransactionData,
      value: any
    ) => void;
  }) => {
    if (isEditing || isCreating) {
      return (
        <div className="border-b border-[rgba(247,243,227,0.2)] bg-[rgba(247,243,227,0.08)]">
          {/* Show original event data in collapsed form */}
          {!isCreating && event && (
            <div className="px-4 py-1 text-xs bg-[rgba(247,243,227,0.1)] border-l-4 border-blue-500">
              <div className={`events-grid items-center`}>
                <div className="text-[rgba(247,243,227,0.7)] text-xs">
                  <div>
                    {new Date(event.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  <div>
                    {new Date(event.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
                <div
                  className={
                    `text-[rgba(247,243,227,1)] text-xs border-l-2 border-[rgba(247,243,227,0.3)] pl-2 ` +
                    (event.type === "Buy"
                      ? "border-green-400"
                      : "border-red-400")
                  }
                >
                  {event.type}
                </div>
                <div className="text-[rgba(247,243,227,1)] text-xs">
                  <span
                    title={
                      event.amount_sats >= 1000000
                        ? `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                        : `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                    }
                  >
                    {event.amount_sats >= 1000000
                      ? `${
                          Math.floor(
                            (event.amount_sats / 100000000) * 1000000
                          ) / 1000000
                        } BTC`
                      : `${event.amount_sats.toLocaleString()} sats`}
                  </span>
                </div>
                <div className="text-[rgba(247,243,227,0.7)] text-xs">
                  {event.subtotal_cents ? (
                    <span
                      title={`$${(event.subtotal_cents / 100).toFixed(2)}`}
                    >
                      $
                      {event.subtotal_cents >= 99900
                        ? Math.round(
                            event.subtotal_cents / 100
                          ).toLocaleString()
                        : (event.subtotal_cents / 100).toFixed(2)}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="text-[rgba(247,243,227,0.7)] text-xs">
                  {event.subtotal_cents && event.amount_sats
                    ? `$${Math.round(
                        event.subtotal_cents /
                          100 /
                          (event.amount_sats / 100000000)
                      ).toLocaleString()}`
                    : "-"}
                </div>
                <div
                  className="text-[rgba(247,243,227,0.7)] text-xs truncate"
                  title={event.memo || ""}
                >
                  {event.memo || "-"}
                </div>
              </div>
            </div>
          )}

          {/* Edit form */}
          <div className="bg-[rgba(247,243,227,0.05)] px-4 py-3 border-l-4 border-blue-500 border-b">
            <div className="space-y-3">
              {/* First row: Date & Time and Type */}
              <div className="grid gap-3 grid-cols-[1fr_2fr]">
                {/* Event Type */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                    Type
                  </label>
                  <select
                    value={editData.type}
                    onChange={(e) => {
                      onEditDataChange("type", e.target.value);
                    }}
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    style={{
                      colorScheme: "dark",
                    }}
                  >
                    <option
                      value="Buy"
                      style={{ backgroundColor: "#1a1a1a", color: "#F7F3E3" }}
                    >
                      Buy
                    </option>
                    <option
                      value="Sell"
                      style={{ backgroundColor: "#1a1a1a", color: "#F7F3E3" }}
                    >
                      Sell
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                    Date & Time
                  </label>
                  <DateTimeInput
                    value={editData.timestamp || new Date().toISOString()}
                    onChange={(isoTimestamp) => {
                      onEditDataChange("timestamp", isoTimestamp);
                    }}
                  />
                </div>
              </div>

              {/* Second row: Amount, USD Value, Fee, Memo */}
              <div className="grid gap-3 grid-cols-[1.5fr_1.3fr_1.3fr_1.5fr]">
                {/* Amount in Sats */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
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
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                    USD Value
                  </label>
                  <input
                    type="text"
                    value={
                      editData.subtotal_cents === null ||
                      editData.subtotal_cents === undefined
                        ? ""
                        : editData.subtotal_cents === ""
                        ? ""
                        : typeof editData.subtotal_cents === "string"
                        ? editData.subtotal_cents
                        : (editData.subtotal_cents / 100).toString()
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        /^[0-9]+(\.[0-9]{0,2})?$/.test(value)
                      ) {
                        if (value === "") {
                          onEditDataChange("subtotal_cents", "");
                        } else {
                          onEditDataChange("subtotal_cents", value);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (
                        editData.subtotal_cents &&
                        typeof editData.subtotal_cents === "string"
                      ) {
                        const numValue = parseFloat(editData.subtotal_cents);
                        if (!isNaN(numValue)) {
                          onEditDataChange(
                            "subtotal_cents",
                            Math.round(numValue * 100)
                          );
                        }
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    placeholder="500.00"
                  />
                </div>

                {/* Fee (USD) */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                    Fee (USD)
                  </label>
                  <input
                    type="text"
                    value={
                      editData.fee_cents === null ||
                      editData.fee_cents === undefined
                        ? ""
                        : editData.fee_cents === ""
                        ? ""
                        : typeof editData.fee_cents === "string"
                        ? editData.fee_cents
                        : (editData.fee_cents / 100).toString()
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        /^[0-9]+(\.[0-9]{0,2})?$/.test(value)
                      ) {
                        if (value === "") {
                          onEditDataChange("fee_cents", "");
                        } else {
                          onEditDataChange("fee_cents", value);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (
                        editData.fee_cents &&
                        typeof editData.fee_cents === "string"
                      ) {
                        const numValue = parseFloat(editData.fee_cents);
                        if (!isNaN(numValue)) {
                          onEditDataChange(
                            "fee_cents",
                            Math.round(numValue * 100)
                          );
                        } else {
                          onEditDataChange("fee_cents", null);
                        }
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                    placeholder="Optional"
                  />
                </div>

                {/* Memo */}
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
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

              {/* Rate display */}
              {editData.amount_sats &&
                editData.subtotal_cents &&
                editData.subtotal_cents !== "" && (
                  <div className="text-xs text-[rgba(247,243,227,0.7)] space-y-1">
                    {/* Exchange Rate (without fees) */}
                    <div>
                      <span className="font-medium">Exchange Rate:</span> $
                      {(() => {
                        const fiatCents =
                          typeof editData.subtotal_cents === "string"
                            ? parseFloat(editData.subtotal_cents) * 100
                            : editData.subtotal_cents;
                        const sats =
                          typeof editData.amount_sats === "string"
                            ? parseInt(editData.amount_sats)
                            : editData.amount_sats;
                        return (
                          Math.abs(fiatCents) /
                          100 /
                          (Math.abs(sats) / 100_000_000)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        });
                      })()}
                    </div>

                    {/* Always show Total Cost and Effective Rate when we have fee data (including zero) */}
                    {editData.fee_cents !== null &&
                      editData.fee_cents !== undefined && (
                        <>
                          <div>
                            <span className="font-medium">Total Cost:</span> $
                            {(() => {
                              const fiatCents =
                                typeof editData.subtotal_cents === "string"
                                  ? parseFloat(editData.subtotal_cents) * 100
                                  : editData.subtotal_cents;
                              return (Math.abs(fiatCents) / 100).toFixed(2);
                            })()}
                          </div>
                          <div>
                            <span className="font-medium">
                              Effective Rate (fee included):
                            </span>{" "}
                            $
                            {(() => {
                              const fiatCents =
                                typeof editData.subtotal_cents === "string"
                                  ? parseFloat(editData.subtotal_cents) * 100
                                  : editData.subtotal_cents;
                              const feeCents =
                                typeof editData.fee_cents === "string"
                                  ? parseFloat(editData.fee_cents) * 100
                                  : editData.fee_cents;
                              const sats =
                                typeof editData.amount_sats === "string"
                                  ? parseInt(editData.amount_sats)
                                  : editData.amount_sats;
                              return (
                                (Math.abs(fiatCents) + Math.abs(feeCents)) /
                                100 /
                                (Math.abs(sats) / 100_000_000)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              });
                            })()}
                          </div>
                        </>
                      )}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-xs text-[rgba(247,243,227,0.7)]">
                  <span className="font-medium">
                    {isCreating ? "Creating new event" : "Editing event"}
                  </span>
                </div>
                <div className="flex gap-2">
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
          </div>
        </div>
      );
    }

    // Regular display mode (only for existing events)
    if (!event) return null;

    return (
      <div
        className={`border-b border-[rgba(247,243,227,0.1)] ${
          isSelected
            ? "bg-[rgba(247,243,227,0.1)] border-l-4 border-blue-500"
            : ""
        }`}
      >
        <div
          className={`hover:bg-[rgba(247,243,227,0.1)] px-4 py-1 text-xs group cursor-pointer ${
            isSelected ? "bg-[rgba(247,243,227,0.1)]" : ""
          }`}
          onClick={onSelect}
        >
          <div className={`events-grid items-center`}>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              <div>
                {new Date(event.timestamp).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>
              <div>
                {new Date(event.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
            <div
              className={
                `text-[rgba(247,243,227,1)] text-xs border-l-2 border-[rgba(247,243,227,0.3)] pl-2 ` +
                (event.type === "Buy"
                  ? "border-green-400"
                  : "border-red-400")
              }
            >
              {event.type}
            </div>
            <div className="text-[rgba(247,243,227,1)] text-xs">
              <span
                title={
                  event.amount_sats >= 1000000
                    ? `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                    : `${(event.amount_sats / 100000000).toFixed(8)} BTC`
                }
              >
                {event.amount_sats >= 1000000
                  ? `${
                      Math.floor((event.amount_sats / 100000000) * 1000000) /
                      1000000
                    } BTC`
                  : `${event.amount_sats.toLocaleString()} sats`}
              </span>
            </div>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              {event.subtotal_cents ? (
                <span title={`$${(event.subtotal_cents / 100).toFixed(2)}`}>
                  $
                  {event.subtotal_cents >= 99900
                    ? Math.round(event.subtotal_cents / 100).toLocaleString()
                    : (event.subtotal_cents / 100).toFixed(2)}
                </span>
              ) : (
                "-"
              )}
            </div>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              {event.subtotal_cents && event.amount_sats
                ? `$${Math.round(
                    event.subtotal_cents /
                      100 /
                      (event.amount_sats / 100000000)
                  ).toLocaleString()}`
                : "-"}
            </div>
            <div
              className="text-[rgba(247,243,227,0.5)] text-xs truncate"
              title={event.memo || ""}
            >
              {event.memo || "-"}
            </div>
          </div>
        </div>

        {/* Expanded details when selected */}
        {isSelected && !isEditing && (
          <div className="bg-[rgba(247,243,227,0.05)] px-4 py-2 border-t border-[rgba(247,243,227,0.1)] border-l">
            <div className="space-y-2">
              {/* Amount Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-[rgba(247,243,227,0.8)]">
                    Amount:
                  </span>
                  <div className="text-[rgba(247,243,227,0.7)]">
                    {event.amount_sats.toLocaleString()} sats •{" "}
                    {(event.amount_sats / 100_000_000).toFixed(8)} BTC
                  </div>
                </div>
                <div>
                  <span className="font-medium text-[rgba(247,243,227,0.8)]">
                    Memo:
                  </span>
                  <div className="text-[rgba(247,243,227,0.7)] wrap-break-word">
                    {event.memo || "No memo"}
                  </div>
                </div>
              </div>

              {/* Rate Calculations (with USD value) */}
              {event.subtotal_cents &&
                event.amount_sats && (
                  <div className="border-t border-[rgba(247,243,227,0.1)] pt-2">
                    <div className="text-xs text-[rgba(247,243,227,0.7)] space-y-1">
                      {/* Exchange Rate (without fees) */}
                      <div>
                        <span className="font-medium text-[rgba(247,243,227,0.8)]">
                          Exchange Rate:
                        </span>{" "}
                        <span className="text-blue-300">
                          $
                          {(
                            Math.abs(event.subtotal_cents) /
                            100 /
                            (Math.abs(event.amount_sats) / 100_000_000)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>

                      {/* Effective Rate and Fee details (when fee exists) */}
                      {event.fee_cents !== null &&
                        event.fee_cents !== undefined && (
                          <>
                            <div>
                              <span className="font-medium text-[rgba(247,243,227,0.8)]">
                                Effective Rate (fee included):
                              </span>{" "}
                              <span className="text-orange-300">
                                $
                                {(
                                  (Math.abs(event.subtotal_cents) +
                                    Math.abs(event.fee_cents)) /
                                  100 /
                                  (Math.abs(event.amount_sats) / 100_000_000)
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[rgba(247,243,227,0.8)]">
                                Fee (USD):
                              </span>{" "}
                              <span className="text-red-300">
                                $
                                {(Math.abs(event.fee_cents) / 100).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[rgba(247,243,227,0.8)]">
                                Total Cost:
                              </span>{" "}
                              <span className="text-green-300">
                                $
                                {(
                                  Math.abs(event.subtotal_cents) / 100
                                ).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                )}

              {/* Action Button */}
              <div className="flex justify-end border-t border-[rgba(247,243,227,0.1)] pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded transition-colors"
                >
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

interface EventsListProps {
  events: ExchangeTransaction[];
  totalCount: number;
  editingEventId: string | null;
  selectedEventId: string | null;
  editData: EditBitcoinTransactionData;
  isCreatingNew: boolean;
  newEventData: EditBitcoinTransactionData;
  onAddNewEvent: () => void;
  onEditEvent: (event: ExchangeTransaction) => void;
  onSelectEvent: (eventId: string | null) => void;
  onSaveEvent: () => void;
  onDeleteEvent: () => void;
  onCancelEdit: () => void;
  onEditDataChange: (
    field: keyof EditBitcoinTransactionData,
    value: any
  ) => void;
  onSaveNewEvent: () => void;
  onCancelNewEvent: () => void;
  onNewEventDataChange: (
    field: keyof EditBitcoinTransactionData,
    value: any
  ) => void;
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

  // Handle escape key to close edit/deselect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingEventId || isCreatingNew) {
          onCancelEdit();
        } else if (selectedEventId) {
          onSelectEvent(null);
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
    onCancelEdit,
    onSelectEvent,
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

  // Enhanced event handlers to ensure proper UX flow
  const handleSelectEvent = (eventId: string | null) => {
    // Don't allow selection changes while editing
    if (editingEventId || isCreatingNew) {
      return;
    }
    onSelectEvent(eventId);
  };

  const handleEditEvent = (event: ExchangeTransaction) => {
    // Only allow editing if the event is selected
    if (selectedEventId !== event.id) {
      return;
    }
    onEditEvent(event);
  };

  const handleAddNewEvent = () => {
    // Clear any selection when creating new
    if (selectedEventId) {
      onSelectEvent(null);
    }
    onAddNewEvent();
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
            onEdit={() => handleEditEvent(event)}
            onSelect={() =>
              handleSelectEvent(selectedEventId === event.id ? null : event.id)
            }
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
