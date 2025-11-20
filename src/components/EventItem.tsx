import React from "react";
import {
  EditBitcoinTransactionData,
  UnifiedEvent,
} from "../services/tauriService";
import DateTimeInput from "./DateTimeInput";

interface EventSummaryProps {
  amount_sats: number;
  subtotal_cents?: number | null;
  fee_cents?: number | null;
  transaction_type: string;
}

const EventSummary: React.FC<EventSummaryProps> = ({
  amount_sats,
  subtotal_cents,
  fee_cents,
  transaction_type,
}) => {
  const isFeeEvent = transaction_type === "fee";

  if (isFeeEvent) {
    return (
      <div className="text-xs text-[rgba(247,243,227,0.7)] space-y-1">
        <div>
          <span className="font-medium">Fee Amount:</span>{" "}
          <span className="text-[rgba(247,243,227,0.9)]">
            {amount_sats.toLocaleString()} sats
          </span>
          {" • "}
          <span className="text-[rgba(247,243,227,0.9)]">
            {(amount_sats / 100_000_000).toFixed(8)} BTC
          </span>
        </div>
      </div>
    );
  }

  if (!subtotal_cents || !amount_sats || subtotal_cents === 0) {
    return null;
  }

  return (
    <div className="border-t border-[rgba(247,243,227,0.1)] pt-2">
      <div className="text-xs text-[rgba(247,243,227,0.7)] space-y-1">
        {/* Exchange Rate with Effective Rate inline */}
        <div>
          <span className="font-medium text-[rgba(247,243,227,0.8)]">
            Exchange Rate
            {fee_cents !== null && fee_cents !== undefined && fee_cents > 0
              ? " (Effective)"
              : ""}
            :
          </span>{" "}
          <span className="text-[rgba(247,243,227,0.9)]">
            $
            {(
              Math.abs(subtotal_cents) /
              100 /
              (Math.abs(amount_sats) / 100_000_000)
            ).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
          {fee_cents !== null && fee_cents !== undefined && fee_cents > 0 && (
            <span className="text-[rgba(247,243,227,0.6)]">
              {" "}
              ($
              {(
                (Math.abs(subtotal_cents) + Math.abs(fee_cents)) /
                100 /
                (Math.abs(amount_sats) / 100_000_000)
              ).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              )
            </span>
          )}
        </div>

        {/* Subtotal */}
        <div>
          <span className="font-medium text-[rgba(247,243,227,0.8)]">
            Subtotal:
          </span>{" "}
          <span className="text-[rgba(247,243,227,0.9)]">
            ${(Math.abs(subtotal_cents) / 100).toFixed(2)}
          </span>
        </div>

        {/* Fee and Total Cost (when fee exists) */}
        {fee_cents !== null && fee_cents !== undefined && fee_cents > 0 && (
          <>
            <div>
              <span className="font-medium text-[rgba(247,243,227,0.8)]">
                Fee:
              </span>{" "}
              <span className="text-[rgba(247,243,227,0.9)]">
                ${(Math.abs(fee_cents) / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-medium text-[rgba(247,243,227,0.8)]">
                Total Cost:
              </span>{" "}
              <span className="text-[rgba(247,243,227,0.9)]">
                $
                {(
                  (Math.abs(subtotal_cents) + Math.abs(fee_cents)) /
                  100
                ).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface EventItemProps {
  event: UnifiedEvent | null;
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
}

const EventItem = React.memo<EventItemProps>(
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
                    (event.transaction_type === "buy"
                      ? "border-green-400"
                      : event.transaction_type === "sell"
                      ? "border-red-400"
                      : "border-yellow-400")
                  }
                >
                  {event.transaction_type === "buy"
                    ? "Buy"
                    : event.transaction_type === "sell"
                    ? "Sell"
                    : event.transaction_type === "fee"
                    ? "Fee"
                    : event.transaction_type}
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
                    <span title={`$${(event.subtotal_cents / 100).toFixed(2)}`}>
                      $
                      {event.subtotal_cents >= 99900
                        ? Math.round(
                            event.subtotal_cents / 100
                          ).toLocaleString()
                        : (event.subtotal_cents / 100).toFixed(2)}
                    </span>
                  ) : (
                    ""
                  )}
                </div>
                <div className="text-[rgba(247,243,227,0.7)] text-xs">
                  {event.subtotal_cents && event.amount_sats
                    ? `$${Math.round(
                        event.subtotal_cents /
                          100 /
                          (event.amount_sats / 100000000)
                      ).toLocaleString()}`
                    : event.record_type === "onchain_fee"
                    ? "-"
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
              {/* First row: Event Type and Date & Time (consistent for all types) */}
              <div className="grid gap-3 grid-cols-[1fr_2fr]">
                <div>
                  <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                    Event Type
                  </label>
                  <select
                    value={editData.type}
                    onChange={(e) => {
                      onEditDataChange("type", e.target.value);
                    }}
                    disabled={!isCreating && event?.transaction_type === "fee"}
                    className={`w-full border text-[#F7F3E3] px-2 py-1 text-xs rounded focus:outline-none ${
                      !isCreating && event?.transaction_type === "fee"
                        ? "bg-[#0f0f0f] border-[rgba(247,243,227,0.2)] cursor-not-allowed opacity-60"
                        : "bg-[#1a1a1a] border-[rgba(247,243,227,0.3)] focus:border-blue-400"
                    }`}
                    style={{
                      colorScheme: "dark",
                    }}
                  >
                    <option
                      value="Buy"
                      style={{
                        backgroundColor: "#1a1a1a",
                        color: "#F7F3E3",
                      }}
                    >
                      Buy
                    </option>
                    <option
                      value="Sell"
                      style={{
                        backgroundColor: "#1a1a1a",
                        color: "#F7F3E3",
                      }}
                    >
                      Sell
                    </option>
                    {(isCreating || (!isCreating && event?.transaction_type === "fee")) && (
                      <option
                        value="Fee"
                        style={{
                          backgroundColor: "#1a1a1a",
                          color: "#F7F3E3",
                        }}
                      >
                        Onchain Fee
                      </option>
                    )}
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

              {/* Second row: Fields based on event type */}
              {(() => {
                const isFeeEvent = editData.type === "Fee";

                if (isFeeEvent) {
                  // Fee Event Fields
                  return (
                    <div className="grid gap-3 grid-cols-[1.5fr_1.5fr_2fr]">
                      {/* Amount in Sats */}
                      <div>
                        <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                          Fee Amount (Sats)
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
                          placeholder="5000"
                        />
                      </div>

                      {/* TX Hash */}
                      <div>
                        <label className="block text-[rgba(247,243,227,0.7)] text-xs mb-1 font-medium">
                          TX Hash
                        </label>
                        <input
                          type="text"
                          value={editData.tx_hash || ""}
                          onChange={(e) =>
                            onEditDataChange("tx_hash", e.target.value || null)
                          }
                          className="w-full bg-[#1a1a1a] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-2 py-1 text-xs rounded focus:border-blue-400 focus:outline-none"
                          placeholder="Optional transaction hash"
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
                  );
                } else {
                  // Buy/Sell Event Fields
                  return (
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
                              const numValue = parseFloat(
                                editData.subtotal_cents
                              );
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
                  );
                }
              })()}

              {/* Rate/Amount display based on type */}
              {editData.amount_sats && editData.amount_sats !== "" && (
                <EventSummary
                  amount_sats={
                    typeof editData.amount_sats === "string"
                      ? parseInt(editData.amount_sats) || 0
                      : editData.amount_sats
                  }
                  subtotal_cents={
                    typeof editData.subtotal_cents === "string"
                      ? parseFloat(editData.subtotal_cents) * 100 || null
                      : editData.subtotal_cents
                  }
                  fee_cents={
                    typeof editData.fee_cents === "string"
                      ? parseFloat(editData.fee_cents) * 100 || null
                      : editData.fee_cents
                  }
                  transaction_type={editData.type?.toLowerCase() || ""}
                />
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
                (event.transaction_type === "buy"
                  ? "border-green-400"
                  : event.transaction_type === "sell"
                  ? "border-red-400"
                  : "border-yellow-400")
              }
            >
              {event.transaction_type === "buy"
                ? "Buy"
                : event.transaction_type === "sell"
                ? "Sell"
                : event.transaction_type === "fee"
                ? "Fee"
                : event.transaction_type}
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
                <span
                  title={`Total: $${(
                    (event.subtotal_cents + (event.fee_cents || 0)) /
                    100
                  ).toFixed(2)} (Subtotal: $${(
                    event.subtotal_cents / 100
                  ).toFixed(2)}${
                    event.fee_cents
                      ? ` + Fee: $${(event.fee_cents / 100).toFixed(2)}`
                      : ""
                  })`}
                >
                  $
                  {(() => {
                    const totalCents =
                      event.subtotal_cents + (event.fee_cents || 0);
                    return totalCents >= 99900
                      ? Math.round(totalCents / 100).toLocaleString()
                      : (totalCents / 100).toFixed(2);
                  })()}
                </span>
              ) : (
                "-"
              )}
            </div>
            <div className="text-[rgba(247,243,227,0.5)] text-xs">
              {event.subtotal_cents && event.amount_sats
                ? `$${Math.round(
                    (event.subtotal_cents + (event.fee_cents || 0)) /
                      100 /
                      (event.amount_sats / 100000000)
                  ).toLocaleString()}`
                : event.record_type === "onchain_fee"
                ? "-"
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
              <EventSummary
                amount_sats={event.amount_sats}
                subtotal_cents={event.subtotal_cents}
                fee_cents={event.fee_cents}
                transaction_type={event.transaction_type!}
              />

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

export default EventItem;
