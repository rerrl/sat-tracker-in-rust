import React from "react";
import ModalDateInput from "./ModalDateInput";
import { validateLumpsumForm } from "../utils/dateValidation";

interface LumpsumModalProps {
  isOpen: boolean;
  onClose: () => void;
  lumpsumData: {
    start_date: string;
    end_date: string;
    total_sats: string;
    total_usd: string;
    frequency: "daily" | "weekly" | "monthly";
  };
  onLumpsumDataChange: (field: string, value: any) => void;
  onCreateEvents: () => void;
}

export default function LumpsumModal({
  isOpen,
  onClose,
  lumpsumData,
  onLumpsumDataChange,
  onCreateEvents,
}: LumpsumModalProps) {
  if (!isOpen) return null;

  const isFormValid = validateLumpsumForm(
    lumpsumData.start_date,
    lumpsumData.end_date,
    lumpsumData.total_sats,
    lumpsumData.total_usd
  );

  const getPreviewText = () => {
    if (!lumpsumData.start_date || !lumpsumData.end_date || !lumpsumData.total_sats || !lumpsumData.total_usd || !lumpsumData.frequency) {
      return "Fill in all fields to see preview";
    }

    const startDate = new Date(lumpsumData.start_date);
    const endDate = new Date(lumpsumData.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let eventCount = 0;
    if (lumpsumData.frequency === "daily") {
      eventCount = diffDays + 1;
    } else if (lumpsumData.frequency === "weekly") {
      eventCount = Math.ceil(diffDays / 7);
    } else if (lumpsumData.frequency === "monthly") {
      eventCount = Math.ceil(diffDays / 30);
    }

    const satsPerEvent = Math.floor(parseInt(lumpsumData.total_sats) / eventCount);
    const usdPerEvent = (parseFloat(lumpsumData.total_usd) / eventCount).toFixed(2);
    
    // Calculate estimated BTC/USD rate
    const totalBtc = parseInt(lumpsumData.total_sats) / 100_000_000;
    const totalUsd = parseFloat(lumpsumData.total_usd);
    const estimatedBtcUsdRate = Math.round(totalUsd / totalBtc);

    return `Will create ${eventCount} buy events, each with ${satsPerEvent.toLocaleString()} sats for $${usdPerEvent} (Est. BTC/USD: $${estimatedBtcUsdRate.toLocaleString()})`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#2A2633] border border-[rgba(247,243,227,0.3)] rounded-lg w-[600px]"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(247,243,227,0.2)]">
          <h3 className="text-lg font-semibold text-[#F7F3E3]">
            Add Undocumented Lumpsum
          </h3>
          <p className="text-sm text-[rgba(247,243,227,0.6)] mt-1">
            Create multiple buy events distributed over a time period
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="border-b border-[rgba(247,243,227,0.1)] bg-[rgba(247,243,227,0.05)] px-4 py-3 text-xs">
            {/* First Row - Dates and Frequency */}
            <div
              className="grid gap-3 items-center mb-4"
              style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
            >
              <ModalDateInput
                label="Start Date"
                value={lumpsumData.start_date}
                onChange={(value) => onLumpsumDataChange("start_date", value)}
                yearInputId="start-year"
                monthInputId="start-month"
                dayInputId="start-day"
                isStartDate={true}
              />

              <ModalDateInput
                label="End Date"
                value={lumpsumData.end_date}
                onChange={(value) => onLumpsumDataChange("end_date", value)}
                yearInputId="end-year"
                monthInputId="end-month"
                dayInputId="end-day"
                isStartDate={false}
              />

              <div>
                <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
                  Frequency
                </label>
                <select
                  value={lumpsumData.frequency}
                  onChange={(e) =>
                    onLumpsumDataChange("frequency", e.target.value as "daily" | "weekly" | "monthly")
                  }
                  className="w-full bg-[#090C08] border border-[rgba(247,243,227,0.3)] text-[#F7F3E3] px-3 py-2 text-xs rounded"
                  style={{
                    backgroundColor: "#090C08",
                    color: "#F7F3E3",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="daily" style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}>
                    Daily
                  </option>
                  <option value="weekly" style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}>
                    Weekly
                  </option>
                  <option value="monthly" style={{ backgroundColor: "#090C08", color: "#F7F3E3" }}>
                    Monthly
                  </option>
                </select>
              </div>
            </div>

            {/* Second Row - Amounts */}
            <div
              className="grid gap-3 items-center"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div>
                <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
                  Total Sats
                </label>
                <input
                  type="text"
                  value={lumpsumData.total_sats}
                  onChange={(e) => onLumpsumDataChange("total_sats", e.target.value)}
                  className={`w-full bg-[#090C08] px-3 py-2 text-xs rounded ${
                    lumpsumData.total_sats &&
                    (!/^\d+$/.test(lumpsumData.total_sats) || parseInt(lumpsumData.total_sats) <= 0)
                      ? "border-2 border-red-500 text-red-400"
                      : "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]"
                  }`}
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-[rgba(247,243,227,0.8)] font-medium mb-2">
                  Total USD
                </label>
                <input
                  type="text"
                  value={lumpsumData.total_usd}
                  onChange={(e) => onLumpsumDataChange("total_usd", e.target.value)}
                  className={`w-full bg-[#090C08] px-3 py-2 text-xs rounded ${
                    lumpsumData.total_usd &&
                    (!/^\d+(\.\d{1,2})?$/.test(lumpsumData.total_usd) || parseFloat(lumpsumData.total_usd) <= 0)
                      ? "border-2 border-red-500 text-red-400"
                      : "border border-[rgba(247,243,227,0.3)] text-[#F7F3E3]"
                  }`}
                  placeholder="500.00"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-4 p-3 bg-[rgba(247,243,227,0.05)] border border-[rgba(247,243,227,0.1)] rounded">
            <p className="text-xs text-[rgba(247,243,227,0.6)] mb-2">Preview:</p>
            <p className="text-xs text-[#F7F3E3]">{getPreviewText()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(247,243,227,0.2)] flex gap-3">
          <button
            onClick={onCreateEvents}
            disabled={!isFormValid}
            className={`flex-1 py-2 px-4 text-sm rounded ${
              isFormValid
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            }`}
          >
            Create Events
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
